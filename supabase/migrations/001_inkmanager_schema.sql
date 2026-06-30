-- InkManager — Schema SQL
-- Execute no SQL Editor do Supabase

-- ── Studios ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  local TEXT,
  tipo_cobranca TEXT NOT NULL CHECK (tipo_cobranca IN ('porcentagem', 'fixo')),
  valor_padrao FLOAT NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Clients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cpf TEXT,
  nascimento DATE,
  cidade TEXT,
  estado TEXT,
  alerta_saude TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Projects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_corpo TEXT,
  valor_total FLOAT,
  sessoes_estimadas INTEGER,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'pausado')),
  tipo_cobranca TEXT NOT NULL DEFAULT 'por_sessao' CHECK (tipo_cobranca IN ('fechado', 'por_sessao')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Studio Payouts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studio_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  valor_total_pago FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES studio_payouts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'concluida')),
  data_sessao DATE NOT NULL,
  foto_anamnese_url TEXT,
  custo_material FLOAT,
  valor_comissao_estudio FLOAT,
  agulhas TEXT,
  pigmentos TEXT,
  obs TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Session Payments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  forma TEXT NOT NULL CHECK (forma IN ('pix', 'credito', 'debito', 'dinheiro')),
  valor FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Expenses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor FLOAT NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'Operacional',
  data_vencimento DATE,
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── User Settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custo_material_pequena FLOAT DEFAULT 30,
  custo_material_media FLOAT DEFAULT 60,
  custo_material_grande FLOAT DEFAULT 100,
  presets_agulhas JSONB DEFAULT '["RL #3","RL #5","RL #7","RL #9","RM #5","RM #7","RS #5"]',
  presets_pigmentos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_studio ON sessions(studio_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_payout ON sessions(payout_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_session ON session_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ── Storage bucket ────────────────────────────────────────
-- Criar manualmente no dashboard: Storage > New bucket > "inkmanager" (public)

-- ── Dados iniciais ────────────────────────────────────────
INSERT INTO user_settings (custo_material_pequena, custo_material_media, custo_material_grande)
VALUES (30, 60, 100)
ON CONFLICT DO NOTHING;
