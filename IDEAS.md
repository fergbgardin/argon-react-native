# InkManager — Backlog de ideias

Ideias para implementar no futuro. Não é ordem de prioridade.

## Integração com Google Calendar

Ao **salvar uma sessão agendada** (status "agendada"), criar automaticamente
um evento no Google Calendar do usuário.

Notas de implementação:
- O login já é via Google OAuth (Supabase Auth). Para criar eventos precisamos
  do escopo `https://www.googleapis.com/auth/calendar.events`, que **não** vem
  no login padrão — seria preciso pedir esse escopo adicional no
  `signInWithOAuth` (`options.scopes`) e obter o `provider_token`.
- Gatilho: no `handleSubmit` do `SessionForm`, quando `status === 'agendada'`
  (e talvez só para sessões novas, ou quando a data muda numa edição).
- Dados do evento: título "Tatuagem — {cliente} ({projeto})", data =
  `data_sessao`, local = nome do estúdio, descrição com observações.
- Guardar o `google_event_id` na sessão (nova coluna) para poder
  atualizar/remover o evento se a sessão for editada ou excluída.
- Considerar tornar opcional (toggle nas Configurações: "Sincronizar com
  Google Agenda").
- Horário: hoje a sessão só tem **data**, não hora. Para um evento decente
  seria bom adicionar um campo de **horário** à sessão (evento com hora vs.
  evento de dia inteiro).

## Outras ideias do Dashboard (discutidas, ainda não feitas)
- Comparativo mês atual vs mês anterior (% ↑↓) nos KPIs
- Receita por tipo de cobrança (por sessão vs fechado) — rosca
- Novos clientes por mês — barras
- Top clientes por valor gasto — ranking
- Distribuição de clientes por cidade/estado
