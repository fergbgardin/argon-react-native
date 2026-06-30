import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban } from 'lucide-react'
import { projectsApi } from '../../lib/api'
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
  const { data: projects, loading } = useData(() => projectsApi.list())

  if (loading) return <LoadingSpinner fullPage />

  const filtered = (projects || []).filter((p) => {
    if (filter === 'todos') return true
    return p.status === filter
  })

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Projetos</h1>
        <Button size="icon" onClick={() => navigate('/projetos/novo')}>
          <Plus size={18} />
        </Button>
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
