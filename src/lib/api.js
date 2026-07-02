import { supabase, isConfigured } from './supabase'
import { mock } from './mockData'

// Retorna mock quando Supabase não está configurado
function mockResponse(data) {
  return Promise.resolve({ data, error: null })
}

// ── Studios ──────────────────────────────────────────────
export const studiosApi = {
  list: () => isConfigured
    ? supabase.from('studios').select('*').order('nome')
    : mockResponse([...mock.studios]),
  get: (id) => isConfigured
    ? supabase.from('studios').select('*').eq('id', id).single()
    : mockResponse(mock.studios.find(s => s.id === id) || null),
  create: (data) => isConfigured
    ? supabase.from('studios').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID() }),
  update: (id, data) => isConfigured
    ? supabase.from('studios').update(data).eq('id', id).select().single()
    : mockResponse({ ...mock.studios.find(s => s.id === id), ...data }),
  delete: (id) => isConfigured
    ? supabase.from('studios').delete().eq('id', id)
    : mockResponse(null),
}

// ── Clients ──────────────────────────────────────────────
export const clientsApi = {
  list: () => isConfigured
    ? supabase.from('clients').select('*').order('nome')
    : mockResponse([...mock.clients]),
  get: (id) => isConfigured
    ? supabase.from('clients').select('*').eq('id', id).single()
    : mockResponse(mock.clients.find(c => c.id === id) || null),
  create: (data) => isConfigured
    ? supabase.from('clients').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID() }),
  update: (id, data) => isConfigured
    ? supabase.from('clients').update(data).eq('id', id).select().single()
    : mockResponse({ ...mock.clients.find(c => c.id === id), ...data }),
  delete: (id) => isConfigured
    ? supabase.from('clients').delete().eq('id', id)
    : mockResponse(null),
}

// ── Projects ──────────────────────────────────────────────
export const projectsApi = {
  list: () => isConfigured
    ? supabase.from('projects').select('*, clients(id, nome, whatsapp, alerta_saude)').order('created_at', { ascending: false })
    : mockResponse([...mock.projects]),
  get: (id) => isConfigured
    ? supabase.from('projects').select('*, clients(id, nome, whatsapp, alerta_saude)').eq('id', id).single()
    : mockResponse(mock.projects.find(p => p.id === id) || null),
  create: (data) => isConfigured
    ? supabase.from('projects').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID() }),
  update: (id, data) => isConfigured
    ? supabase.from('projects').update(data).eq('id', id).select().single()
    : mockResponse({ ...mock.projects.find(p => p.id === id), ...data }),
  delete: (id) => isConfigured
    ? supabase.from('projects').delete().eq('id', id)
    : mockResponse(null),
}

// ── Sessions ──────────────────────────────────────────────
export const sessionsApi = {
  list: () => isConfigured
    ? supabase.from('sessions').select('*, projects(id, nome, tipo_cobranca, valor_total, clients(id, nome)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)').order('data_sessao', { ascending: false })
    : mockResponse([...mock.sessions].sort((a, b) => b.data_sessao.localeCompare(a.data_sessao))),

  listByProject: (projectId) => isConfigured
    ? supabase.from('sessions').select('*, studios(id, nome), session_payments(*)').eq('project_id', projectId).order('data_sessao', { ascending: false })
    : mockResponse(mock.sessions.filter(s => s.project_id === projectId)),

  listPendingPayout: () => isConfigured
    ? supabase.from('sessions').select('*, projects(id, nome, clients(id, nome)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)').is('payout_id', null).eq('status', 'concluida')
    : mockResponse(mock.sessions.filter(s => !s.payout_id && s.status === 'concluida')),

  get: (id) => isConfigured
    ? supabase.from('sessions').select('*, projects(id, nome, tipo_cobranca, valor_total, clients(id, nome, alerta_saude)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)').eq('id', id).single()
    : mockResponse(mock.sessions.find(s => s.id === id) || null),

  create: (data) => isConfigured
    ? supabase.from('sessions').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID(), session_payments: [] }),
  update: (id, data) => isConfigured
    ? supabase.from('sessions').update(data).eq('id', id).select().single()
    : mockResponse({ ...mock.sessions.find(s => s.id === id), ...data }),
  delete: (id) => isConfigured
    ? supabase.from('sessions').delete().eq('id', id)
    : mockResponse(null),
}

// ── Session Payments ───────────────────────────────────────
export const sessionPaymentsApi = {
  listBySession: (sessionId) => isConfigured
    ? supabase.from('session_payments').select('*').eq('session_id', sessionId)
    : mockResponse([]),
  upsertForSession: async (sessionId, payments) => {
    if (!isConfigured) return mockResponse(payments)
    await supabase.from('session_payments').delete().eq('session_id', sessionId)
    if (payments.length === 0) return { data: [], error: null }
    return supabase.from('session_payments').insert(payments.map(p => ({ ...p, session_id: sessionId }))).select()
  },
}

// ── Project Payments ──────────────────────────────────────
export const projectPaymentsApi = {
  list: (projectId) => isConfigured
    ? supabase.from('project_payments').select('*').eq('project_id', projectId).order('data_pagamento', { ascending: false })
    : mockResponse([]),
  create: (data) => isConfigured
    ? supabase.from('project_payments').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID() }),
  delete: (id) => isConfigured
    ? supabase.from('project_payments').delete().eq('id', id)
    : mockResponse(null),
}

// ── Studio Payouts ────────────────────────────────────────
export const studioPayoutsApi = {
  list: () => isConfigured
    ? supabase.from('studio_payouts').select('*, studios(id, nome)').order('data_pagamento', { ascending: false })
    : mockResponse([]),
  create: async (studioId, sessionIds, totalValue) => {
    if (!isConfigured) return mockResponse({ id: crypto.randomUUID(), studio_id: studioId, valor_total_pago: totalValue })
    const { data: payout, error } = await supabase.from('studio_payouts').insert({ studio_id: studioId, data_pagamento: new Date().toISOString(), valor_total_pago: totalValue }).select().single()
    if (error) return { data: null, error }
    const { error: updateError } = await supabase.from('sessions').update({ payout_id: payout.id }).in('id', sessionIds)
    return { data: payout, error: updateError }
  },
}

// ── Expenses ──────────────────────────────────────────────
export const expensesApi = {
  list: () => isConfigured
    ? supabase.from('expenses').select('*').order('data_vencimento', { ascending: false })
    : mockResponse([...mock.expenses]),
  create: (data) => isConfigured
    ? supabase.from('expenses').insert(data).select().single()
    : mockResponse({ ...data, id: crypto.randomUUID() }),
  update: (id, data) => isConfigured
    ? supabase.from('expenses').update(data).eq('id', id).select().single()
    : mockResponse({ ...mock.expenses.find(e => e.id === id), ...data }),
  delete: (id) => isConfigured
    ? supabase.from('expenses').delete().eq('id', id)
    : mockResponse(null),
  markPaid: (id, date) => isConfigured
    ? supabase.from('expenses').update({ data_pagamento: date }).eq('id', id).select().single()
    : mockResponse({ ...mock.expenses.find(e => e.id === id), data_pagamento: date }),
}

// ── User Settings ─────────────────────────────────────────
export const settingsApi = {
  get: () => isConfigured
    ? supabase.from('user_settings').select('*').order('created_at', { ascending: true }).limit(1).maybeSingle()
    : mockResponse({ ...mock.settings }),
  upsert: (data) => isConfigured
    ? supabase.from('user_settings').upsert(data, { onConflict: 'id' }).select().single()
    : mockResponse(data),
}

// ── File Upload ───────────────────────────────────────────
export const storageApi = {
  uploadAnamnese: async (file, sessionId) => {
    if (!isConfigured) return { url: null, error: new Error('Supabase não configurado') }
    const ext = file.name.split('.').pop()
    const path = `anamnese/${sessionId}.${ext}`
    const { data, error } = await supabase.storage.from('inkmanager').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data: urlData } = supabase.storage.from('inkmanager').getPublicUrl(path)
    return { url: urlData.publicUrl, error: null }
  },
}
