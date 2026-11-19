-- Vay Agora · Portal do Comissário — esquema inicial
-- Rode no Supabase: SQL Editor › New query › cole este arquivo › Run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------

-- Comissário, importado do HubSpot pela sincronização (a Vay não cadastra à mão).
-- Comissário = contato com "Comissário" marcado em "Condições Especiais" (condicoes_especiais).
-- Não existe status de comissário. in_program é só o espelho da marcação: quem perde a marcação
-- sai da lista e do portal, mas categorias e termo ficam guardados se ela voltar.
create table public.commissioners (
  id                 uuid primary key default gen_random_uuid(),
  -- Contato no HubSpot (nome, e-mail, CPF, saldo e extrato vêm de lá)
  hubspot_contact_id text not null unique,
  name               text not null default '',
  email              text not null default '',
  -- CPF como está no HubSpot; a tela sempre mostra mascarado
  cpf                text not null default '',
  -- Marcação "Comissário" presente no HubSpot na última sincronização
  in_program         boolean not null default true,
  -- Data do primeiro crédito do Programa Comissário (ou do primeiro crédito do contato)
  since              date not null default current_date,
  -- "Saldo atual em créditos" (creditos_abertos) na última sincronização
  balance            numeric(12, 2) not null default 0,
  balance_synced_at  timestamptz,
  -- Termo de parceria (definido pela Vay, caso a caso)
  term_start         date,
  term_end           date,
  term_receives      jsonb not null default '[]'::jsonb check (jsonb_typeof(term_receives) = 'array'),
  term_can           jsonb not null default '[]'::jsonb check (jsonb_typeof(term_can) = 'array'),
  term_cannot        jsonb not null default '[]'::jsonb check (jsonb_typeof(term_cannot) = 'array'),
  created_at         timestamptz not null default now(),
  constraint term_dates check (term_start is null or term_end is null or term_end >= term_start)
);

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  full_name       text,
  role            text not null default 'comissario' check (role in ('vay', 'comissario')),
  commissioner_id uuid references public.commissioners (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Espelho dos registros do objeto "Créditos" (Course, 0-410) associados ao contato.
-- Só a sincronização grava aqui: lançamentos são criados e corrigidos no HubSpot.
create table public.credit_entries (
  id              uuid primary key default gen_random_uuid(),
  commissioner_id uuid not null references public.commissioners (id) on delete cascade,
  hubspot_id      text not null unique,
  created_on      timestamptz not null,          -- hs_createdate
  title           text not null default '',      -- hs_course_name ("Lançamento")
  kind            text not null check (kind in ('acumulo', 'uso')), -- tipo_de_movimentacao
  reason          text not null default '',      -- motivo_do_credito
  amount          numeric(12, 2) not null default 0 check (amount >= 0), -- valor creditado ou debitado
  synced_at       timestamptz not null default now()
);
create index credit_entries_commissioner_idx on public.credit_entries (commissioner_id, created_on desc);

-- Categoria de milha atribuída pela Vay. Uma por empresa por comissário.
-- Vigente até valid_until (inclusive); depois disso, encerrada (calculado pela data, sem job).
create table public.mile_categories (
  id              uuid primary key default gen_random_uuid(),
  commissioner_id uuid not null references public.commissioners (id) on delete cascade,
  company         text not null,
  tier            text not null,
  valid_until     date not null,
  updated_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  unique (commissioner_id, company),
  constraint company_tier check (
    (company = 'LATAM Pass'      and tier in ('Gold', 'Platinum', 'Black', 'Black Signature')) or
    (company = 'Smiles'          and tier in ('Prata', 'Ouro', 'Diamante')) or
    (company = 'Azul Fidelidade' and tier in ('Topázio', 'Safira', 'Diamante', 'Diamante Unique'))
  )
);

-- Login e senha que o comissário guarda para consulta própria.
-- A senha é cifrada no servidor (AES-256-GCM, CREDENTIALS_KEY) antes de chegar aqui.
-- Só o próprio comissário lê e grava (RLS); a equipe Vay não tem acesso.
create table public.program_credentials (
  commissioner_id uuid not null references public.commissioners (id) on delete cascade,
  company         text not null check (company in ('LATAM Pass', 'Smiles', 'Azul Fidelidade')),
  login           text not null default '',
  password_enc    text not null default '',
  updated_at      timestamptz not null default now(),
  primary key (commissioner_id, company)
);

-- Histórico das sincronizações com o HubSpot
create table public.sync_runs (
  id      uuid primary key default gen_random_uuid(),
  ran_at  timestamptz not null default now(),
  ok      boolean not null,
  message text not null default ''
);

-- ---------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------

create or replace function public.is_vay() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'vay');
$$;

-- Só vale enquanto o contato estiver marcado como comissário no HubSpot
create or replace function public.my_commissioner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.commissioner_id from profiles p join commissioners c on c.id = p.commissioner_id
  where p.id = auth.uid() and p.role = 'comissario' and c.in_program;
$$;

-- "Hoje" no horário de Brasília
create or replace function public.sp_today() returns date
language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Perfil criado junto com o usuário. Papel e comissário só são definidos pelo servidor
-- (convite) ou por SQL, nunca pelos metadados que o próprio usuário poderia enviar.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------

alter table public.commissioners       enable row level security;
alter table public.profiles            enable row level security;
alter table public.credit_entries      enable row level security;
alter table public.mile_categories     enable row level security;
alter table public.program_credentials enable row level security;
alter table public.sync_runs           enable row level security;

-- commissioners: o comissário lê só o próprio cadastro; só a Vay altera
create policy commissioners_select on public.commissioners for select
  using (is_vay() or id = my_commissioner_id());
create policy commissioners_write on public.commissioners for all
  using (is_vay()) with check (is_vay());

-- profiles
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or is_vay());
create policy profiles_update on public.profiles for update
  using (is_vay()) with check (is_vay());

-- credit_entries: leitura; ninguém grava pelo sistema (só a sincronização, com service_role)
create policy credit_entries_select on public.credit_entries for select
  using (is_vay() or commissioner_id = my_commissioner_id());

-- mile_categories: o comissário só vê as vigentes; a Vay vê todas e atribui com validade futura
create policy mile_categories_select on public.mile_categories for select
  using (is_vay() or (commissioner_id = my_commissioner_id() and valid_until >= sp_today()));
create policy mile_categories_insert on public.mile_categories for insert
  with check (is_vay() and valid_until > sp_today());
create policy mile_categories_update on public.mile_categories for update
  using (is_vay()) with check (is_vay() and valid_until > sp_today());
create policy mile_categories_delete on public.mile_categories for delete
  using (is_vay());

-- program_credentials: só o dono. Sem política para a Vay, de propósito.
create policy program_credentials_own on public.program_credentials for all
  using (commissioner_id = my_commissioner_id())
  with check (commissioner_id = my_commissioner_id());

-- sync_runs: só a Vay lê
create policy sync_runs_select on public.sync_runs for select
  using (is_vay());
