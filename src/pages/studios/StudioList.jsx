import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Star } from 'lucide-react'
import { studiosApi, sessionsApi } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function StudioList() {
  const navigate = useNavigate()
  const { data: studios, loading: sLoading } = useData(() => studiosApi.list())
  const { data: sessions, loading: sessLoading } = useData(() => sessionsApi.listPendingPayout())

  if (sLoading || sessLoading) return <LoadingSpinner fullPage />

  // Aggregate pending by studio (only sessions that actually owe commission)
  const pendingByStudio = {}
  ;(sessions || []).forEach((s) => {
    if (!(s.valor_comissao_estudio > 0)) return
    const sid = s.studio_id
    if (!pendingByStudio[sid]) pendingByStudio[sid] = { total: 0, count: 0 }
    pendingByStudio[sid].total += s.valor_comissao_estudio
    pendingByStudio[sid].count += 1
  })

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estúdios</h1>
          <p className="text-xs text-muted">Contas e acertos</p>
        </div>
        <Button size="icon" onClick={() => navigate('/studios/novo')}>
          <Plus size={18} />
        </Button>
      </div>

      {/* Pending payout summary */}
      {Object.keys(pendingByStudio).length > 0 && (
        <div className="px-4 mb-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            Pendências de repasse
          </p>
          <div className="flex flex-col gap-2">
            {(studios || [])
              .filter((s) => pendingByStudio[s.id])
              .map((studio) => {
                const pending = pendingByStudio[studio.id]
                return (
                  <Card
                    key={studio.id}
                    className="p-3 border-amber-500/20"
                    onClick={() => navigate(`/studios/${studio.id}/acerto`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{studio.nome}</p>
                        <p className="text-xs text-muted">{pending.count} sessão(ões) pendente(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-400">
                          {formatCurrency(pending.total)}
                        </p>
                        <p className="text-xs text-amber-400/60">Dar baixa →</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
          </div>
        </div>
      )}

      {/* All studios */}
      <div className="px-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Todos os estúdios</p>
        <div className="flex flex-col gap-2">
          {(studios || []).length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhum estúdio cadastrado"
              action={
                <Button onClick={() => navigate('/studios/novo')}>
                  <Plus size={16} /> Novo Estúdio
                </Button>
              }
            />
          ) : (
            (studios || []).map((studio) => (
              <Card
                key={studio.id}
                className="p-4 flex items-center justify-between"
                onClick={() => navigate(`/studios/${studio.id}/editar`)}
              >
                <div className="flex items-center gap-3">
                  {studio.is_favorite && (
                    <Star size={14} className="text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-white font-medium">{studio.nome}</p>
                    {studio.local && (
                      <p className="text-xs text-muted">{studio.local}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">
                    {studio.tipo_cobranca === 'porcentagem'
                      ? `${studio.valor_padrao}%`
                      : formatCurrency(studio.valor_padrao)}
                  </p>
                  <p className="text-xs text-muted">
                    {studio.tipo_cobranca === 'porcentagem' ? 'comissão' : 'fixo/sessão'}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
