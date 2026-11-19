-- Permissões das tabelas para os papéis do Supabase.
-- Projetos novos do Supabase não liberam mais automaticamente as tabelas criadas pelo SQL Editor
-- ("permission denied for table ..."). Estas permissões só deixam o banco ser consultado;
-- quem vê o quê continua decidido pelas regras de acesso (RLS) da 0001.
-- Rode no Supabase: SQL Editor › New query › cole este arquivo › Run. Pode rodar mais de uma vez.

grant usage on schema public to anon, authenticated, service_role;

-- Usuários logados: sujeitos ao RLS
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Servidor (sincronização e criação de acessos): ignora o RLS por definição
grant all on all tables in schema public to service_role;
-- Funções usadas nas regras de acesso
grant execute on all functions in schema public to authenticated, service_role;

-- Tabelas e funções criadas em migrações futuras já nascem com as mesmas permissões
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant execute on functions to authenticated, service_role;
