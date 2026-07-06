-- Custo de material padrão do sistema: pequena R$70, média R$150, grande
-- R$250. Usado tanto como default da coluna (linha nova sem valor
-- explícito) quanto como fallback em Settings.jsx / SessionForm.jsx quando
-- o usuário ainda não configurou nada.

alter table user_settings
  alter column custo_material_pequena set default 70,
  alter column custo_material_media set default 150,
  alter column custo_material_grande set default 250;
