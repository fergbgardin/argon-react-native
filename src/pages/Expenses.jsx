import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Receipt, CheckCircle2, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { expensesApi } from '../lib/api'
import { formatDate, formatCurrency } from '../lib/utils'
import { useData } from '../hooks/useData'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import AmbientGlow from '../components/ui/AmbientGlow'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// value = valor gravado no banco (não traduzir — dado já existente); labelKey = rótulo exibido
const CATEGORY_OPTIONS = [
  { value: 'Marketing', labelKey: 'expenses.categories.marketing' },
  { value: 'Insumos', labelKey: 'expenses.categories.supplies' },
  { value: 'Operacional', labelKey: 'expenses.categories.operational' },
  { value: 'Aluguel/Comissão Espaço', labelKey: 'expenses.categories.rentCommission' },
  { value: 'Outros', labelKey: 'expenses.categories.other' },
]

function ExpenseForm({ onSave, onClose }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    categoria: 'Operacional',
    data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.descricao.trim()) errs.descricao = t('expenses.form.required')
    if (!form.valor) errs.valor = t('expenses.form.required')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const { error } = await expensesApi.create({
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      categoria: form.categoria,
      data_vencimento: form.data_vencimento || null,
      data_pagamento: form.data_pagamento || null,
    })
    if (!error) onSave()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label={t('expenses.form.description')}
        placeholder={t('expenses.form.descriptionPlaceholder')}
        value={form.descricao}
        onChange={(e) => handleChange('descricao', e.target.value)}
        error={errors.descricao}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('expenses.form.value')}
          type="number"
          step="0.01"
          value={form.valor}
          onChange={(e) => handleChange('valor', e.target.value)}
          error={errors.valor}
        />
        <Select
          label={t('expenses.form.category')}
          value={form.categoria}
          onChange={(e) => handleChange('categoria', e.target.value)}
        >
          {CATEGORY_OPTIONS.map(({ value, labelKey }) => (
            <option key={value} value={value}>{t(labelKey)}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('expenses.form.dueDate')}
          type="date"
          value={form.data_vencimento}
          onChange={(e) => handleChange('data_vencimento', e.target.value)}
        />
        <Input
          label={t('expenses.form.paymentDate')}
          type="date"
          value={form.data_pagamento}
          onChange={(e) => handleChange('data_pagamento', e.target.value)}
          hint={t('expenses.form.paymentHint')}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button variant="outline" full type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button full type="submit" loading={loading}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

export default function Expenses() {
  const { t } = useTranslation()
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState('pendente')
  const { data: expenses, loading, refetch } = useData(() => expensesApi.list())

  if (loading) return <LoadingSpinner fullPage />

  const filtered = (expenses || []).filter((e) => {
    if (filter === 'todas') return true
    if (filter === 'pendente') return !e.data_pagamento
    return !!e.data_pagamento
  })

  const totalPendente = (expenses || [])
    .filter((e) => !e.data_pagamento)
    .reduce((s, e) => s + (e.valor || 0), 0)

  async function handleMarkPaid(expense) {
    await expensesApi.markPaid(expense.id, new Date().toISOString().split('T')[0])
    refetch()
  }

  async function handleDelete(id) {
    await expensesApi.delete(id)
    refetch()
  }

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">{t('expenses.title')}</h1>
          {totalPendente > 0 && (
            <p className="text-xs text-amber-400 mt-0.5">
              {t('expenses.pendingAmount', { value: formatCurrency(totalPendente) })}
            </p>
          )}
        </div>
        <Button size="icon" onClick={() => setModal(true)}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Filters */}
      <div className="px-4 flex gap-2 mb-4">
        {[
          { key: 'pendente', labelKey: 'expenses.filters.pending' },
          { key: 'pago', labelKey: 'expenses.filters.paid' },
          { key: 'todas', labelKey: 'expenses.filters.all' },
        ].map(({ key, labelKey }) => (
          <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
            {t(labelKey)}
          </Chip>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t('expenses.empty.title')}
            action={
              filter === 'pendente' && (
                <Button onClick={() => setModal(true)}>
                  <Plus size={16} /> {t('expenses.newExpense')}
                </Button>
              )
            }
          />
        ) : (
          filtered.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium truncate">{expense.descricao}</p>
                    {expense.data_pagamento ? (
                      <Badge variant="success">{t('expenses.status.paid')}</Badge>
                    ) : (
                      <Badge variant="warning">{t('expenses.status.pending')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">{expense.categoria}</p>
                  <p className="text-xs text-muted">
                    {t('expenses.due', { date: formatDate(expense.data_vencimento) })}
                    {expense.data_pagamento && t('expenses.paidOn', { date: formatDate(expense.data_pagamento) })}
                  </p>
                </div>
                <p className="text-white font-semibold">{formatCurrency(expense.valor)}</p>
              </div>

              {!expense.data_pagamento && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkPaid(expense)}
                  >
                    <CheckCircle2 size={14} /> {t('expenses.markPaid')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(expense.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('expenses.modalTitle')}>
        <ExpenseForm
          onSave={() => {
            setModal(false)
            refetch()
          }}
          onClose={() => setModal(false)}
        />
      </Modal>
    </div>
  )
}
