import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, X, Camera, Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sessionsApi, projectsApi, studiosApi, sessionPaymentsApi, settingsApi, storageApi } from '../../lib/api'
import { calcComissao } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PAYMENT_METHODS = [
  { key: 'pix', labelKey: 'common.paymentMethods.pix' },
  { key: 'credito', labelKey: 'common.paymentMethods.credito' },
  { key: 'debito', labelKey: 'common.paymentMethods.debito' },
  { key: 'dinheiro', labelKey: 'common.paymentMethods.dinheiro' },
]

export default function SessionForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = !!id
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
    obs: '',
  })

  const [payForma, setPayForma] = useState('pix')
  const [payValor, setPayValor] = useState('')
  const [pay2Enabled, setPay2Enabled] = useState(false)
  const [pay2Forma, setPay2Forma] = useState('credito')
  const [pay2Valor, setPay2Valor] = useState('')
  const [sessionValorFechado, setSessionValorFechado] = useState('')
  const [comissaoPct, setComissaoPct] = useState('')
  const [errors, setErrors] = useState({})

  // Anamnese photo
  const [anamneseFile, setAnamneseFile] = useState(null)
  const [anamnesePreview, setAnamnesePreview] = useState(null)
  const [existingAnamnese, setExistingAnamnese] = useState(null)
  const anamneseRef = useRef(null)

  // When editing a session that already has a commission, keep the value
  // frozen (snapshot) — don't recalc from the studio's current config rate.
  const lockCommission = useRef(false)

  useEffect(() => {
    loadInit()
  }, [])

  async function loadInit() {
    setInitLoading(true)
    const promises = [projectsApi.list(), studiosApi.list(), settingsApi.get()]
    if (isEditing) promises.push(sessionsApi.get(id))

    const [pRes, sRes, stRes, sessionRes] = await Promise.all(promises)
    setProjects(pRes.data || [])
    const studioList = sRes.data || []
    setStudios(studioList)
    setSettings(stRes.data)

    if (isEditing && sessionRes?.data) {
      const s = sessionRes.data
      setForm({
        project_id: s.project_id || '',
        studio_id: s.studio_id || '',
        status: s.status || 'agendada',
        data_sessao: s.data_sessao || new Date().toISOString().split('T')[0],
        custo_material: s.custo_material ? 'outro' : '',
        custo_material_valor: s.custo_material ?? '',
        valor_comissao_estudio: s.valor_comissao_estudio ?? '',
        agulhas: s.agulhas || '',
        obs: s.obs || '',
      })
      setExistingAnamnese(s.foto_anamnese_url || null)
      lockCommission.current = !!s.valor_comissao_estudio
      if (s.valor_sessao != null) {
        setSessionValorFechado(s.valor_sessao.toString())
        if (s.valor_comissao_estudio && s.valor_sessao > 0) {
          setComissaoPct(((s.valor_comissao_estudio / s.valor_sessao) * 100).toFixed(1).replace(/\.0$/, ''))
        }
      }
      const pays = s.session_payments || []
      if (pays.length > 0) {
        setPayForma(pays[0].forma)
        setPayValor(pays[0].valor.toString())
        if (pays.length > 1) {
          setPay2Enabled(true)
          setPay2Forma(pays[1].forma)
          setPay2Valor(pays[1].valor.toString())
        }
        const base = pays.reduce((sum, p) => sum + (p.valor || 0), 0)
        if (base > 0 && s.valor_comissao_estudio) {
          setComissaoPct(((s.valor_comissao_estudio / base) * 100).toFixed(1).replace(/\.0$/, ''))
        }
      }
    } else {
      const fav = studioList.find((s) => s.is_favorite)
      if (fav) setForm((f) => ({ ...f, studio_id: fav.id }))
    }
    setInitLoading(false)
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  // Recalculate commission when studio or payment changes
  useEffect(() => {
    // Preserve the stored (snapshot) value when editing an existing session
    if (lockCommission.current) return
    if (!form.studio_id || !form.project_id) return
    const studio = studios.find((s) => s.id === form.studio_id)
    if (!studio) return
    const project = projects.find((p) => p.id === form.project_id)
    if (!project) return

    let valorBase = 0
    if (project.tipo_cobranca === 'por_sessao') {
      valorBase = (parseFloat(payValor) || 0) + (pay2Enabled ? (parseFloat(pay2Valor) || 0) : 0)
    } else {
      valorBase = parseFloat(sessionValorFechado) || 0
    }
    const comissao = calcComissao(valorBase, studio)
    setForm((f) => ({ ...f, valor_comissao_estudio: comissao ? comissao.toString() : '' }))
    setComissaoPct(valorBase > 0 && comissao ? fmtPct((comissao / valorBase) * 100) : '')
  }, [form.studio_id, form.project_id, payValor, pay2Valor, pay2Enabled, sessionValorFechado])

  function getMaterialValue(size) {
    const map = {
      pequena: settings?.custo_material_pequena || 70,
      media: settings?.custo_material_media || 150,
      grande: settings?.custo_material_grande || 250,
    }
    return map[size] || 0
  }

  function handleMaterialSelect(size) {
    if (!size) {
      setForm((f) => ({ ...f, custo_material: '', custo_material_valor: '' }))
    } else if (size === 'outro') {
      setForm((f) => ({ ...f, custo_material: 'outro', custo_material_valor: '' }))
    } else {
      const val = getMaterialValue(size)
      setForm((f) => ({ ...f, custo_material: size, custo_material_valor: val }))
    }
  }

  function handleAnamneseSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAnamneseFile(file)
    setAnamnesePreview(URL.createObjectURL(file))
  }

  // Multi-select needles, stored as a comma-separated string
  function toggleAgulha(a) {
    const list = form.agulhas ? form.agulhas.split(', ').filter(Boolean) : []
    const next = list.includes(a) ? list.filter((x) => x !== a) : [...list, a]
    handleChange('agulhas', next.join(', '))
  }

  // Picking a studio explicitly re-enables commission recalculation
  function handleStudioChange(studioId) {
    lockCommission.current = false
    handleChange('studio_id', studioId)
  }

  // Base used to convert between R$ and % for the commission
  function commissionBase() {
    const proj = projects.find((p) => p.id === form.project_id)
    if (proj?.tipo_cobranca === 'fechado') return parseFloat(sessionValorFechado) || 0
    return (parseFloat(payValor) || 0) + (pay2Enabled ? parseFloat(pay2Valor) || 0 : 0)
  }

  const fmtPct = (n) => n.toFixed(1).replace(/\.0$/, '')

  // Editing the R$ value updates the % (and stops auto-recalc overwriting it)
  function handleComissaoValor(v) {
    lockCommission.current = true
    handleChange('valor_comissao_estudio', v)
    const base = commissionBase()
    setComissaoPct(base > 0 && v ? fmtPct((parseFloat(v) / base) * 100) : '')
  }

  // Editing the % updates the R$ value
  function handleComissaoPct(p) {
    lockCommission.current = true
    setComissaoPct(p)
    const base = commissionBase()
    const val = base > 0 && p ? (base * parseFloat(p)) / 100 : 0
    handleChange('valor_comissao_estudio', val ? val.toFixed(2) : '')
  }

  function buildPayments() {
    const result = []
    if (payValor && parseFloat(payValor) > 0) {
      result.push({ forma: payForma, valor: parseFloat(payValor) })
    }
    if (pay2Enabled && pay2Valor && parseFloat(pay2Valor) > 0) {
      result.push({ forma: pay2Forma, valor: parseFloat(pay2Valor) })
    }
    return result
  }

  function validate() {
    const errs = {}
    if (!form.project_id) errs.project_id = t('sessions.form.projectRequired')
    if (!form.studio_id) errs.studio_id = t('sessions.form.studioRequired')
    if (!form.data_sessao) errs.data_sessao = t('sessions.form.dateRequired')
    if (!form.custo_material_valor) errs.custo_material = t('sessions.form.materialRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const sessionData = {
      project_id: form.project_id,
      studio_id: form.studio_id || null,
      status: form.status,
      data_sessao: form.data_sessao,
      custo_material: form.custo_material_valor ? parseFloat(form.custo_material_valor) : null,
      valor_comissao_estudio: form.valor_comissao_estudio ? parseFloat(form.valor_comissao_estudio) : null,
      valor_sessao: sessionValorFechado ? parseFloat(sessionValorFechado) : null,
      agulhas: form.agulhas || null,
      obs: form.obs || null,
    }

    const { data: session, error } = isEditing
      ? await sessionsApi.update(id, sessionData)
      : await sessionsApi.create(sessionData)

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }

    const sessionId = isEditing ? id : session?.id
    const pays = buildPayments()
    if (isEditing || pays.length > 0) {
      const { error: payError } = await sessionPaymentsApi.upsertForSession(sessionId, pays)
      if (payError) {
        setErrors({ submit: t('sessions.form.paymentSavedFailed', { reason: payError.message }) })
        setLoading(false)
        return
      }
    }

    if (anamneseFile) {
      const { url, error: upError } = await storageApi.uploadAnamnese(anamneseFile, sessionId)
      if (upError || !url) {
        setErrors({ submit: t('sessions.form.photoSavedFailed', { reason: upError?.message || t('sessions.form.photoFallbackReason') }) })
        setLoading(false)
        return
      }
      await sessionsApi.update(sessionId, { foto_anamnese_url: url })
    }

    navigate(isEditing ? `/sessoes/${id}` : '/sessoes')
  }

  if (initLoading) return <LoadingSpinner fullPage />

  if (!isEditing && studios.length === 0) {
    return (
      <div className="relative min-h-screen bg-bg pb-nav">
        <AmbientGlow />
        <PageHeader title={t('sessions.form.newTitle')} />
        <EmptyState
          icon={Building2}
          title={t('sessions.form.noStudiosTitle')}
          description={t('sessions.form.noStudiosDescription')}
          action={
            <Button onClick={() => navigate('/studios/novo')}>
              <Plus size={16} /> {t('sessions.form.registerStudio')}
            </Button>
          }
        />
      </div>
    )
  }

  const selectedProject = projects.find((p) => p.id === form.project_id)
  const selectedStudio = studios.find((s) => s.id === form.studio_id)
  const presets = settings?.presets_agulhas || []
  const agulhasList = form.agulhas ? form.agulhas.split(', ').filter(Boolean) : []

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader title={isEditing ? t('sessions.form.editTitle') : t('sessions.form.newTitle')} />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        {/* Essentials */}
        <Card className="p-4 flex flex-col gap-4">
          <Select
            label={t('sessions.form.projectClient')}
            value={form.project_id}
            onChange={(e) => handleChange('project_id', e.target.value)}
            error={errors.project_id}
          >
            <option value="">{t('sessions.form.selectProject')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clients?.nome} — {p.nome}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-3">
            <Input
              label={t('sessions.form.date')}
              type="date"
              value={form.data_sessao}
              onChange={(e) => handleChange('data_sessao', e.target.value)}
              error={errors.data_sessao}
            />
            <Select
              label={t('sessions.form.status')}
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="agendada">{t('common.sessionStatus.scheduled')}</option>
              <option value="concluida">{t('common.sessionStatus.completed')}</option>
            </Select>
          </div>
        </Card>

        {/* Payment — always visible for por_sessao, optional */}
        {selectedProject?.tipo_cobranca !== 'fechado' && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.form.payment')}</p>

            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map(({ key, labelKey }) => (
                <Chip key={key} active={payForma === key} onClick={() => setPayForma(key)}>
                  {t(labelKey)}
                </Chip>
              ))}
            </div>
            <Input
              label={t('sessions.form.valueLabel')}
              type="number"
              step="0.01"
              placeholder="0,00"
              value={payValor}
              onChange={(e) => setPayValor(e.target.value)}
            />

            {pay2Enabled ? (
              <div className="flex flex-col gap-3 pt-1 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted uppercase tracking-wide">{t('sessions.form.secondMethod')}</span>
                  <button
                    type="button"
                    onClick={() => { setPay2Enabled(false); setPay2Valor('') }}
                    className="text-muted hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_METHODS.filter((m) => m.key !== payForma).map(({ key, labelKey }) => (
                    <Chip key={key} active={pay2Forma === key} onClick={() => setPay2Forma(key)}>
                      {t(labelKey)}
                    </Chip>
                  ))}
                </div>
                <Input
                  label={t('sessions.form.valueLabel')}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={pay2Valor}
                  onChange={(e) => setPay2Valor(e.target.value)}
                />
                {payValor && pay2Valor && (
                  <p className="text-xs text-muted">
                    {t('sessions.form.total', { value: ((parseFloat(payValor) || 0) + (parseFloat(pay2Valor) || 0)).toFixed(2) })}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPay2Enabled(true)}
                className="text-xs text-primary text-left hover:opacity-80 transition-opacity"
              >
                {t('sessions.form.splitPayment')}
              </button>
            )}

            <p className="text-xs text-muted">{t('sessions.form.blankIfNotReceived')}</p>
          </Card>
        )}

        {/* Financial — always visible so a completed session can be
            registered in full, or a scheduled one pre-filled */}
        <>
          {/* Material cost */}
          <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.form.materialCostTitle')}</p>
              <Select
                label={t('sessions.form.materialSize')}
                value={form.custo_material}
                onChange={(e) => handleMaterialSelect(e.target.value)}
                error={errors.custo_material}
              >
                <option value="">{t('sessions.form.selectPlaceholder')}</option>
                <option value="pequena">{t('sessions.form.materialSmall', { value: getMaterialValue('pequena') })}</option>
                <option value="media">{t('sessions.form.materialMedium', { value: getMaterialValue('media') })}</option>
                <option value="grande">{t('sessions.form.materialLarge', { value: getMaterialValue('grande') })}</option>
                <option value="outro">{t('sessions.form.materialOther')}</option>
              </Select>
              {form.custo_material && (
                <Input
                  label={form.custo_material === 'outro' ? t('sessions.form.materialOtherValue') : t('sessions.form.materialEditableValue')}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.custo_material_valor}
                  onChange={(e) => handleChange('custo_material_valor', e.target.value)}
                />
              )}
            </Card>

            {/* For fechado: ask session value to calculate commission */}
            {selectedProject?.tipo_cobranca === 'fechado' && (
              <Card className="p-4 flex flex-col gap-2">
                <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.form.closedSessionValueTitle')}</p>
                <Input
                  label={t('sessions.form.valueLabel')}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={sessionValorFechado}
                  onChange={(e) => setSessionValorFechado(e.target.value)}
                  hint={t('sessions.form.closedSessionValueHint')}
                />
              </Card>
            )}

            {/* Commission — studio dropdown drives the snapshot value */}
            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.form.commissionTitle')}</p>
              <Select
                label={t('sessions.form.studioLabel')}
                value={form.studio_id}
                onChange={(e) => handleStudioChange(e.target.value)}
                error={errors.studio_id}
              >
                <option value="">{t('sessions.form.selectStudio')}</option>
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} {s.is_favorite ? '★' : ''}
                  </option>
                ))}
              </Select>
              {selectedStudio && (
                <p className="text-xs text-muted">
                  {t('sessions.form.rate', {
                    rate: selectedStudio.tipo_cobranca === 'porcentagem'
                      ? `${selectedStudio.valor_padrao}%`
                      : t('sessions.form.rateFixed', { value: selectedStudio.valor_padrao }),
                  })}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('sessions.form.valueLabel')}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor_comissao_estudio}
                  onChange={(e) => handleComissaoValor(e.target.value)}
                />
                <Input
                  label={t('sessions.form.percentage')}
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={comissaoPct}
                  onChange={(e) => handleComissaoPct(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted">
                {t('sessions.form.commissionHint')}
              </p>
            </Card>
        </>

        {/* Technical details (collapsible) */}
        <Card className="overflow-hidden">
          <button
            type="button"
            className="w-full p-4 flex items-center justify-between text-left"
            onClick={() => setTechExpanded(!techExpanded)}
          >
            <span className="text-sm font-medium text-muted">{t('sessions.form.technicalDetails')}</span>
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
                  <p className="text-xs text-muted uppercase tracking-wide mb-2">{t('sessions.form.needles')}</p>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <Chip
                        key={p}
                        active={agulhasList.includes(p)}
                        onClick={() => toggleAgulha(p)}
                        color="primary"
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : (
                <Input
                  label={t('sessions.form.needles')}
                  placeholder={t('sessions.form.needlesPlaceholder')}
                  value={form.agulhas}
                  onChange={(e) => handleChange('agulhas', e.target.value)}
                />
              )}

            </div>
          )}
        </Card>

        {/* Anamnese photo */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted uppercase tracking-wide">{t('sessions.detail.anamnesis')}</p>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary"
              onClick={() => anamneseRef.current?.click()}
            >
              <Camera size={14} />
              {anamnesePreview || existingAnamnese ? t('sessions.form.changePhoto') : t('sessions.form.addPhoto')}
            </button>
            <input
              ref={anamneseRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleAnamneseSelect}
            />
          </div>
          {(anamnesePreview || existingAnamnese) ? (
            <img
              src={anamnesePreview || existingAnamnese}
              alt={t('sessions.detail.anamnesis')}
              className="w-full rounded-lg object-cover max-h-64"
            />
          ) : (
            <p className="text-sm text-muted">{t('sessions.form.noPhoto')}</p>
          )}
          {anamneseFile && (
            <p className="text-xs text-muted">{t('sessions.form.photoWillUpload')}</p>
          )}
        </Card>

        {/* Notes */}
        <Textarea
          label={t('sessions.form.notes')}
          placeholder={t('sessions.form.notesPlaceholder')}
          value={form.obs}
          onChange={(e) => handleChange('obs', e.target.value)}
        />

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          {t('sessions.form.save')}
        </Button>
      </form>
    </div>
  )
}
