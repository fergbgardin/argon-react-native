import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { projectsApi, clientsApi, projectPaymentsApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Chip from '../../components/ui/Chip'
import AmbientGlow from '../../components/ui/AmbientGlow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PAYMENT_METHODS = [
  { key: 'pix', label: 'PIX' },
  { key: 'credito', label: 'Crédito' },
  { key: 'debito', label: 'Débito' },
  { key: 'dinheiro', label: 'Dinheiro' },
]

const BODY_AREA_GROUPS = [
  { label: 'Cabeça / Pescoço', areas: ['Cabeça', 'Nuca', 'Pescoço', 'Rosto'] },
  { label: 'Tronco', areas: ['Peitoral', 'Clavícula', 'Costela', 'Abdômen', 'Costas', 'Lombar'] },
  { label: 'Braços', areas: ['Ombro', 'Braço', 'Antebraço', 'Cotovelo', 'Pulso', 'Mão', 'Dedos'] },
  { label: 'Pernas', areas: ['Quadril', 'Coxa', 'Joelho', 'Canela', 'Panturrilha', 'Tornozelo', 'Pé'] },
]

export default function ProjectForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preClientId = searchParams.get('client_id')
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [initLoading, setInitLoading] = useState(true)

  const [form, setForm] = useState({
    client_id: preClientId || '',
    nome: '',
    area_corpo: '',
    tipo_cobranca: 'por_sessao',
    valor_total: '',
    sessoes_estimadas: '',
    status: 'ativo',
  })
  const [errors, setErrors] = useState({})

  // Body areas
  const [selectedAreas, setSelectedAreas] = useState([])

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const clientSearchRef = useRef(null)

  // Payment (only used when creating a fechado project)
  const [payForma, setPayForma] = useState('pix')
  const [payValor, setPayValor] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [pay2Enabled, setPay2Enabled] = useState(false)
  const [pay2Forma, setPay2Forma] = useState('credito')
  const [pay2Valor, setPay2Valor] = useState('')

  const normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') || ''
  const filteredClients = clients.filter((c) =>
    normalize(c.nome).includes(normalize(clientSearch))
  )
  const selectedClient = clients.find((c) => c.id === form.client_id)

  useEffect(() => {
    const promises = [clientsApi.list()]
    if (isEditing) promises.push(projectsApi.get(id))

    Promise.all(promises).then(([clientsRes, projectRes]) => {
      const clientList = clientsRes.data || []
      setClients(clientList)
      if (preClientId && !isEditing) {
        const c = clientList.find((c) => c.id === preClientId)
        if (c) setClientSearch(c.nome)
      }
      if (projectRes?.data) {
        const p = projectRes.data
        setForm({
          client_id: p.client_id || '',
          nome: p.nome || '',
          area_corpo: p.area_corpo || '',
          tipo_cobranca: p.tipo_cobranca || 'por_sessao',
          valor_total: p.valor_total ?? '',
          sessoes_estimadas: p.sessoes_estimadas ?? '',
          status: p.status || 'ativo',
        })
        const c = clientList.find((c) => c.id === p.client_id)
        if (c) setClientSearch(c.nome)
        if (p.area_corpo) setSelectedAreas(p.area_corpo.split(', ').filter(Boolean))
      }
      setInitLoading(false)
    })
  }, [id])

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.client_id) errs.client_id = 'Selecione um cliente'
    if (!form.nome.trim()) errs.nome = 'Informe o nome do projeto'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const data = {
      client_id: form.client_id,
      nome: form.nome,
      area_corpo: selectedAreas.length > 0 ? selectedAreas.join(', ') : null,
      tipo_cobranca: form.tipo_cobranca,
      valor_total: form.valor_total !== '' ? parseFloat(form.valor_total) : null,
      sessoes_estimadas: form.sessoes_estimadas !== '' ? parseInt(form.sessoes_estimadas) : null,
      status: form.status,
    }

    if (isEditing) {
      const { error } = await projectsApi.update(id, data)
      if (error) {
        setErrors({ submit: error.message })
        setLoading(false)
        return
      }
      navigate(`/projetos/${id}`)
      return
    }

    const { data: project, error } = await projectsApi.create(data)
    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }

    // Register initial payment(s) for fechado projects if value was entered
    if (form.tipo_cobranca === 'fechado' && payValor && parseFloat(payValor) > 0) {
      await projectPaymentsApi.create({
        project_id: project.id,
        forma: payForma,
        valor: parseFloat(payValor),
        data_pagamento: payDate,
      })
    }
    if (form.tipo_cobranca === 'fechado' && pay2Enabled && pay2Valor && parseFloat(pay2Valor) > 0) {
      await projectPaymentsApi.create({
        project_id: project.id,
        forma: pay2Forma,
        valor: parseFloat(pay2Valor),
        data_pagamento: payDate,
      })
    }

    navigate(`/projetos/${project.id}`)
  }

  if (initLoading) return <LoadingSpinner fullPage />

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      <PageHeader title={isEditing ? 'Editar Projeto' : 'Novo Projeto'} />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        {/* Client + name + body area */}
        <Card className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1">
              Cliente *
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                ref={clientSearchRef}
                type="text"
                placeholder="Buscar cliente..."
                value={showClientList || !selectedClient ? clientSearch : selectedClient.nome}
                autoComplete="off"
                onFocus={() => { setClientSearch(''); setShowClientList(true) }}
                onBlur={() => setTimeout(() => {
                  setShowClientList(false)
                  if (!form.client_id) setClientSearch('')
                }, 150)}
                onChange={(e) => setClientSearch(e.target.value)}
                className={`w-full bg-[#2A2A2A] border rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-primary transition-colors ${errors.client_id ? 'border-red-500' : 'border-[#333]'}`}
              />
              {showClientList && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#1E1E1E] border border-[#333] rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-muted">Nenhum cliente encontrado</p>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => {
                          handleChange('client_id', c.id)
                          setClientSearch(c.nome)
                          setShowClientList(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm hover:bg-[#2A2A2A] transition-colors ${form.client_id === c.id ? 'text-primary' : 'text-white'}`}
                      >
                        {c.nome}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.client_id && <p className="text-xs text-red-400 mt-1">{errors.client_id}</p>}
          </div>

          <Input
            label="Nome do projeto *"
            placeholder="Ex: Manga completa, Costas..."
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            error={errors.nome}
          />

          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Área do corpo</p>
            <div className="flex flex-col gap-3">
              {BODY_AREA_GROUPS.map(({ label, areas }) => (
                <div key={label}>
                  <p className="text-xs text-muted mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((area) => (
                      <Chip
                        key={area}
                        active={selectedAreas.includes(area)}
                        onClick={() =>
                          setSelectedAreas((prev) =>
                            prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
                          )
                        }
                      >
                        {area}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Billing type + totals */}
        <Card className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-2">Tipo de cobrança</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'por_sessao', label: 'Por sessão', desc: 'Cada sessão é uma transação' },
                { key: 'fechado', label: 'Fechado', desc: 'Valor total combinado' },
              ].map(({ key, label, desc }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleChange('tipo_cobranca', key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.tipo_cobranca === key
                      ? 'bg-primary/20 border-primary/50'
                      : 'bg-[#2A2A2A] border-[#333]'
                  }`}
                >
                  <p className={`text-sm font-medium ${form.tipo_cobranca === key ? 'text-primary' : 'text-white'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.tipo_cobranca === 'fechado' && (
              <Input
                label="Valor total (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.valor_total}
                onChange={(e) => handleChange('valor_total', e.target.value)}
              />
            )}
            <Input
              label="Sessões estimadas"
              type="number"
              placeholder="Ex: 3"
              value={form.sessoes_estimadas}
              onChange={(e) => handleChange('sessoes_estimadas', e.target.value)}
            />
          </div>
        </Card>

        {/* Payment — only for new fechado projects */}
        {!isEditing && form.tipo_cobranca === 'fechado' && (
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted uppercase tracking-wide">Pagamento recebido</p>

            {/* First payment */}
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map(({ key, label }) => (
                <Chip
                  key={key}
                  active={payForma === key}
                  onClick={() => setPayForma(key)}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={payValor}
                onChange={(e) => setPayValor(e.target.value)}
              />
              <Input
                label="Data"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>

            {/* Second payment */}
            {pay2Enabled ? (
              <div className="flex flex-col gap-3 pt-1 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted uppercase tracking-wide">Segunda forma</span>
                  <button
                    type="button"
                    onClick={() => { setPay2Enabled(false); setPay2Valor('') }}
                    className="text-muted hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_METHODS.filter((m) => m.key !== payForma).map(({ key, label }) => (
                    <Chip
                      key={key}
                      active={pay2Forma === key}
                      onClick={() => setPay2Forma(key)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
                <Input
                  label="Valor (R$)"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={pay2Valor}
                  onChange={(e) => setPay2Valor(e.target.value)}
                />
                {payValor && pay2Valor && (
                  <p className="text-xs text-muted">
                    Total: R$ {(parseFloat(payValor) + parseFloat(pay2Valor)).toFixed(2)}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPay2Enabled(true)}
                className="text-xs text-primary text-left hover:opacity-80 transition-opacity"
              >
                + Dividir em outra forma de pagamento
              </button>
            )}

            <p className="text-xs text-muted">Deixe em branco se ainda não recebeu</p>
          </Card>
        )}

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          {isEditing ? 'Salvar alterações' : 'Criar Projeto'}
        </Button>
      </form>
    </div>
  )
}
