import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientsApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

let municipiosCache = null

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEditing)
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    nascimento: '',
    cidade: '',
    estado: '',
    alerta_saude: '',
  })
  const [errors, setErrors] = useState({})
  const [citySuggestions, setCitySuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const cityDebounceRef = useRef(null)

  async function loadMunicipios() {
    if (municipiosCache) return municipiosCache
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
    const data = await res.json()
    municipiosCache = data.map((m) => ({
      nome: m.nome,
      uf: m.microrregiao.mesorregiao.UF.sigla,
    }))
    return municipiosCache
  }

  function handleCidadeChange(value) {
    handleChange('cidade', value)
    clearTimeout(cityDebounceRef.current)
    if (value.length < 2) {
      setCitySuggestions([])
      setShowSuggestions(false)
      return
    }
    cityDebounceRef.current = setTimeout(async () => {
      const all = await loadMunicipios()
      const lower = value.toLowerCase()
      const matches = all
        .filter((m) => m.nome.toLowerCase().startsWith(lower))
        .slice(0, 8)
      setCitySuggestions(matches)
      setShowSuggestions(matches.length > 0)
    }, 300)
  }

  function selectCity(city) {
    handleChange('cidade', city.nome)
    handleChange('estado', city.uf)
    setCitySuggestions([])
    setShowSuggestions(false)
  }

  useEffect(() => {
    if (!isEditing) return
    clientsApi.get(id).then(({ data }) => {
      if (data) {
        setForm({
          nome: data.nome || '',
          whatsapp: data.whatsapp || '',
          cpf: data.cpf || '',
          nascimento: data.nascimento || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          alerta_saude: data.alerta_saude || '',
        })
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
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório'
    if (!form.whatsapp.trim()) errs.whatsapp = 'WhatsApp obrigatório'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const data = {
      nome: form.nome,
      whatsapp: form.whatsapp.replace(/\D/g, ''),
      cpf: form.cpf || null,
      nascimento: form.nascimento || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      alerta_saude: form.alerta_saude || null,
    }

    const { error } = isEditing
      ? await clientsApi.update(id, data)
      : await clientsApi.create(data)

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }
    navigate(isEditing ? `/clientes/${id}` : '/clientes')
  }

  if (initLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader title={isEditing ? 'Editar Cliente' : 'Novo Cliente'} />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4">
          <Input
            label="Nome completo *"
            placeholder="Nome do cliente"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            error={errors.nome}
          />
          <Input
            label="WhatsApp *"
            placeholder="11999999999"
            type="tel"
            inputMode="numeric"
            value={form.whatsapp}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            error={errors.whatsapp}
            hint="Apenas números — será usado para link wa.me"
          />
        </Card>

        <Card className="p-4 flex flex-col gap-4">
          <p className="text-xs text-muted uppercase tracking-wide">Dados opcionais</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
            />
            <Input
              label="Nascimento"
              type="date"
              value={form.nascimento}
              onChange={(e) => handleChange('nascimento', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={form.cidade}
                autoComplete="off"
                onChange={(e) => handleCidadeChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#1E1E1E] border border-[#333] rounded-lg overflow-hidden shadow-lg">
                  {citySuggestions.map((city) => (
                    <button
                      key={`${city.nome}-${city.uf}`}
                      type="button"
                      onMouseDown={() => selectCity(city)}
                      className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-[#2A2A2A] flex justify-between items-center"
                    >
                      <span>{city.nome}</span>
                      <span className="text-xs text-muted ml-2">{city.uf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              label="Estado"
              placeholder="SP"
              maxLength={2}
              value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value.toUpperCase())}
            />
          </div>
        </Card>

        <Card className="p-4">
          <Textarea
            label="Alerta de saúde"
            placeholder="Ex: Diabético, alérgico a látex, usa anticoagulante..."
            value={form.alerta_saude}
            onChange={(e) => handleChange('alerta_saude', e.target.value)}
            hint="Se preenchido, será exibido em destaque vermelho nas sessões"
          />
        </Card>

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          {isEditing ? 'Salvar alterações' : 'Salvar Cliente'}
        </Button>
      </form>
    </div>
  )
}
