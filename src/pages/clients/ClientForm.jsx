import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function ClientForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

    const { data: client, error } = await clientsApi.create(data)
    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }
    navigate(`/clientes/${client.id}`)
  }

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader title="Novo Cliente" />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        {/* Required */}
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

        {/* Optional */}
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
            <Input
              label="Cidade"
              placeholder="São Paulo"
              value={form.cidade}
              onChange={(e) => handleChange('cidade', e.target.value)}
            />
            <Input
              label="Estado"
              placeholder="SP"
              maxLength={2}
              value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value.toUpperCase())}
            />
          </div>
        </Card>

        {/* Health alert */}
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
          Salvar Cliente
        </Button>
      </form>
    </div>
  )
}
