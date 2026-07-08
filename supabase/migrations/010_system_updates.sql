-- Sino de avisos/changelog — sem UI de admin, inserção manual via banco
-- (INSERT INTO system_updates ...). Corpo em texto puro, sem markdown.

create table if not exists system_updates (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  criado_em timestamptz not null default now()
);

alter table system_updates enable row level security;

-- Changelog é global e informativo — qualquer usuário autenticado pode ler,
-- não é dado por usuário como as demais tabelas (que usam user_id + RLS own_*).
drop policy if exists read_all on system_updates;
create policy read_all on system_updates for select using (true);

grant select on public.system_updates to authenticated;

alter table profiles add column if not exists ultima_atualizacao_vista_em timestamptz;

insert into system_updates (titulo, corpo) values (
  'Bem-vindo ao sino de avisos',
  'A partir de agora você recebe novidades e atualizações do sistema por aqui — sem precisar de WhatsApp ou outro canal externo.'
);
