-- Value attributed to an individual session of a "fechado" project.
-- Used to split the closed total across sessions and to compute the
-- studio commission. Not a client payment (those live at project level).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS valor_sessao NUMERIC;
