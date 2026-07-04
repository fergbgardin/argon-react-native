-- Multi-tenant: cada usuário só vê e edita os próprios dados.
-- Roda no Supabase SQL Editor. Idempotente onde possível.
--
-- Antes disto, as tabelas estavam sem RLS: a anon key lia/escrevia tudo,
-- então todos os usuários compartilhavam os mesmos dados.

do $$
declare
  t text;
  owner_id uuid;
  tables text[] := array[
    'studios','clients','projects','sessions','session_payments',
    'project_payments','studio_payouts','expenses','user_settings'
  ];
begin
  -- Dono das linhas já existentes (dados de teste do Fernando)
  select id into owner_id from auth.users where email = 'fernandogbg1@gmail.com' limit 1;

  foreach t in array tables loop
    -- coluna de dono, preenchida automaticamente no insert
    execute format(
      'alter table %I add column if not exists user_id uuid references auth.users(id) default auth.uid();', t);

    -- atribui os dados atuais ao dono (se houver)
    if owner_id is not null then
      execute format('update %I set user_id = %L where user_id is null;', t, owner_id);
    end if;

    -- liga RLS
    execute format('alter table %I enable row level security;', t);

    -- políticas: só o dono (recria para ser idempotente)
    execute format('drop policy if exists own_select on %I;', t);
    execute format('drop policy if exists own_insert on %I;', t);
    execute format('drop policy if exists own_update on %I;', t);
    execute format('drop policy if exists own_delete on %I;', t);

    execute format('create policy own_select on %I for select using (user_id = auth.uid());', t);
    execute format('create policy own_insert on %I for insert with check (user_id = auth.uid());', t);
    execute format('create policy own_update on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
    execute format('create policy own_delete on %I for delete using (user_id = auth.uid());', t);
  end loop;
end $$;
