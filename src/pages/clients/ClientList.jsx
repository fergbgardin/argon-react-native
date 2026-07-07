import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clientsApi } from '../../lib/api'
import { useData } from '../../hooks/useData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ClientList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: clients, loading } = useData(() => clientsApi.list())

  if (loading) return <LoadingSpinner fullPage />

  const filtered = (clients || []).filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.whatsapp && c.whatsapp.includes(search))
  )

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <div
        className="sticky top-0 z-30 glass-header flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <h1 className="text-2xl font-bold text-white">{t('clients.title')}</h1>
        <Button size="icon" onClick={() => navigate('/clientes/novo')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <Input
          type="text"
          icon={Search}
          placeholder={t('clients.list.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="px-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? t('clients.list.emptySearch') : t('clients.list.emptyTitle')}
            description={!search ? t('clients.list.emptyDescription') : undefined}
            action={
              !search && (
                <Button onClick={() => navigate('/clientes/novo')}>
                  <Plus size={16} /> {t('clients.list.newClient')}
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
