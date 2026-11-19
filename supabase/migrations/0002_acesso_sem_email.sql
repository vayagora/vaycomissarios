-- Acesso sem e-mail: a Vay cria o login do comissário com uma senha provisória
-- (mandada pelo WhatsApp) e o comissário troca a senha no primeiro acesso.
-- Rode no Supabase: SQL Editor › New query › cole este arquivo › Run.

alter table public.profiles
  add column must_change_password boolean not null default false;
