import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, CheckCircle2, Clock, Building2, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sessionsApi, studiosApi } from '../../lib/api'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import EmptyState from '../../components/ui/EmptyState'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function SessionList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const statusConfig = {
    agendada: { label: t('common.sessionStatus.scheduled'), variant: 'warning', icon: Clock },
    concluida: { label: t('common.sessionStatus.completed'), variant: 'success', icon: CheckCircle2 },
  }
  const [filter, setFilter] = useState('todas')
  const { data: sessions, loading, refetch } = useData(() => sessionsApi.list())
  const { data: studios, loading: stLoading } = useData(() => studiosApi.list())

  if (loading || stLoading) return <LoadingSpinner fullPage />

  const noStudios = (studios || []).length === 0

  const filtered = (sessions || []).filter((s) => {
    if (filter === 'todas') return true
    return s.status === filter
  })

  // Build session number per project (chronological order = #1, #2, ...)
  const sessionNumberMap = (() => {
    const byProject = {}
    ;(sessions || []).forEach((s) => {
      if (!byProject[s.project_id]) byProject[s.project_id] = []
      byProject[s.project_id].push(s)
    })
    const map = {}
    Object.values(byProject).forEach((group) => {
      group
        .slice()
        .sort((a, b) => a.data_sessao.localeCompare(b.data_sessao))
        .forEach((s, i) => { map[s.id] = i + 1 })
    })
    return map
  })()

  // Session's own monetary value: sum of session_payments (por_sessao) or
  // the valor_sessao snapshot (fechado projects, whose client payment lives
  // at the project level).
  function sessionValor(s) {
    const pagamentos = (s.session_payments || []).reduce((sum, p) => sum + (p.valor || 0), 0)
    if (pagamentos > 0) return pagamentos
    return s.valor_sessao || 0
  }

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      {/* Header */}
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <h1 className="text-2xl font-bold text-white">{t('sessions.title')}</h1>
        <Button size="icon" disabled={noStudios} onClick={() => navigate('/sessoes/nova')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Onboarding alert — needs a studio before creating a session */}
      {noStudios && (
        <div className="px-4 mb-4">
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                <Building2 size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{t('sessions.list.noStudiosTitle')}</p>
                <p className="text-xs text-muted">{t('sessions.list.noStudiosDescription')}</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/studios/novo')}>
              <Plus size={14} /> {t('studios.newStudio')}
            </Button>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'todas', label: t('sessions.filters.all') },
          { key: 'agendada', label: t('sessions.filters.scheduled') },
          { key: 'concluida', label: t('sessions.filters.completed') },
        ].map(({ key, label }) => (
          <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t('sessions.list.emptyTitle')}
            description={filter === 'todas' ? t('sessions.list.emptyDescriptionAll') : t('sessions.list.emptyDescriptionFiltered')}
            action={
              filter === 'todas' && (
                <Button disabled={noStudios} onClick={() => navigate('/sessoes/nova')}>
                  <Plus size={16} /> {t('sessions.list.newSession')}
                </Button>
              )
            }
          />
        ) : (
          filtered.map((session) => {
            const cfg = statusConfig[session.status] || statusConfig.agendada
            const isConcluded = session.status === 'concluida'
            const valor = isConcluded ? sessionValor(session) : 0
            const comissao = isConcluded ? (session.valor_comissao_estudio || 0) : 0
            const material = isConcluded ? (session.custo_material || 0) : 0
            return (
              <Card
                key={session.id}
                className="p-4"
                onClick={() => navigate(`/sessoes/${session.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-white font-medium truncate">
                      {session.projects?.clients?.nome || '—'}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {session.projects?.nome || '—'}
                      {sessionNumberMap[session.id] && (
                        <span className="ml-1.5 text-xs text-primary/70">
                          {t('sessions.list.sessionNumber', { number: sessionNumberMap[session.id] })}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(session.data_sessao)}
                        {session.hora_inicio && ` · ${session.hora_inicio.slice(0, 5)}${session.hora_fim ? `–${session.hora_fim.slice(0, 5)}` : ''}`}
                      </span>
                      {session.studios && (
                        <span className="text-xs text-muted">{session.studios.nome}</span>
                      )}
                    </div>
                  </div>
                  {(valor > 0 || comissao > 0 || material > 0) && (
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      {valor > 0 && (
                        <p className="text-white font-semibold">{formatCurrency(valor)}</p>
                      )}
                      {comissao > 0 && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          -{formatCurrency(comissao)}
                          <Building2 size={11} />
                        </p>
                      )}
                      {material > 0 && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          -{formatCurrency(material)}
                          <Syringe size={11} />
                        </p>
                      )}
                    </div>
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
