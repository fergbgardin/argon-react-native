import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { studiosApi, sessionsApi, studioPayoutsApi } from '../../lib/api'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

export default function StudioPayout() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [confirmModal, setConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: studio, loading: sLoading } = useData(() => studiosApi.get(id), [id])
  const { data: allSessions, loading: sessLoading, refetch } = useData(
    () => sessionsApi.listPendingPayout(),
    []
  )

  if (sLoading || sessLoading) return <LoadingSpinner fullPage />

  const pendingSessions = (allSessions || []).filter(
    (s) => s.studio_id === id && s.valor_comissao_estudio > 0
  )
  const total = pendingSessions.reduce((s, sess) => s + (sess.valor_comissao_estudio || 0), 0)

  async function handlePayout() {
    setLoading(true)
    const sessionIds = pendingSessions.map((s) => s.id)
    await studioPayoutsApi.create(id, sessionIds, total)
    await refetch()
    setLoading(false)
    setConfirmModal(false)
    navigate('/studios')
  }

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader title={t('studios.payout.title')} subtitle={studio?.nome} />

      <div className="px-4 flex flex-col gap-4">
        {pendingSessions.length === 0 ? (
          <Card className="p-6 text-center">
            <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-medium">{t('studios.payout.allSettled')}</p>
            <p className="text-sm text-muted mt-1">{t('studios.payout.noneNow')}</p>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card className="p-4 border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted uppercase tracking-wide">{t('studios.payout.totalToSettle')}</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(total)}</p>
              </div>
              <p className="text-xs text-muted">
                {t('studios.payout.ruleSummary', {
                  count: pendingSessions.length,
                  rule: studio?.tipo_cobranca === 'porcentagem'
                    ? `${studio?.valor_padrao}%`
                    : formatCurrency(studio?.valor_padrao),
                })}
              </p>
            </Card>

            {/* Session list */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">{t('studios.payout.includedSessions')}</p>
              <div className="flex flex-col gap-2">
                {pendingSessions.map((s) => {
                  const totalSessao = (s.session_payments || []).reduce(
                    (sum, p) => sum + (p.valor || 0), 0
                  )
                  return (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white">
                            {s.projects?.clients?.nome || '—'}
                          </p>
                          <p className="text-xs text-muted">{formatDate(s.data_sessao)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted">{t('studios.payout.total', { value: formatCurrency(totalSessao) })}</p>
                          <p className="text-sm font-semibold text-amber-400">
                            {formatCurrency(s.valor_comissao_estudio)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Button full onClick={() => setConfirmModal(true)} className="mb-6">
              {t('studios.payout.settleButton', { value: formatCurrency(total) })}
            </Button>
          </>
        )}
      </div>

      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title={t('studios.payout.confirmTitle')}>
        <p className="text-sm text-muted mb-2">
          {t('studios.payout.confirmText', { value: formatCurrency(total), studio: studio?.nome })}
        </p>
        <p className="text-xs text-muted mb-4">
          {t('studios.payout.confirmSessions', { count: pendingSessions.length })}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" full onClick={() => setConfirmModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button full loading={loading} onClick={handlePayout}>
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
