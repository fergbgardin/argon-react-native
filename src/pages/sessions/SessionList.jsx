import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, CheckCircle2, Clock } from 'lucide-react'
import { sessionsApi } from '../../lib/api'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusConfig = {
  agendada: { label: 'Agendada', variant: 'warning', icon: Clock },
  concluida: { label: 'Concluída', variant: 'success', icon: CheckCircle2 },
}

export default function SessionList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('todas')
  const { data: sessions, loading, refetch } = useData(() => sessionsApi.list())

  if (loading) return <LoadingSpinner fullPage />

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

  function sessionTotal(s) {
    return (s.session_payments || []).reduce((sum, p) => sum + (p.valor || 0), 0)
  }

  return (
    <div className="min-h-screen bg-bg pb-nav">
      {/* Header */}
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <h1 className="text-2xl font-bold text-white">Sessões</h1>
        <Button size="icon" onClick={() => navigate('/sessoes/nova')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Filters */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'agendada', label: 'Agendadas' },
          { key: 'concluida', label: 'Concluídas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-primary text-white'
                : 'bg-[#2A2A2A] text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhuma sessão encontrada"
            description={filter === 'todas' ? 'Adicione sua primeira sessão.' : 'Nenhuma sessão com este filtro.'}
            action={
              filter === 'todas' && (
                <Button onClick={() => navigate('/sessoes/nova')}>
                  <Plus size={16} /> Nova Sessão
                </Button>
              )
            }
          />
        ) : (
          filtered.map((session) => {
            const cfg = statusConfig[session.status] || statusConfig.agendada
            const total = sessionTotal(session)
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
                          · Sessão {sessionNumberMap[session.id]}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(session.data_sessao)}
                      </span>
                      {session.studios && (
                        <span className="text-xs text-muted">{session.studios.nome}</span>
                      )}
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-semibold">{formatCurrency(total)}</p>
                      {session.valor_comissao_estudio > 0 && (
                        <p className="text-xs text-muted">
                          -{formatCurrency(session.valor_comissao_estudio)}
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
