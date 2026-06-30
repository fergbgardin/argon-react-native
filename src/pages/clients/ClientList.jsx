import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search } from 'lucide-react'
import { clientsApi } from '../../lib/api'
import { useData } from '../../hooks/useData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ClientList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: clients, loading } = useData(() => clientsApi.list())

  if (loading) return <LoadingSpinner fullPage />

  const filtered = (clients || []).filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.whatsapp && c.whatsapp.includes(search))
  )

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <Button size="icon" onClick={() => navigate('/clientes/novo')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={!search ? 'Cadastre seu primeiro cliente.' : undefined}
            action={
              !search && (
                <Button onClick={() => navigate('/clientes/novo')}>
                  <Plus size={16} /> Novo Cliente
                </Button>
              )
            }
          />
        ) : (
          filtered.map((client) => (
            <Card
              key={client.id}
              className="p-4 flex items-center justify-between"
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">{client.nome}</p>
                  {client.alerta_saude && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                {client.whatsapp && (
                  <p className="text-xs text-muted">{client.whatsapp}</p>
                )}
                {client.cidade && (
                  <p className="text-xs text-muted">{client.cidade}{client.estado ? `, ${client.estado}` : ''}</p>
                )}
              </div>
              <span className="text-muted text-sm ml-2">›</span>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
