-- Horário de início/fim da sessão — ambos opcionais. O campo de fim só faz
-- sentido preenchido depois do início (regra aplicada na UI, não no banco).
-- Usado futuramente para resolver o evento de calendário (dia inteiro, 2h de
-- fallback a partir do início, ou início+fim exatos) — a integração com
-- Google Calendar em si fica para um projeto separado.

alter table sessions add column if not exists hora_inicio time;
alter table sessions add column if not exists hora_fim time;
