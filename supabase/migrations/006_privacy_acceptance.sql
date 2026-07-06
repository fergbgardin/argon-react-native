-- Aviso de Privacidade (LGPD) — aceite obrigatório por usuário.
-- Tabela profiles: um registro por usuário autenticado (auth.users), guarda
-- quando o aceite do aviso de tratamento de dados foi registrado.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  privacy_accepted_at timestamptz default null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists own_select on profiles;
drop policy if exists own_insert on profiles;
drop policy if exists own_update on profiles;

create policy own_select on profiles for select using (id = auth.uid());
create policy own_insert on profiles for insert with check (id = auth.uid());
create policy own_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Tabelas anteriores herdaram privilégios de default privileges configurados
-- na criação do projeto; esta tabela é nova e precisa do grant explícito
-- para o PostgREST (role "authenticated") conseguir ler/gravar sob RLS.
grant select, insert, update on public.profiles to authenticated;
