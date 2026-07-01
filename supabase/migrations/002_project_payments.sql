create table if not exists project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  forma text not null,
  valor numeric not null,
  data_pagamento date not null default current_date,
  obs text,
  created_at timestamptz default now()
);

create index if not exists idx_project_payments_project_id on project_payments(project_id);
