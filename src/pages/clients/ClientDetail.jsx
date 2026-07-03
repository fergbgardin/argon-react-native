import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit, Trash2, AlertTriangle, ExternalLink, Plus } from 'lucide-react'
import { clientsApi, projectsApi } from '../../lib/api'
import { formatDate, whatsappLink } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState(false)

  const { data: client, loading: cLoading } = useData(() => clientsApi.get(id), [id])
  const { data: projects, loading: pLoading } = useData(
    () => projectsApi.list().then(({ data, error }) => ({
      data: (data || []).filter((p) => p.client_id === id),
      error,
    })),
    [id]
  )

  if (cLoading) return <LoadingSpinner fullPage />
  if (!cLoading && !client) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-muted">Cliente não encontrado</p>
      <button onClick={() => navigate('/clientes')} className="text-primary text-sm">← Voltar para clientes</button>
    </div>
  )

  async function handleDelete() {
    await clientsApi.delete(id)
    navigate(-1)
  }

  const statusConfig = {
    ativo: { label: 'Ativo', variant: 'success' },
    concluido: { label: 'Concluído', variant: 'default' },
    pausado: { label: 'Pausado', variant: 'warning' },
  }

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader
        title={client.nome}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${id}/editar`)}>
              <Edit size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteModal(true)}>
              <Trash2 size={18} className="text-red-400" />
            </Button>
          </div>
        }
      />

      <div className="px-4 flex flex-col gap-4">
        {/* Health alert */}
        {client.alerta_saude && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-0.5">Alerta de saúde</p>
              <p className="text-sm text-red-300">{client.alerta_saude}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <Card className="p-4 flex flex-col gap-3">
          {client.whatsapp && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">WhatsApp</span>
              <a
                href={whatsappLink(client.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-400"
              >
                {client.whatsapp} <ExternalLink size={12} />
              </a>
            </div>
          )}
          {client.nascimento && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Nascimento</span>
              <span className="text-sm text-white">{formatDate(client.nascimento)}</span>
            </div>
          )}
          {client.cpf && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">CPF</span>
              <span className="text-sm text-white">{client.cpf}</span>
            </div>
          )}
          {(client.cidade || client.estado) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Localização</span>
              <span className="text-sm text-white">
                {[client.cidade, client.estado].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </Card>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wide">Projetos</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/projetos/novo?client_id=${id}`)}
            >
              <Plus size={14} /> Novo projeto
            </Button>
          </div>

          {pLoading ? (
            <p className="text-sm text-muted text-center py-4">Carregando...</p>
          ) : (projects || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Nenhum projeto vinculado</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(projects || []).map((p) => {
                const cfg = statusConfig[p.status] || statusConfig.ativo
                return (
                  <Card
                    key={p.id}
                    className="p-3 flex items-center justify-between"
                    onClick={() => navigate(`/projetos/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm text-white">{p.nome}</p>
                      {p.area_corpo && <p className="text-xs text-muted">{p.area_corpo}</p>}
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir cliente">
        <p className="text-sm text-muted mb-4">
          Tem certeza? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" full onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" full onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
