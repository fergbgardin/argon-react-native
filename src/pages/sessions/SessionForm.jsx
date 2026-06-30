import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { sessionsApi, projectsApi, studiosApi, sessionPaymentsApi, settingsApi } from '../../lib/api'
import { calcComissao } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PAYMENT_METHODS = [
  { key: 'pix', label: 'PIX' },
  { key: 'credito', label: 'Crédito' },
  { key: 'debito', label: 'Débito' },
  { key: 'dinheiro', label: 'Dinheiro' },
]

export default function SessionForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preProjectId = searchParams.get('project_id')

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [studios, setStudios] = useState([])
  const [settings, setSettings] = useState(null)
  const [techExpanded, setTechExpanded] = useState(false)

  const [form, setForm] = useState({
    project_id: preProjectId || '',
    studio_id: '',
    status: 'agendada',
    data_sessao: new Date().toISOString().split('T')[0],
    custo_material: '',
    custo_material_valor: '',
    valor_comissao_estudio: '',
    agulhas: '',
    pigmentos: '',
    obs: '',
  })

  const [payments, setPayments] = useState([])
  const [activePayMethods, setActivePayMethods] = useState([])
  const [payValues, setPayValues] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadInit()
  }, [])

  async function loadInit() {
    setInitLoading(true)
    const [pRes, sRes, stRes] = await Promise.all([
      projectsApi.list(),
      studiosApi.list(),
      settingsApi.get(),
    ])
    setProjects(pRes.data || [])
    const studioList = sRes.data || []
    setStudios(studioList)
    setSettings(stRes.data)

    // Pre-select favorite studio
    const fav = studioList.find((s) => s.is_favorite)
    if (fav) setForm((f) => ({ ...f, studio_id: fav.id }))
    setInitLoading(false)
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  // Recalculate commission when studio or payment changes
  useEffect(() => {
    if (!form.studio_id || !form.project_id) return
    const studio = studios.find((s) => s.id === form.studio_id)
    if (!studio) return

    const project = projects.find((p) => p.id === form.project_id)
    if (!project) return

    let valorBase = 0
    if (project.tipo_cobranca === 'por_sessao') {
      // Use total from payments for commission base
      valorBase = activePayMethods.reduce((sum, m) => {
        return sum + (parseFloat(payValues[m]) || 0)
      }, 0)
    }
    const comissao = calcComissao(valorBase, studio)
    if (project.tipo_cobranca === 'por_sessao') {
      setForm((f) => ({ ...f, valor_comissao_estudio: comissao.toString() }))
    }
  }, [form.studio_id, form.project_id, payValues, activePayMethods])

  function getMaterialValue(size) {
    if (!settings) return 0
    const map = {
      pequena: settings.custo_material_pequena || 30,
      media: settings.custo_material_media || 60,
      grande: settings.custo_material_grande || 100,
    }
    return map[size] || 0
  }

  function handleMaterialSelect(size) {
    const val = getMaterialValue(size)
    setForm((f) => ({ ...f, custo_material: size, custo_material_valor: val }))
  }

  function togglePayMethod(method) {
    setActivePayMethods((prev) => {
      if (prev.includes(method)) return prev.filter((m) => m !== method)
      return [...prev, method]
    })
  }

  function totalPayments() {
    return activePayMethods.reduce((sum, m) => sum + (parseFloat(payValues[m]) || 0), 0)
  }

  function buildPayments() {
    if (activePayMethods.length === 0) return []

    if (activePayMethods.length === 1) {
      // Get total from project or manual entry
      const proj = projects.find((p) => p.id === form.project_id)
      let valor = 0
      if (proj?.tipo_cobranca === 'por_sessao') {
        valor = parseFloat(payValues[activePayMethods[0]]) || 0
      } else {
        valor = parseFloat(payValues[activePayMethods[0]]) || 0
      }
      return [{ forma: activePayMethods[0], valor }]
    }

    return activePayMethods.map((m) => ({
      forma: m,
      valor: parseFloat(payValues[m]) || 0,
    }))
  }

  function validate() {
    const errs = {}
    if (!form.project_id) errs.project_id = 'Selecione um projeto'
    if (!form.studio_id) errs.studio_id = 'Selecione um estúdio'
    if (!form.data_sessao) errs.data_sessao = 'Informe a data'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const sessionData = {
      project_id: form.project_id,
      studio_id: form.studio_id,
      status: form.status,
      data_sessao: form.data_sessao,
      custo_material: form.custo_material_valor ? parseFloat(form.custo_material_valor) : null,
      valor_comissao_estudio: form.valor_comissao_estudio ? parseFloat(form.valor_comissao_estudio) : null,
      agulhas: form.agulhas || null,
      pigmentos: form.pigmentos || null,
      obs: form.obs || null,
    }

    const { data: session, error } = await sessionsApi.create(sessionData)

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }

    const pays = buildPayments()
    if (pays.length > 0) {
      await sessionPaymentsApi.upsertForSession(session.id, pays)
    }

    navigate(`/sessoes/${session.id}`)
  }

  if (initLoading) return <LoadingSpinner fullPage />

  const selectedProject = projects.find((p) => p.id === form.project_id)
  const selectedStudio = studios.find((s) => s.id === form.studio_id)
  const presets = settings?.presets_agulhas || []
  const presetsPig = settings?.presets_pigmentos || []

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader title="Nova Sessão" />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        {/* Essentials */}
        <Card className="p-4 flex flex-col gap-4">
          <Select
            label="Projeto / Cliente *"
            value={form.project_id}
            onChange={(e) => handleChange('project_id', e.target.value)}
            error={errors.project_id}
          >
            <option value="">Selecionar projeto...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clients?.nome} — {p.nome}
              </option>
            ))}
          </Select>

          <Select
            label="Estúdio *"
            value={form.studio_id}
            onChange={(e) => handleChange('studio_id', e.target.value)}
            error={errors.studio_id}
          >
            <option value="">Selecionar estúdio...</option>
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} {s.is_favorite ? '★' : ''}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data *"
              type="date"
              value={form.data_sessao}
              onChange={(e) => handleChange('data_sessao', e.target.value)}
              error={errors.data_sessao}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="agendada">Agendada</option>
              <option value="concluida">Concluída</option>
            </Select>
          </div>
        </Card>

        {/* Financial — only when concluida */}
        {form.status === 'concluida' && (
          <>
            {/* Material cost */}
            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs text-muted uppercase tracking-wide">Custo de Material</p>
              <div className="flex gap-2">
                {['pequena', 'media', 'grande'].map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => handleMaterialSelect(size)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.custo_material === size
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-[#2A2A2A] border-[#333] text-muted'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                    <span className="block text-xs mt-0.5 opacity-70">
                      R$ {getMaterialValue(size)}
                    </span>
                  </button>
                ))}
              </div>
              {form.custo_material && (
                <Input
                  label="Valor (editável)"
                  type="number"
                  step="0.01"
                  value={form.custo_material_valor}
                  onChange={(e) => handleChange('custo_material_valor', e.target.value)}
                />
              )}
            </Card>

            {/* Payments */}
            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs text-muted uppercase tracking-wide">Pagamento</p>
              <div className="flex gap-2 flex-wrap">
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

              {activePayMethods.length > 0 && (
                <div className="flex flex-col gap-2">
                  {activePayMethods.map((m) => (
                    <Input
                      key={m}
                      label={PAYMENT_METHODS.find((p) => p.key === m)?.label}
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={payValues[m] || ''}
                      onChange={(e) =>
                        setPayValues((prev) => ({ ...prev, [m]: e.target.value }))
                      }
                    />
                  ))}
                  {activePayMethods.length > 1 && (
                    <p className="text-xs text-muted">
                      Total: R$ {totalPayments().toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Commission */}
            {selectedStudio && (
              <Card className="p-4 flex flex-col gap-2">
                <p className="text-xs text-muted uppercase tracking-wide">Comissão Estúdio</p>
                <p className="text-xs text-muted">
                  {selectedStudio.nome} —{' '}
                  {selectedStudio.tipo_cobranca === 'porcentagem'
                    ? `${selectedStudio.valor_padrao}%`
                    : `R$ ${selectedStudio.valor_padrao} fixo`}
                </p>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_comissao_estudio}
                  onChange={(e) => handleChange('valor_comissao_estudio', e.target.value)}
                  hint="Calculado automaticamente — editável se necessário"
                />
              </Card>
            )}
          </>
        )}

        {/* Technical details (collapsible) */}
        <Card className="overflow-hidden">
          <button
            type="button"
            className="w-full p-4 flex items-center justify-between text-left"
            onClick={() => setTechExpanded(!techExpanded)}
          >
            <span className="text-sm font-medium text-muted">Detalhes técnicos</span>
            {techExpanded ? (
              <ChevronUp size={16} className="text-muted" />
            ) : (
              <ChevronDown size={16} className="text-muted" />
            )}
          </button>

          {techExpanded && (
            <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#2A2A2A] pt-3">
              {presets.length > 0 ? (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-2">Agulhas</p>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <Chip
                        key={p}
                        active={form.agulhas === p}
                        onClick={() => handleChange('agulhas', form.agulhas === p ? '' : p)}
                        color="primary"
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : (
                <Input
                  label="Agulhas"
                  placeholder="Ex: RL #5, RM #7"
                  value={form.agulhas}
                  onChange={(e) => handleChange('agulhas', e.target.value)}
                />
              )}

              {presetsPig.length > 0 ? (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-2">Pigmentos</p>
                  <div className="flex flex-wrap gap-2">
                    {presetsPig.map((p) => (
                      <Chip
                        key={p}
                        active={form.pigmentos === p}
                        onClick={() => handleChange('pigmentos', form.pigmentos === p ? '' : p)}
                        color="primary"
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : (
                <Input
                  label="Pigmentos"
                  placeholder="Ex: Intenze Black, Dynamic Black"
                  value={form.pigmentos}
                  onChange={(e) => handleChange('pigmentos', e.target.value)}
                />
              )}
            </div>
          )}
        </Card>

        {/* Notes */}
        <Textarea
          label="Observações"
          placeholder="Notas gerais, observações sobre o cliente..."
          value={form.obs}
          onChange={(e) => handleChange('obs', e.target.value)}
        />

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          Salvar Sessão
        </Button>
      </form>
    </div>
  )
}
