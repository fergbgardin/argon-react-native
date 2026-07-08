export const mock = {
  studios: [
    { id: '1', nome: 'Studio Ink', local: 'São Paulo - SP', tipo_cobranca: 'porcentagem', valor_padrao: 30, is_favorite: true },
    { id: '2', nome: 'Guest House Tattoo', local: 'Campinas - SP', tipo_cobranca: 'fixo', valor_padrao: 150, is_favorite: false },
  ],
  clients: [
    { id: '1', nome: 'Ana Lima', whatsapp: '11999990001', nascimento: '1993-06-15', cidade: 'São Paulo', estado: 'SP', alerta_saude: null },
    { id: '2', nome: 'Bruno Mendes', whatsapp: '11999990002', nascimento: '1988-06-28', cidade: 'Campinas', estado: 'SP', alerta_saude: 'Diabético tipo 2 — cuidado com cicatrização' },
    { id: '3', nome: 'Carla Souza', whatsapp: '11999990003', cidade: 'São Paulo', estado: 'SP', alerta_saude: null },
  ],
  projects: [
    {
      id: '1', client_id: '1', nome: 'Manga Japonesa', area_corpo: 'Braço direito',
      valor_total: 3500, sessoes_estimadas: 4, status: 'ativo', tipo_cobranca: 'por_sessao',
      clients: { id: '1', nome: 'Ana Lima', whatsapp: '11999990001', alerta_saude: null },
    },
    {
      id: '2', client_id: '2', nome: 'Costas completas', area_corpo: 'Costas',
      valor_total: 5000, sessoes_estimadas: 6, status: 'ativo', tipo_cobranca: 'fechado',
      clients: { id: '2', nome: 'Bruno Mendes', whatsapp: '11999990002', alerta_saude: 'Diabético tipo 2 — cuidado com cicatrização' },
    },
    {
      id: '3', client_id: '3', nome: 'Floral delicado', area_corpo: 'Antebraço',
      valor_total: 800, sessoes_estimadas: 1, status: 'concluido', tipo_cobranca: 'fechado',
      clients: { id: '3', nome: 'Carla Souza', whatsapp: '11999990003', alerta_saude: null },
    },
  ],
  sessions: [
    {
      id: '1', project_id: '1', studio_id: '1', payout_id: null,
      status: 'concluida', data_sessao: '2026-06-10',
      custo_material: 60, valor_comissao_estudio: 262.5, agulhas: 'RL #7', pigmentos: 'Intenze Black',
      session_payments: [{ id: 'p1', session_id: '1', forma: 'pix', valor: 875 }],
      projects: { id: '1', nome: 'Manga Japonesa', tipo_cobranca: 'por_sessao', valor_total: 3500, clients: { id: '1', nome: 'Ana Lima' } },
      studios: { id: '1', nome: 'Studio Ink', tipo_cobranca: 'porcentagem', valor_padrao: 30 },
    },
    {
      id: '2', project_id: '2', studio_id: '1', payout_id: null,
      status: 'concluida', data_sessao: '2026-06-18',
      custo_material: 100, valor_comissao_estudio: 375, agulhas: 'RM #9', pigmentos: null,
      session_payments: [
        { id: 'p2', session_id: '2', forma: 'pix', valor: 700 },
        { id: 'p3', session_id: '2', forma: 'dinheiro', valor: 550 },
      ],
      projects: { id: '2', nome: 'Costas completas', tipo_cobranca: 'fechado', valor_total: 5000, clients: { id: '2', nome: 'Bruno Mendes' } },
      studios: { id: '1', nome: 'Studio Ink', tipo_cobranca: 'porcentagem', valor_padrao: 30 },
    },
    {
      id: '3', project_id: '1', studio_id: '1', payout_id: null,
      status: 'agendada', data_sessao: '2026-07-05',
      custo_material: null, valor_comissao_estudio: null,
      session_payments: [],
      projects: { id: '1', nome: 'Manga Japonesa', tipo_cobranca: 'por_sessao', valor_total: 3500, clients: { id: '1', nome: 'Ana Lima' } },
      studios: { id: '1', nome: 'Studio Ink', tipo_cobranca: 'porcentagem', valor_padrao: 30 },
    },
  ],
  expenses: [
    { id: '1', descricao: 'Mensalidade Canva', valor: 89.90, categoria: 'Marketing', data_vencimento: '2026-06-30', data_pagamento: '2026-06-28' },
    { id: '2', descricao: 'Insumos (agulhas e tinta)', valor: 320, categoria: 'Insumos', data_vencimento: '2026-06-20', data_pagamento: null },
    { id: '3', descricao: 'Internet', valor: 119.90, categoria: 'Operacional', data_vencimento: '2026-07-05', data_pagamento: null },
  ],
  settings: {
    id: '1',
    custo_material_pequena: 30,
    custo_material_media: 60,
    custo_material_grande: 100,
    presets_agulhas: ['RL #3', 'RL #5', 'RL #7', 'RL #9', 'RM #5', 'RM #7', 'RS #5'],
    presets_pigmentos: ['Intenze Black', 'Dynamic Black', 'Fusion White'],
  },
  systemUpdates: [
    {
      id: '1',
      titulo: 'Bem-vindo ao sino de avisos',
      corpo: 'A partir de agora você recebe novidades e atualizações do sistema por aqui.',
      criado_em: '2026-07-07T12:00:00Z',
    },
  ],
}
