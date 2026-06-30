import { supabase } from './supabase'

// ── Studios ──────────────────────────────────────────────
export const studiosApi = {
  list: () => supabase.from('studios').select('*').order('nome'),
  get: (id) => supabase.from('studios').select('*').eq('id', id).single(),
  create: (data) => supabase.from('studios').insert(data).select().single(),
  update: (id, data) => supabase.from('studios').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('studios').delete().eq('id', id),
  setFavorite: (id) =>
    supabase.rpc('set_studio_favorite', { studio_id: id }),
}

// ── Clients ──────────────────────────────────────────────
export const clientsApi = {
  list: () => supabase.from('clients').select('*').order('nome'),
  get: (id) => supabase.from('clients').select('*').eq('id', id).single(),
  create: (data) => supabase.from('clients').insert(data).select().single(),
  update: (id, data) => supabase.from('clients').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('clients').delete().eq('id', id),
}

// ── Projects ──────────────────────────────────────────────
export const projectsApi = {
  list: () =>
    supabase
      .from('projects')
      .select('*, clients(id, nome, whatsapp, alerta_saude)')
      .order('created_at', { ascending: false }),
  get: (id) =>
    supabase
      .from('projects')
      .select('*, clients(id, nome, whatsapp, alerta_saude)')
      .eq('id', id)
      .single(),
  create: (data) => supabase.from('projects').insert(data).select().single(),
  update: (id, data) => supabase.from('projects').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('projects').delete().eq('id', id),
}

// ── Sessions ──────────────────────────────────────────────
export const sessionsApi = {
  list: () =>
    supabase
      .from('sessions')
      .select('*, projects(id, nome, tipo_cobranca, valor_total, clients(id, nome)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)')
      .order('data_sessao', { ascending: false }),

  listByProject: (projectId) =>
    supabase
      .from('sessions')
      .select('*, studios(id, nome), session_payments(*)')
      .eq('project_id', projectId)
      .order('data_sessao', { ascending: false }),

  listPendingPayout: () =>
    supabase
      .from('sessions')
      .select('*, projects(id, nome, clients(id, nome)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)')
      .is('payout_id', null)
      .eq('status', 'concluida'),

  get: (id) =>
    supabase
      .from('sessions')
      .select('*, projects(id, nome, tipo_cobranca, valor_total, clients(id, nome, alerta_saude)), studios(id, nome, tipo_cobranca, valor_padrao), session_payments(*)')
      .eq('id', id)
      .single(),

  create: (data) => supabase.from('sessions').insert(data).select().single(),
  update: (id, data) => supabase.from('sessions').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('sessions').delete().eq('id', id),
}

// ── Session Payments ───────────────────────────────────────
export const sessionPaymentsApi = {
  listBySession: (sessionId) =>
    supabase.from('session_payments').select('*').eq('session_id', sessionId),

  upsertForSession: async (sessionId, payments) => {
    await supabase.from('session_payments').delete().eq('session_id', sessionId)
    if (payments.length === 0) return { data: [], error: null }
    return supabase
      .from('session_payments')
      .insert(payments.map((p) => ({ ...p, session_id: sessionId })))
      .select()
  },
}

// ── Studio Payouts ────────────────────────────────────────
export const studioPayoutsApi = {
  list: () =>
    supabase
      .from('studio_payouts')
      .select('*, studios(id, nome)')
      .order('data_pagamento', { ascending: false }),

  create: async (studioId, sessionIds, totalValue) => {
    const { data: payout, error } = await supabase
      .from('studio_payouts')
      .insert({
        studio_id: studioId,
        data_pagamento: new Date().toISOString(),
        valor_total_pago: totalValue,
      })
      .select()
      .single()

    if (error) return { data: null, error }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ payout_id: payout.id })
      .in('id', sessionIds)

    return { data: payout, error: updateError }
  },
}

// ── Expenses ──────────────────────────────────────────────
export const expensesApi = {
  list: () =>
    supabase.from('expenses').select('*').order('data_vencimento', { ascending: false }),
  create: (data) => supabase.from('expenses').insert(data).select().single(),
  update: (id, data) => supabase.from('expenses').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('expenses').delete().eq('id', id),
  markPaid: (id, date) =>
    supabase.from('expenses').update({ data_pagamento: date }).eq('id', id).select().single(),
}

// ── User Settings ─────────────────────────────────────────
export const settingsApi = {
  get: () => supabase.from('user_settings').select('*').limit(1).single(),
  upsert: (data) => supabase.from('user_settings').upsert(data).select().single(),
}

// ── File Upload ───────────────────────────────────────────
export const storageApi = {
  uploadAnamnese: async (file, sessionId) => {
    const ext = file.name.split('.').pop()
    const path = `anamnese/${sessionId}.${ext}`
    const { data, error } = await supabase.storage
      .from('inkmanager')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data: urlData } = supabase.storage.from('inkmanager').getPublicUrl(path)
    return { url: urlData.publicUrl, error: null }
  },
}
