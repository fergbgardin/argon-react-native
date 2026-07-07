import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Edit, Trash2, AlertTriangle, Camera, ExternalLink, CheckCircle2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sessionsApi, storageApi } from '../../lib/api'
import { formatDate, formatCurrency, whatsappLink } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function SessionDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: session, loading, refetch } = useData(() => sessionsApi.get(id), [id])

  const [completing, setCompleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef()


  if (loading) return <LoadingSpinner fullPage />
  if (!loading && !session) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-muted">{t('sessions.detail.notFound')}</p>
      <button onClick={() => navigate('/sessoes')} className="text-primary text-sm">{t('sessions.detail.backToSessions')}</button>
    </div>
  )

  const client = session.projects?.clients
  const project = session.projects
  const isFechado = project?.tipo_cobranca === 'fechado'
  const studio = session.studios
  const payments = session.session_payments || []
  const totalPago = payments.reduce((s, p) => s + (p.valor || 0), 0)

  async function handleDelete() {
    await sessionsApi.delete(id)
    navigate(-1)
  }

  async function handleComplete() {
    setCompleting(true)
    // Only flip the status — financials were already filled in the session form
    await sessionsApi.update(id, { status: 'concluida' })
    await refetch()
    setCompleting(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploadLoading(true)
    const { url, error } = await storageApi.uploadAnamnese(file, id)
    if (error || !url) {
      setPhotoPreview(null)
      alert(t('sessions.detail.photoUploadError', { reason: error?.message || t('sessions.detail.photoUploadFallbackReason') }))
    } else {
      await sessionsApi.update(id, { foto_anamnese_url: url })
      await refetch()
      setPhotoPreview(null)
    }
    setUploadLoading(false)
  }


  const isAgendada = session.status === 'agendada'

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader
        title={client?.nome || t('sessions.detail.fallbackTitle')}
        subtitle={project?.nome}
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/sessoes/${id}/editar`)}
            >
              <Edit size={18} className="text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteModal(true)}
            >
              <Trash2 size={18} className="text-red-400" />
            </Button>
          </div>
        }
      />

      <div className="px-4 flex flex-col gap-4">
        {/* Status + Basic Info */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge variant={isAgendada ? 'warning' : 'success'}>
              {isAgendada ? t('common.sessionStatus.scheduled') : t('common.sessionStatus.completed')}
            </Badge>
            <span className="text-sm text-muted">{formatDate(session.data_sessao)}</span>
          </div>

          {client?.alerta_saude && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{client.alerta_saude}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Row label={t('sessions.detail.client')} value={client?.nome} />
            <Row label={t('sessions.detail.project')} value={project?.nome} />
            <Row label={t('sessions.detail.studio')} value={studio?.nome} />
          </div>

          {client?.whatsapp && (
            <a
              href={whatsappLink(client.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400"
            >
              <ExternalLink size={14} />
              {t('sessions.detail.whatsapp', { phone: client.whatsapp })}
            </a>
          )}
        </Card>

        {/* Technical details */}
        <Card className="p-4 flex flex-col gap-2">
          <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.detail.technicalDetails')}</p>
          {session.agulhas ? (
            <div>
              <p className="text-xs text-muted mb-1.5">{t('sessions.detail.needles')}</p>
              <div className="flex flex-wrap gap-2">
                {session.agulhas.split(', ').filter(Boolean).map((a) => (
                  <span
                    key={a}
                    className="text-xs bg-[#2A2A2A] border border-[#333] rounded-full px-2.5 py-1 text-white"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">{t('sessions.detail.noNeedles')}</p>
          )}
        </Card>

        {/* Financial info — shown when concluded, a payment exists, or a session value was set */}
        {(!isAgendada || payments.length > 0 || session.valor_sessao > 0) && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.detail.financial')}</p>

            {isFechado ? (
              <div className="flex flex-col gap-1">
                {session.valor_sessao > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t('sessions.detail.sessionValue')}</span>
                    <span className="text-white">{formatCurrency(session.valor_sessao)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t('sessions.detail.sessionValueMissing')}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  {t('sessions.detail.closedProjectHint')}
                </p>
              </div>
            ) : payments.length > 0 ? (
              <div className="flex flex-col gap-1">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted capitalize">{p.forma}</span>
                    <span className="text-white">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
                <div className="border-t border-[#2A2A2A] pt-2 mt-1 flex justify-between text-sm font-semibold">
                  <span className="text-muted">{t('sessions.detail.totalReceived')}</span>
                  <span className="text-white">{formatCurrency(totalPago)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">{t('sessions.detail.noPayments')}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              {session.custo_material > 0 && (
                <div>
                  <p className="text-xs text-muted">{t('sessions.detail.material')}</p>
                  <p className="text-sm text-white">{formatCurrency(session.custo_material)}</p>
                </div>
              )}
              {session.valor_comissao_estudio > 0 && (
                <div>
                  <p className="text-xs text-muted">{t('sessions.detail.studioCommission')}</p>
                  <p className="text-sm text-amber-400">
                    {formatCurrency(session.valor_comissao_estudio)}
                    {session.payout_id ? (
                      <span className="ml-1 text-xs text-green-400">{t('sessions.detail.settledTag')}</span>
                    ) : (
                      <span className="ml-1 text-xs text-amber-400">{t('sessions.detail.pendingTag')}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Settle commission action — only for concluded sessions */}
            {session.valor_comissao_estudio > 0 && !session.payout_id && session.studio_id && (
              !isAgendada ? (
                <Button
                  full
                  variant="secondary"
                  className="border border-amber-500/40 text-amber-400 mt-1"
                  onClick={() => navigate(`/studios/${session.studio_id}/acerto`)}
                >
                  {t('sessions.detail.settleCommission')}
                </Button>
              ) : (
                <p className="text-xs text-muted mt-1">
                  {t('sessions.detail.settleHint')}
                </p>
              )
            )}
          </Card>
        )}

        {/* Anamnese photo */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.detail.anamnesis')}</p>
            <button
              className="flex items-center gap-1 text-xs text-primary"
              onClick={() => fileRef.current?.click()}
              disabled={uploadLoading}
            >
              {uploadLoading ? (
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
              {session.foto_anamnese_url ? t('sessions.detail.replacePhoto') : t('sessions.detail.addPhoto')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {(photoPreview || session.foto_anamnese_url) ? (
            <img
              src={photoPreview || session.foto_anamnese_url}
              alt={t('sessions.detail.anamnesis')}
              className="w-full rounded-lg object-cover max-h-64"
            />
          ) : (
            <p className="text-sm text-muted">{t('sessions.detail.noPhoto')}</p>
          )}
        </Card>

        {/* Notes */}
        {session.obs && (
          <Card className="p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-2">{t('sessions.detail.notes')}</p>
            <p className="text-sm text-white whitespace-pre-wrap">{session.obs}</p>
          </Card>
        )}

        {/* Complete session */}
        {isAgendada && (
          <Card className="p-4 border-primary/30 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              <p className="text-sm font-medium text-white">{t('sessions.detail.completeSession')}</p>
            </div>
            <p className="text-xs text-muted">
              {t('sessions.detail.completeHint')}
            </p>
            {!(session.valor_comissao_estudio > 0) && (
              <p className="text-xs text-amber-400">
                {t('sessions.detail.noCommissionWarning')}
              </p>
            )}
            <Button full onClick={handleComplete} loading={completing}>
              <CheckCircle2 size={16} /> {t('sessions.detail.markComplete')}
            </Button>
          </Card>
        )}
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title={t('sessions.detail.deleteTitle')}>
        <p className="text-sm text-muted mb-4">
          {t('sessions.detail.deleteConfirm')}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" full onClick={() => setDeleteModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" full onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-white text-right truncate max-w-[60%]">{value}</span>
    </div>
  )
}
