-- O CLI local do Supabase (versão atual) não expõe mais tabelas
-- automaticamente para os roles da Data API por padrão (ver comentário de
-- api.auto_expose_new_tables em supabase/config.toml). Toda vez que o banco
-- local foi recriado (`supabase db reset`) sob essa versão, TODAS as tabelas
-- abaixo perderam os grants básicos de SELECT/INSERT/UPDATE/DELETE para o
-- role "authenticated" — RLS continuava certa, mas faltava a permissão de
-- base, causando "permission denied for table X" em qualquer request.

do $$
declare
  t text;
  tables text[] := array[
    'studios', 'clients', 'projects', 'sessions', 'session_payments',
    'project_payments', 'studio_payouts', 'expenses', 'user_settings', 'profiles'
  ];
begin
  foreach t in array tables loop
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end $$;
