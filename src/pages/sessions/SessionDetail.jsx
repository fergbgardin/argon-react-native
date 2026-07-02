import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Edit, Trash2, AlertTriangle, Camera, ExternalLink, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Mic, Square
} from 'lucide-react'
import { sessionsApi, sessionPaymentsApi, storageApi } from '../../lib/api'
import { formatDate, formatCurrency, whatsappLink } from '../../lib/utils'
import { useData } from '../../hooks/useData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PAYMENT_METHODS = [
  { key: 'pix', label: 'PIX' },
  { key: 'credito', label: 'Crédito' },
  { key: 'debito', label: 'Débito' },
  { key: 'dinheiro', label: 'Dinheiro' },
]

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: session, loading, refetch } = useData(() => sessionsApi.get(id), [id])

  const [completing, setCompleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [techExpanded, setTechExpanded] = useState(false)

  // Complete session form
  const [activePayMethods, setActivePayMethods] = useState([])
  const [payValues, setPayValues] = useState({})
  const [materialSize, setMaterialSize] = useState('')
  const [materialValue, setMaterialValue] = useState('')
  const [comissao, setComissao] = useState('')
  const [agulhas, setAgulhas] = useState('')
  const [obs, setObs] = useState('')
  const fileRef = useRef()

  // Audio recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [localAudioUrl, setLocalAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    if (localAudioUrl) URL.revokeObjectURL(localAudioUrl)
  }, [])

  if (loading) return <LoadingSpinner fullPage />
  if (!loading && !session) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-muted">Sessão não encontrada</p>
      <button onClick={() => navigate('/sessoes')} className="text-primary text-sm">← Voltar para sessões</button>
    </div>
  )

  const client = session.projects?.clients
  const project = session.projects
  const studio = session.studios
  const payments = session.session_payments || []
  const totalPago = payments.reduce((s, p) => s + (p.valor || 0), 0)

  function togglePayMethod(method) {
    setActivePayMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  async function handleDelete() {
    await sessionsApi.delete(id)
    navigate(-1)
  }

  async function handleComplete() {
    setCompleting(true)
    const pays = activePayMethods.map((m) => ({
      forma: m,
      valor: parseFloat(payValues[m]) || 0,
    }))

    await Promise.all([
      sessionsApi.update(id, {
        status: 'concluida',
        custo_material: materialValue ? parseFloat(materialValue) : null,
        valor_comissao_estudio: comissao ? parseFloat(comissao) : null,
        agulhas: agulhas || null,
        obs: obs || null,
      }),
      pays.length > 0 ? sessionPaymentsApi.upsertForSession(id, pays) : Promise.resolve(),
    ])

    await refetch()
    setCompleting(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploadLoading(true)
    const { url } = await storageApi.uploadAnamnese(file, id)
    if (url) {
      await sessionsApi.update(id, { foto_anamnese_url: url })
      await refetch()
      setPhotoPreview(null)
    }
    setUploadLoading(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setLocalAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    } catch {
      alert('Não foi possível acessar o microfone.')
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function saveAudio() {
    if (!audioBlob) return
    setUploadingAudio(true)
    const { url } = await storageApi.uploadAudio(audioBlob, id)
    if (url) {
      await sessionsApi.update(id, { audio_tecnico_url: url })
      await refetch()
      setLocalAudioUrl(null)
      setAudioBlob(null)
    }
    setUploadingAudio(false)
  }

  function fmtSeconds(s) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  }

  const isAgendada = session.status === 'agendada'

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader
        title={client?.nome || 'Sessão'}
        subtitle={project?.nome}
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/sessoes/${id}/editar`)}
            >
              <Edit size={18} />
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
              {isAgendada ? 'Agendada' : 'Concluída'}
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
            <Row label="Cliente" value={client?.nome} />
            <Row label="Projeto" value={project?.nome} />
            <Row label="Estúdio" value={studio?.nome} />
            {session.agulhas && <Row label="Agulhas" value={session.agulhas} />}
          </div>

          {client?.whatsapp && (
            <a
              href={whatsappLink(client.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400"
            >
              <ExternalLink size={14} />
              WhatsApp: {client.whatsapp}
            </a>
          )}
        </Card>

        {/* Financial info (concluida) */}
        {!isAgendada && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">Financeiro</p>

            {payments.length > 0 ? (
              <div className="flex flex-col gap-1">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted capitalize">{p.forma}</span>
                    <span className="text-white">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
                <div className="border-t border-[#2A2A2A] pt-2 mt-1 flex justify-between text-sm font-semibold">
                  <span className="text-muted">Total recebido</span>
                  <span className="text-white">{formatCurrency(totalPago)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhum pagamento registrado</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              {session.custo_material > 0 && (
                <div>
                  <p className="text-xs text-muted">Material</p>
                  <p className="text-sm text-white">{formatCurrency(session.custo_material)}</p>
                </div>
              )}
              {session.valor_comissao_estudio > 0 && (
                <div>
                  <p className="text-xs text-muted">Comissão estúdio</p>
                  <p className="text-sm text-amber-400">
                    {formatCurrency(session.valor_comissao_estudio)}
                    {session.payout_id ? (
                      <span className="ml-1 text-xs text-green-400">(repassado)</span>
                    ) : (
                      <span className="ml-1 text-xs text-amber-400">(pendente)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Anamnese photo */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-wide">Anamnese</p>
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
              {session.foto_anamnese_url ? 'Substituir' : 'Adicionar foto'}
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
              alt="Anamnese"
              className="w-full rounded-lg object-cover max-h-64"
            />
          ) : (
            <p className="text-sm text-muted">Nenhuma foto adicionada</p>
          )}
        </Card>

        {/* Audio técnico */}
        <Card className="p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">Áudio técnico</p>

          {session.audio_tecnico_url && !localAudioUrl && (
            <audio controls className="w-full mb-3 rounded" src={session.audio_tecnico_url} />
          )}

          {localAudioUrl && (
            <div className="flex flex-col gap-2 mb-3">
              <audio controls className="w-full rounded" src={localAudioUrl} />
              <Button full variant="secondary" loading={uploadingAudio} onClick={saveAudio}>
                Salvar áudio
              </Button>
            </div>
          )}

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 text-red-400 text-sm"
            >
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Gravando {fmtSeconds(recordingSeconds)} — Parar
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 text-primary text-sm hover:opacity-80 transition-opacity"
            >
              <Mic size={14} />
              {session.audio_tecnico_url || localAudioUrl ? 'Gravar novo áudio' : 'Gravar áudio técnico'}
            </button>
          )}
        </Card>

        {/* Notes */}
        {session.obs && (
          <Card className="p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-2">Observações</p>
            <p className="text-sm text-white whitespace-pre-wrap">{session.obs}</p>
          </Card>
        )}

        {/* Complete session flow */}
        {isAgendada && (
          <Card className="p-4 border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-primary" />
              <p className="text-sm font-medium text-white">Concluir sessão</p>
            </div>

            {/* Payments */}
            <div className="mb-4">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Pagamento</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {PAYMENT_METHODS.map(({ key, label }) => (
                  <Chip
                    key={key}
                    active={activePayMethods.includes(key)}
                    onClick={() => togglePayMethod(key)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {activePayMethods.map((m) => (
                <Input
                  key={m}
                  label={PAYMENT_METHODS.find((p) => p.key === m)?.label}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="mt-2"
                  value={payValues[m] || ''}
                  onChange={(e) =>
                    setPayValues((prev) => ({ ...prev, [m]: e.target.value }))
                  }
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Input
                label="Custo material (R$)"
                type="number"
                step="0.01"
                value={materialValue}
                onChange={(e) => setMaterialValue(e.target.value)}
              />
              <Input
                label="Comissão estúdio (R$)"
                type="number"
                step="0.01"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
              />
            </div>

            <Button full onClick={handleComplete} loading={completing}>
              <CheckCircle2 size={16} /> Marcar como Concluída
            </Button>
          </Card>
        )}
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir sessão">
        <p className="text-sm text-muted mb-4">
          Tem certeza? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" full onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" full onClick={handleDelete}>
            Excluir
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
