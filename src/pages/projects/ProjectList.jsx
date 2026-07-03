import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Search, X } from 'lucide-react'
import { projectsApi, sessionsApi } from '../../lib/api'
import { useData } from '../../hooks/useData'
import { formatCurrency } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'success' },
  concluido: { label: 'Concluído', variant: 'default' },
  pausado: { label: 'Pausado', variant: 'warning' },
}

export default function ProjectList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ativo')
  const [search, setSearch] = useState('')
  const { data: projects, loading } = useData(() => projectsApi.list())
  const { data: sessions, loading: sLoading } = useData(() => sessionsApi.list())

  if (loading || sLoading) return <LoadingSpinner fullPage />

  // Count concluded sessions per project
  const doneByProject = {}
  ;(sessions || []).forEach((s) => {
    if (s.status === 'concluida') {
      doneByProject[s.project_id] = (doneByProject[s.project_id] || 0) + 1
    }
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
    <div className="min-h-screen bg-bg pb-nav">
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <h1 className="text-2xl font-bold text-white">Projetos</h1>
        <Button size="icon" onClick={() => navigate('/projetos/novo')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar cliente ou projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg pl-9 pr-8 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'ativo', label: 'Ativos' },
          { key: 'concluido', label: 'Concluídos' },
          { key: 'pausado', label: 'Pausados' },
          { key: 'todos', label: 'Todos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key ? 'bg-primary text-white' : 'bg-[#2A2A2A] text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto encontrado"
            action={
              filter === 'ativo' && (
                <Button onClick={() => navigate('/projetos/novo')}>
                  <Plus size={16} /> Novo Projeto
                </Button>
              )
            }
          />
        ) : (
          filtered.map((project) => {
            const cfg = statusConfig[project.status] || statusConfig.ativo
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
                      {project.tipo_cobranca === 'fechado' ? 'Fechado' : 'Por sessão'}
                      <span className="ml-1.5 text-primary/70">
                        · {doneByProject[project.id] || 0}
                        {project.sessoes_estimadas ? `/${project.sessoes_estimadas}` : ''} sessão(ões)
                      </span>
                    </p>
                  </div>
                  {project.valor_total > 0 && (
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(project.valor_total)}
                    </span>
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
