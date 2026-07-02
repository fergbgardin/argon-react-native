import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Edit, Trash2, AlertTriangle, Camera, ExternalLink, CheckCircle2, Clock,
  ChevronDown, ChevronUp
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


  if (loading) return <LoadingSpinner fullPage />
  if (!loading && !session) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-muted">Sessão não encontrada</p>
      <button onClick={() => navigate('/sessoes')} className="text-primary text-sm">← Voltar para sessões</button>
    </div>
  )

  const client = session.projects?.clients
  const project = session.projects
  const isFechado = project?.tipo_cobranca === 'fechado'
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
    const { url, error } = await storageApi.uploadAnamnese(file, id)
    if (error || !url) {
      setPhotoPreview(null)
      alert(`Não foi possível enviar a foto: ${error?.message || 'verifique se o bucket "inkmanager" existe no Supabase Storage (público).'}`)
    } else {
      await sessionsApi.update(id, { foto_anamnese_url: url })
      await refetch()
      setPhotoPreview(null)
    }
    setUploadLoading(false)
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

        {/* Technical details */}
        <Card className="p-4 flex flex-col gap-2">
          <p className="text-xs text-muted uppercase tracking-wide">Detalhes técnicos</p>
          {session.agulhas ? (
            <div>
              <p className="text-xs text-muted mb-1.5">Agulhas</p>
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
            <p className="text-sm text-muted">Nenhuma agulha registrada</p>
          )}
        </Card>

        {/* Financial info — shown when concluded, a payment exists, or a session value was set */}
        {(!isAgendada || payments.length > 0 || session.valor_sessao > 0) && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">Financeiro</p>

            {isFechado ? (
              <div className="flex flex-col gap-1">
                {session.valor_sessao > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Valor desta sessão</span>
                    <span className="text-white">{formatCurrency(session.valor_sessao)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Valor desta sessão não informado</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Pagamentos deste projeto fechado são gerenciados na tela do projeto.
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
