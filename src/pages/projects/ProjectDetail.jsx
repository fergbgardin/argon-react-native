import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Edit, Trash2, AlertTriangle, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { projectsApi, sessionsApi, projectPaymentsApi } from '../../lib/api'
import { formatDate, formatCurrency, whatsappLink } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Modal from '../../components/ui/Modal'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PAYMENT_METHODS = [
  { key: 'pix', labelKey: 'common.paymentMethods.pix' },
  { key: 'credito', labelKey: 'common.paymentMethods.credito' },
  { key: 'debito', labelKey: 'common.paymentMethods.debito' },
  { key: 'dinheiro', labelKey: 'common.paymentMethods.dinheiro' },
]

export default function ProjectDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const statusConfig = {
    ativo: { label: t('common.projectStatus.active'), variant: 'success' },
    concluido: { label: t('common.projectStatus.completed'), variant: 'default' },
    pausado: { label: t('common.projectStatus.paused'), variant: 'warning' },
  }
  const [deleteModal, setDeleteModal] = useState(false)
  const [blockedModal, setBlockedModal] = useState(false)
  const [payForma, setPayForma] = useState('pix')
  const [payValor, setPayValor] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payLoading, setPayLoading] = useState(false)

  const { data: project, loading: pLoading } = useData(() => projectsApi.get(id), [id])
  const { data: sessions, loading: sLoading } = useData(() => sessionsApi.listByProject(id), [id])
  const { data: projectPayments, loading: ppLoading, refetch: reloadPayments } = useData(
    () => projectPaymentsApi.list(id), [id]
  )

  if (pLoading || sLoading || ppLoading) return <LoadingSpinner fullPage />
  if (!pLoading && !project) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-muted">{t('projects.detail.notFound')}</p>
      <button onClick={() => navigate('/projetos')} className="text-primary text-sm">{t('projects.detail.backToProjects')}</button>
    </div>
  )

  const isFechado = project.tipo_cobranca === 'fechado'
  const client = project.clients
  const cfg = statusConfig[project.status] || statusConfig.ativo
  const concludedSessions = (sessions || []).filter((s) => s.status === 'concluida')

  // Number sessions chronologically (oldest = 1)
  const sessionNumberMap = {}
  ;[...(sessions || [])]
    .sort((a, b) => a.data_sessao.localeCompare(b.data_sessao))
    .forEach((s, i) => { sessionNumberMap[s.id] = i + 1 })

  const sessoesFeitas = concludedSessions.length
  const sessoesEstimadas = project.sessoes_estimadas || 0
  const progress = sessoesEstimadas > 0 ? Math.min((sessoesFeitas / sessoesEstimadas) * 100, 100) : 0

  const totalRecebido = isFechado
    ? (projectPayments || []).reduce((sum, p) => sum + (p.valor || 0), 0)
    : concludedSessions.reduce((sum, s) => sum + (s.session_payments || []).reduce((a, p) => a + (p.valor || 0), 0), 0)

  const saldoDevedor = project.valor_total ? Math.max(project.valor_total - totalRecebido, 0) : null

  async function handleDelete() {
    await projectsApi.delete(id)
    navigate('/projetos')
  }

  function openDeleteModal() {
    if ((sessions || []).length > 0) {
      setBlockedModal(true)
      return
    }
    setDeleteModal(true)
  }

  async function handleStatusChange(status) {
    await projectsApi.update(id, { status })
    window.location.reload()
  }

  async function handleAddPayment() {
    if (!payValor || parseFloat(payValor) <= 0) return
    setPayLoading(true)
    await projectPaymentsApi.create({
      project_id: id,
      forma: payForma,
      valor: parseFloat(payValor),
      data_pagamento: payDate,
    })
    setPayValor('')
    setPayDate(new Date().toISOString().split('T')[0])
    await reloadPayments()
    setPayLoading(false)
  }

  async function handleDeletePayment(payId) {
    await projectPaymentsApi.delete(payId)
    await reloadPayments()
  }

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader
        title={project.nome}
        subtitle={client?.nome}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projetos/${id}/editar`)}>
              <Edit size={18} className="text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={openDeleteModal}>
              <Trash2 size={18} className="text-red-400" />
            </Button>
          </div>
        }
      />

      <div className="px-4 flex flex-col gap-4">
        {/* Status + client info */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            <span className="text-xs text-muted">
              {isFechado ? t('projects.detail.closedProject') : t('projects.detail.perSessionBilling')}
            </span>
          </div>

          {client?.alerta_saude && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{client.alerta_saude}</p>
            </div>
          )}

          {project.area_corpo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t('projects.detail.area')}</span>
              <span className="text-white">{project.area_corpo}</span>
            </div>
          )}

          {client?.whatsapp && (
            <a
              href={whatsappLink(client.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400"
            >
              <ExternalLink size={14} />
              {t('projects.detail.whatsapp', { phone: client.whatsapp })}
            </a>
          )}
        </Card>

        {/* Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wide">{t('projects.detail.progress')}</p>
            <p className="text-sm text-white">
              {sessoesEstimadas > 0
                ? t('projects.sessionsCountOf', { done: sessoesFeitas, estimated: sessoesEstimadas })
                : t('projects.sessionsCount', { done: sessoesFeitas })}
            </p>
          </div>
          {sessoesEstimadas > 0 && (
            <div className="w-full bg-[#2A2A2A] rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </Card>

        {/* Financial summary */}
        {(project.valor_total || totalRecebido > 0) && (
          <Card className="p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">{t('projects.detail.financial')}</p>
            <div className="flex flex-col gap-2">
              {project.valor_total && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    {isFechado ? t('projects.detail.combinedValue') : t('projects.detail.estimate')}
                  </span>
                  <span className="text-white">{formatCurrency(project.valor_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t('projects.detail.received')}</span>
                <span className="text-green-400">{formatCurrency(totalRecebido)}</span>
              </div>
              {saldoDevedor !== null && saldoDevedor > 0 && (
                <div className="flex justify-between text-sm border-t border-[#2A2A2A] pt-2 mt-1">
                  <span className="text-muted">{t('projects.detail.remainingBalance')}</span>
                  <span className="text-amber-400">{formatCurrency(saldoDevedor)}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Payment management — only for fechado projects */}
        {isFechado && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">{t('projects.detail.paymentsReceived')}</p>

            {/* Existing payments */}
            {(projectPayments || []).length > 0 && (
              <div className="flex flex-col gap-2">
                {(projectPayments || []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
                    <div>
                      <p className="text-sm text-white">
                        {(() => {
                          const m = PAYMENT_METHODS.find((m) => m.key === p.forma)
                          return m ? t(m.labelKey) : p.forma
                        })()}
                      </p>
                      <p className="text-xs text-muted">{formatDate(p.data_pagamento)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-400">{formatCurrency(p.valor)}</span>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add payment form */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_METHODS.map(({ key, labelKey }) => (
                  <Chip
                    key={key}
                    active={payForma === key}
                    onClick={() => setPayForma(key)}
                  >
                    {t(labelKey)}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted uppercase tracking-wide">{t('projects.paymentValueLabel')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={t('projects.form.valuePlaceholder')}
                    value={payValor}
                    onChange={(e) => setPayValor(e.target.value)}
                    className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted uppercase tracking-wide">{t('projects.paymentDateLabel')}</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <Button
                full
                variant="secondary"
                loading={payLoading}
                onClick={handleAddPayment}
                disabled={!payValor || parseFloat(payValor) <= 0}
              >
                <Plus size={16} /> {t('projects.detail.registerPayment')}
              </Button>
            </div>
          </Card>
        )}

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wide">{t('projects.detail.sessionsTitle')}</p>
            <Button
              size="sm"
              variant="secondary"
              className="border border-primary/40 text-primary"
              onClick={() => navigate(`/sessoes/nova?project_id=${id}`)}
            >
              <Plus size={14} /> {t('projects.detail.newSession')}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {(sessions || []).length === 0 ? (
              <p className="text-sm text-muted text-center py-4">{t('projects.detail.noSessions')}</p>
            ) : (
              (sessions || []).map((s) => (
                <Card
                  key={s.id}
                  className="p-3"
                  onClick={() => navigate(`/sessoes/${s.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{t('projects.detail.sessionNumber', { number: sessionNumberMap[s.id] })}</p>
                      <p className="text-xs text-muted">
                        {formatDate(s.data_sessao)}{s.studios?.nome ? ` · ${s.studios.nome}` : ''}
                      </p>
                    </div>
                    <Badge variant={s.status === 'concluida' ? 'success' : 'warning'}>
                      {s.status === 'concluida' ? t('common.sessionStatus.completed') : t('common.sessionStatus.scheduled')}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Status change */}
        {project.status === 'ativo' && (
          <div className="pb-6">
            <div className="flex gap-2">
              <Button variant="outline" full onClick={() => handleStatusChange('pausado')}>
                {t('projects.detail.pause')}
              </Button>
              <Button
                variant="secondary"
                full
                disabled={(sessions || []).length === 0}
                onClick={() => handleStatusChange('concluido')}
              >
                {t('projects.detail.complete')}
              </Button>
            </div>
            {(sessions || []).length === 0 && (
              <p className="text-xs text-muted mt-2 text-center">
                {t('projects.detail.needSessionToComplete')}
              </p>
            )}
          </div>
        )}
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title={t('projects.detail.deleteTitle')}>
        <p className="text-sm text-muted mb-4">
          {t('projects.detail.deleteConfirm')}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" full onClick={() => setDeleteModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" full onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      <Modal open={blockedModal} onClose={() => setBlockedModal(false)} title={t('projects.detail.blockedTitle')}>
        <p className="text-sm text-muted mb-4">
          {(sessions || []).length === 1
            ? t('projects.detail.blockedOne')
            : t('projects.detail.blockedMany', { count: (sessions || []).length })}{' '}
          {t('projects.detail.blockedSuffix')}
        </p>
        <Button full onClick={() => setBlockedModal(false)}>{t('projects.detail.gotIt')}</Button>
      </Modal>
    </div>
  )
}
