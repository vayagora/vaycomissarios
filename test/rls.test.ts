// Testes de regras de acesso (RLS) no banco, com as migrações reais.
// Simula o mínimo do Supabase: esquema auth, auth.uid() e o papel "authenticated".
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

const url = inject("pgUrl");
const MIG = path.resolve(__dirname, "../supabase/migrations");

const SUPABASE_STUB = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
`;

const GRANTS = `
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
`;

const ID = {
  vay: "10000000-0000-0000-0000-000000000001",
  ua: "10000000-0000-0000-0000-000000000002",
  ub: "10000000-0000-0000-0000-000000000003",
  ca: "20000000-0000-0000-0000-00000000000a",
  cb: "20000000-0000-0000-0000-00000000000b",
  catActive: "30000000-0000-0000-0000-000000000001",
  catEnded: "30000000-0000-0000-0000-000000000002",
  catToday: "30000000-0000-0000-0000-000000000003",
  catB: "30000000-0000-0000-0000-000000000004",
};

describe.skipIf(!url)("RLS · regras de acesso", () => {
  let db: Client;

  // Executa como um usuário logado (RLS ativo) e desfaz tudo no fim.
  async function as<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    await db.query("begin");
    try {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
      await db.query("set local role authenticated");
      return await fn();
    } finally {
      await db.query("rollback");
    }
  }
  const rows = async (q: string, p: unknown[] = []) => (await db.query(q, p)).rows;
  const count = async (q: string, p: unknown[] = []) => (await db.query(q, p)).rowCount;
  async function denied(q: string, p: unknown[] = [], re = /row-level security/) {
    await db.query("savepoint deny");
    await expect(db.query(q, p)).rejects.toThrow(re);
    await db.query("rollback to savepoint deny");
  }

  beforeAll(async () => {
    db = new Client({ connectionString: url });
    await db.connect();
    await db.query("drop schema if exists public cascade; create schema public;");
    await db.query(SUPABASE_STUB);
    for (const f of fs.readdirSync(MIG).filter((x) => x.endsWith(".sql")).sort()) await db.query(fs.readFileSync(path.join(MIG, f), "utf8"));
    await db.query(GRANTS);

    await db.query(`insert into auth.users (id, email) values ($1, 'vay@vayagora.com.br'), ($2, 'a@x.com'), ($3, 'b@x.com')`, [ID.vay, ID.ua, ID.ub]);
    await db.query(`insert into commissioners (id, name, email, balance) values ($1, 'Ana', 'a@x.com', 100), ($2, 'Bruno', 'b@x.com', 200)`, [ID.ca, ID.cb]);
    await db.query(`update profiles set role = 'vay' where id = $1`, [ID.vay]);
    await db.query(`update profiles set commissioner_id = $2 where id = $1`, [ID.ua, ID.ca]);
    await db.query(`update profiles set commissioner_id = $2 where id = $1`, [ID.ub, ID.cb]);
    await db.query(
      `insert into credit_entries (commissioner_id, hubspot_id, created_on, kind, amount) values
       ($1, 'h1', now(), 'acumulo', 50), ($2, 'h2', now(), 'uso', 20)`,
      [ID.ca, ID.cb],
    );
    await db.query(
      `insert into mile_categories (id, commissioner_id, company, tier, valid_until) values
       ($1, $5, 'LATAM Pass', 'Black', sp_today() + 100),
       ($2, $5, 'Smiles', 'Diamante', sp_today() - 1),
       ($3, $5, 'Azul Fidelidade', 'Safira', sp_today()),
       ($4, $6, 'LATAM Pass', 'Gold', sp_today() + 10)`,
      [ID.catActive, ID.catEnded, ID.catToday, ID.catB, ID.ca, ID.cb],
    );
    await db.query(`insert into program_credentials (commissioner_id, company, login, password_enc) values ($1, 'LATAM Pass', 'ana', 'v1:x:y:z')`, [ID.ca]);
    await db.query(`insert into sync_runs (ok, message) values (true, 'ok')`);
  });

  afterAll(async () => {
    await db?.end();
  });

  it("perfil nasce como comissário, sem cadastro ligado", async () => {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ('10000000-0000-0000-0000-0000000000ff', 'n@x.com', '{"role":"vay"}')`);
    const [p] = await rows(`select role, commissioner_id from profiles where id = '10000000-0000-0000-0000-0000000000ff'`);
    expect(p).toEqual({ role: "comissario", commissioner_id: null });
  });

  describe("comissário", () => {
    it("vê só o próprio cadastro", () =>
      as(ID.ua, async () => {
        expect((await rows(`select id from commissioners`)).map((r) => r.id)).toEqual([ID.ca]);
      }));

    it("não altera o próprio cadastro (saldo, termo) nem o perfil", () =>
      as(ID.ua, async () => {
        expect(await count(`update commissioners set balance = 999999, term_can = '["tudo"]'`)).toBe(0);
        expect(await count(`update profiles set role = 'vay' where id = $1`, [ID.ua])).toBe(0);
        await denied(`insert into commissioners (name, email) values ('X', 'x@x.com')`);
      }));

    it("vê só os próprios lançamentos e não lança créditos", () =>
      as(ID.ua, async () => {
        expect((await rows(`select hubspot_id from credit_entries`)).map((r) => r.hubspot_id)).toEqual(["h1"]);
        await denied(`insert into credit_entries (commissioner_id, hubspot_id, created_on, kind, amount) values ($1, 'x', now(), 'acumulo', 1000)`, [ID.ca]);
        expect(await count(`update credit_entries set amount = 1000`)).toBe(0);
        expect(await count(`delete from credit_entries`)).toBe(0);
      }));

    it("vê só as próprias categorias vigentes (inclusive a que vence hoje)", () =>
      as(ID.ua, async () => {
        const ids = (await rows(`select id from mile_categories order by id`)).map((r) => r.id);
        expect(ids).toEqual([ID.catActive, ID.catToday]);
      }));

    it("não atribui nem exclui categorias", () =>
      as(ID.ua, async () => {
        await denied(`insert into mile_categories (commissioner_id, company, tier, valid_until) values ($1, 'Smiles', 'Ouro', sp_today() + 30)`, [ID.ca]);
        expect(await count(`update mile_categories set valid_until = sp_today() + 999`)).toBe(0);
        expect(await count(`delete from mile_categories`)).toBe(0);
      }));

    it("guarda e lê só os próprios dados de acesso", async () => {
      await as(ID.ua, async () => {
        expect(await rows(`select login from program_credentials`)).toEqual([{ login: "ana" }]);
        await db.query(`insert into program_credentials (commissioner_id, company, login) values ($1, 'Smiles', 'ana2')`, [ID.ca]);
        await denied(`insert into program_credentials (commissioner_id, company, login) values ($1, 'Smiles', 'invasor')`, [ID.cb]);
      });
      await as(ID.ub, async () => {
        expect(await rows(`select * from program_credentials`)).toEqual([]);
        expect(await count(`update program_credentials set login = 'x'`)).toBe(0);
      });
    });

    it("não vê o histórico de sincronização", () =>
      as(ID.ua, async () => {
        expect(await rows(`select * from sync_runs`)).toEqual([]);
      }));
  });

  describe("equipe Vay", () => {
    it("vê todos os comissários, lançamentos e categorias (inclusive encerradas)", () =>
      as(ID.vay, async () => {
        expect((await rows(`select id from commissioners`)).length).toBe(2);
        expect((await rows(`select id from credit_entries`)).length).toBe(2);
        expect((await rows(`select id from mile_categories`)).length).toBe(4);
      }));

    it("NÃO vê os dados de acesso (senhas) dos comissários", () =>
      as(ID.vay, async () => {
        expect(await rows(`select * from program_credentials`)).toEqual([]);
        expect(await count(`update program_credentials set password_enc = ''`)).toBe(0);
      }));

    it("não lança créditos pelo sistema", () =>
      as(ID.vay, async () => {
        await denied(`insert into credit_entries (commissioner_id, hubspot_id, created_on, kind, amount) values ($1, 'x', now(), 'acumulo', 10)`, [ID.ca]);
        expect(await count(`update credit_entries set amount = 0`)).toBe(0);
      }));

    it("atribui categoria só com validade futura", () =>
      as(ID.vay, async () => {
        await db.query(`insert into mile_categories (commissioner_id, company, tier, valid_until) values ($1, 'Smiles', 'Ouro', sp_today() + 1)`, [ID.cb]);
        await denied(`insert into mile_categories (commissioner_id, company, tier, valid_until) values ($1, 'Azul Fidelidade', 'Safira', sp_today())`, [ID.cb]);
        await denied(`update mile_categories set valid_until = sp_today() - 5 where id = $1`, [ID.catB]);
      }));

    it("uma categoria por empresa: atribuir de novo substitui (upsert)", () =>
      as(ID.vay, async () => {
        await db.query(
          `insert into mile_categories (commissioner_id, company, tier, valid_until) values ($1, 'LATAM Pass', 'Platinum', sp_today() + 200)
           on conflict (commissioner_id, company) do update set tier = excluded.tier, valid_until = excluded.valid_until`,
          [ID.cb],
        );
        expect(await rows(`select tier from mile_categories where commissioner_id = $1 and company = 'LATAM Pass'`, [ID.cb])).toEqual([{ tier: "Platinum" }]);
      }));

    it("recusa categoria que não existe na empresa", () =>
      as(ID.vay, async () => {
        await denied(`insert into mile_categories (commissioner_id, company, tier, valid_until) values ($1, 'Smiles', 'Black', sp_today() + 10)`, [ID.cb], /company_tier/);
      }));

    it("exclui categoria (vigente ou encerrada)", () =>
      as(ID.vay, async () => {
        expect(await count(`delete from mile_categories where id in ($1, $2)`, [ID.catActive, ID.catEnded])).toBe(2);
      }));

    it("edita o termo; fim antes do início é recusado", () =>
      as(ID.vay, async () => {
        expect(await count(`update commissioners set term_start = '2024-03-12', term_end = '2027-03-31', term_can = '["a"]' where id = $1`, [ID.ca])).toBe(1);
        await denied(`update commissioners set term_start = '2027-01-01', term_end = '2026-01-01' where id = $1`, [ID.ca], /term_dates/);
      }));
  });
});
