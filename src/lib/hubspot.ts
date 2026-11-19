// Cliente HubSpot (app privado, só leitura) + conversões puras usadas na sincronização.
// Mapeamento dos campos: docs/HUBSPOT.md.
import type { CreditKind } from "./types";

const API = "https://api.hubapi.com";

// Objeto "Créditos" = objeto padrão Course renomeado
export const CREDITS_OBJECT = "0-410";

export const CONTACT_PROPS = ["firstname", "lastname", "email", "cpf", "creditos_abertos"] as const;
export const CREDIT_PROPS = [
  "hs_course_name",
  "tipo_de_movimentacao",
  "motivo_do_credito",
  "valor_total_do_credito",
  "valor_utilizado",
  "hs_createdate",
] as const;

export type HubspotConfig = { token: string };

export function hubspotConfig(env: Record<string, string | undefined> = process.env): HubspotConfig | null {
  return env.HUBSPOT_TOKEN ? { token: env.HUBSPOT_TOKEN } : null;
}

export function contactUrl(contactId: string, portal = process.env.HUBSPOT_PORTAL_ID ?? "44656712"): string {
  return `https://app.hubspot.com/contacts/${portal}/record/0-1/${contactId}`;
}

// ---------------------------------------------------------------- Conversões puras

type Props = Record<string, string | null | undefined>;

function num(v: string | null | undefined): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export type HsCredit = {
  hubspot_id: string;
  created_on: string;
  title: string;
  kind: CreditKind;
  reason: string;
  amount: number;
};

// Registro do objeto Créditos → linha do extrato.
// Tipo "Acúmulo" usa "[ACÚMULO] Valor creditado"; "Uso" usa "[USO] Valor debitado".
// Sem tipo preenchido: vale o campo de valor que estiver preenchido.
export function readCredit(id: string, p: Props, createdAt?: string): HsCredit {
  const tipo = String(p.tipo_de_movimentacao ?? "").trim();
  const credited = num(p.valor_total_do_credito);
  const debited = num(p.valor_utilizado);
  const kind: CreditKind = tipo === "Uso" ? "uso" : tipo === "Acúmulo" ? "acumulo" : debited > 0 && !credited ? "uso" : "acumulo";
  return {
    hubspot_id: id,
    created_on: String(p.hs_createdate || createdAt || new Date(0).toISOString()),
    title: String(p.hs_course_name ?? "").trim(),
    kind,
    reason: String(p.motivo_do_credito ?? "").trim(),
    amount: Math.abs(kind === "uso" ? debited : credited),
  };
}

export type HsContact = { id: string; name: string; email: string; cpf: string; balance: number };

export function readContact(id: string, p: Props): HsContact {
  return {
    id,
    name: [p.firstname, p.lastname].map((x) => String(x ?? "").trim()).filter(Boolean).join(" "),
    email: String(p.email ?? "").trim().toLowerCase(),
    cpf: String(p.cpf ?? "").trim(),
    balance: num(p.creditos_abertos),
  };
}

// ---------------------------------------------------------------- HTTP

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Novas tentativas com espera crescente em 429 e 5xx.
async function call<T>(cfg: HubspotConfig, path: string, body?: unknown, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    const res = await fetch(API + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (res.ok) return (await res.json()) as T;
    const retry = res.status === 429 || res.status >= 500;
    if (!retry || i >= tries - 1) {
      const text = await res.text().catch(() => "");
      throw new Error(`HubSpot ${res.status} em ${path}: ${text.slice(0, 300)}`);
    }
    await sleep(500 * 2 ** i);
  }
}

type BatchRead = { results: { id: string; createdAt?: string; properties: Props }[] };

export async function readContacts(cfg: HubspotConfig, ids: string[]): Promise<Map<string, HsContact>> {
  const out = new Map<string, HsContact>();
  for (const part of chunk([...new Set(ids)], 100)) {
    const r = await call<BatchRead>(cfg, "/crm/v3/objects/contacts/batch/read", {
      properties: [...CONTACT_PROPS],
      inputs: part.map((id) => ({ id })),
    });
    for (const c of r.results) out.set(c.id, readContact(c.id, c.properties));
  }
  return out;
}

// Quem é comissário: contato com a opção "Comissário" em "Condições Especiais" (seleção múltipla).
export const COMMISSIONER_PROP = "condicoes_especiais";
export const COMMISSIONER_VALUE = "Comissário";

export async function searchCommissionerContacts(cfg: HubspotConfig): Promise<HsContact[]> {
  const out: HsContact[] = [];
  let after: string | undefined;
  do {
    const r = await call<BatchRead & { paging?: { next?: { after?: string } } }>(cfg, "/crm/v3/objects/contacts/search", {
      filterGroups: [{ filters: [{ propertyName: COMMISSIONER_PROP, operator: "IN", values: [COMMISSIONER_VALUE] }] }],
      properties: [...CONTACT_PROPS],
      limit: 200,
      after,
    });
    for (const c of r.results) out.push(readContact(c.id, c.properties));
    after = r.paging?.next?.after;
  } while (after);
  return out;
}

// "Comissário desde": primeiro crédito do Programa Comissário; sem ele, o primeiro crédito do contato.
export const PROGRAM_REASON = "Programa Comissário";
export function sinceFromCredits(credits: Pick<HsCredit, "created_on" | "reason">[]): string | null {
  const day = (ts: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(ts));
  const dates = (l: typeof credits) => l.filter((c) => c.created_on).map((c) => day(c.created_on)).sort();
  return dates(credits.filter((c) => c.reason === PROGRAM_REASON))[0] ?? dates(credits)[0] ?? null;
}

// Contato → IDs dos registros de Créditos associados
export async function contactCreditIds(cfg: HubspotConfig, contactIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (const part of chunk(contactIds, 100)) {
    const r = await call<{
      results: { from: { id: string }; to: { toObjectId: number | string }[]; paging?: { next?: { after?: string } } }[];
    }>(cfg, `/crm/v4/associations/contacts/${CREDITS_OBJECT}/batch/read`, { inputs: part.map((id) => ({ id })) });
    for (const row of r.results) {
      const ids = row.to.map((t) => String(t.toObjectId));
      let after = row.paging?.next?.after;
      while (after) {
        const more = await call<{ results: { toObjectId: number | string }[]; paging?: { next?: { after?: string } } }>(
          cfg,
          `/crm/v4/objects/contacts/${row.from.id}/associations/${CREDITS_OBJECT}?limit=500&after=${encodeURIComponent(after)}`,
        );
        ids.push(...more.results.map((t) => String(t.toObjectId)));
        after = more.paging?.next?.after;
      }
      out.set(String(row.from.id), ids);
    }
  }
  return out;
}

export async function readCredits(cfg: HubspotConfig, ids: string[]): Promise<Map<string, HsCredit>> {
  const out = new Map<string, HsCredit>();
  for (const part of chunk([...new Set(ids)], 100)) {
    const r = await call<BatchRead>(cfg, `/crm/v3/objects/${CREDITS_OBJECT}/batch/read`, {
      properties: [...CREDIT_PROPS],
      inputs: part.map((id) => ({ id })),
    });
    for (const c of r.results) out.set(c.id, readCredit(c.id, c.properties, c.createdAt));
  }
  return out;
}
