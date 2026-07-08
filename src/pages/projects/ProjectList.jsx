import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Search, X, Building2, Syringe, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { projectsApi, sessionsApi, clientsApi } from '../../lib/api'
import { useData } from '../../hooks/useData'
import { formatCurrency } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ProjectList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const statusConfig = {
    ativo: { label: t('common.projectStatus.active'), variant: 'success' },
    concluido: { label: t('common.projectStatus.completed'), variant: 'default' },
    pausado: { label: t('common.projectStatus.paused'), variant: 'warning' },
  }
  const [filter, setFilter] = useState('ativo')
  const [search, setSearch] = useState('')
  const { data: projects, loading } = useData(() => projectsApi.list())
  const { data: sessions, loading: sLoading } = useData(() => sessionsApi.list())
  const { data: clients, loading: cLoading } = useData(() => clientsApi.list())

  if (loading || sLoading || cLoading) return <LoadingSpinner fullPage />

  const noClients = (clients || []).length === 0

  // Count concluded sessions per project
  const doneByProject = {}
  ;(sessions || []).forEach((s) => {
    if (s.status === 'concluida') {
      doneByProject[s.project_id] = (doneByProject[s.project_id] || 0) + 1
    }
  })

  // Session's own monetary value: sum of session_payments (por_sessao) or
  // the valor_sessao snapshot (fechado projects, whose client payment lives
  // at the project level).
  function sessionValor(s) {
    const pagamentos = (s.session_payments || []).reduce((sum, p) => sum + (p.valor || 0), 0)
    if (pagamentos > 0) return pagamentos
    return s.valor_sessao || 0
  }

  // Financial summary per project, considering only concluded sessions
  // (financeiro só considera sessão concluída, mesma regra de SessionList).
  const financeByProject = {}
  ;(sessions || []).forEach((s) => {
    if (s.status !== 'concluida') return
    const entry = financeByProject[s.project_id] || { valor: 0, comissao: 0, material: 0 }
    entry.valor += sessionValor(s)
    entry.comissao += s.valor_comissao_estudio || 0
    entry.material += s.custo_material || 0
    financeByProject[s.project_id] = entry
  })

  const normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') || ''

  const filtered = (projects || []).filter((p) => {
    const statusOk = filter === 'todos' || p.status === filter
    if (!statusOk) return false
    if (!search.trim()) return true
    const q = normalize(search)
    return normalize(p.clients?.nome).includes(q) || normalize(p.nome).includes(q)
  })

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <h1 className="text-2xl font-bold text-white">{t('projects.title')}</h1>
        <Button size="icon" disabled={noClients} onClick={() => navigate('/projetos/novo')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Onboarding alert — needs a client before creating a project */}
      {noClients && (
        <div className="px-4 mb-4">
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                <Users size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{t('projects.list.noClientsTitle')}</p>
                <p className="text-xs text-muted">{t('projects.list.noClientsDescription')}</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/clientes/novo')}>
              <Plus size={14} /> {t('clients.list.newClient')}
            </Button>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="px-4 mb-3">
        <Input
          type="text"
          icon={Search}
          placeholder={t('projects.list.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          right={
            search && (
              <button onClick={() => setSearch('')} className="pointer-events-auto">
                <X size={14} />
              </button>
            )
          }
        />
      </div>

      <div className="px-4 flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'ativo', label: t('projects.list.filters.active') },
          { key: 'concluido', label: t('projects.list.filters.completed') },
          { key: 'pausado', label: t('projects.list.filters.paused') },
          { key: 'todos', label: t('projects.list.filters.all') },
        ].map(({ key, label }) => (
          <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('projects.list.emptyTitle')}
            action={
              filter === 'ativo' && (
                <Button disabled={noClients} onClick={() => navigate('/projetos/novo')}>
                  <Plus size={16} /> {t('projects.list.newProject')}
                </Button>
              )
            }
          />
        ) : (
          filtered.map((project) => {
            const cfg = statusConfig[project.status] || statusConfig.ativo
            const isFechado = project.tipo_cobranca === 'fechado'
            const finance = financeByProject[project.id] || { valor: 0, comissao: 0, material: 0 }
            return (
              <Card
                key={project.id}
                className="p-4"
                onClick={() => navigate(`/projetos/${project.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{project.nome}</p>
                    <p className="text-sm text-muted truncate">{project.clients?.nome}</p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {project.area_corpo && (
                      <p className="text-xs text-muted">{project.area_corpo}</p>
                    )}
                    <p className="text-xs text-muted">
                      {project.tipo_cobranca === 'fechado' ? t('projects.billingType.closed') : t('projects.billingType.perSession')}
                      <span className="ml-1.5 text-primary/70">
                        · {project.sessoes_estimadas
                          ? t('projects.sessionsCountOf', { done: doneByProject[project.id] || 0, estimated: project.sessoes_estimadas })
                          : t('projects.sessionsCount', { done: doneByProject[project.id] || 0 })}
                      </span>
                    </p>
                  </div>
                  {isFechado ? (
                    project.valor_total > 0 && (
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(project.valor_total)}
                      </span>
                    )
                  ) : (
                    (finance.valor > 0 || finance.comissao > 0 || finance.material > 0) && (
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                        {finance.valor > 0 && (
                          <p className="text-white font-semibold">{formatCurrency(finance.valor)}</p>
                        )}
                        {finance.comissao > 0 && (
                          <p className="text-xs text-muted flex items-center gap-1">
                            -{formatCurrency(finance.comissao)}
                            <Building2 size={11} />
                          </p>
                        )}
                        {finance.material > 0 && (
                          <p className="text-xs text-muted flex items-center gap-1">
                            -{formatCurrency(finance.material)}
                            <Syringe size={11} />
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
