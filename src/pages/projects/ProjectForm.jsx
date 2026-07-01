import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, clientsApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ProjectForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [initLoading, setInitLoading] = useState(true)

  const [form, setForm] = useState({
    client_id: '',
    nome: '',
    area_corpo: '',
    tipo_cobranca: 'por_sessao',
    valor_total: '',
    sessoes_estimadas: '',
    status: 'ativo',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    clientsApi.list().then(({ data }) => {
      setClients(data || [])
      setInitLoading(false)
    })
  }, [])

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
      area_corpo: form.area_corpo || null,
      tipo_cobranca: form.tipo_cobranca,
      valor_total: form.valor_total ? parseFloat(form.valor_total) : null,
      sessoes_estimadas: form.sessoes_estimadas ? parseInt(form.sessoes_estimadas) : null,
      status: form.status,
    }

    const { data: project, error } = await projectsApi.create(data)
    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }
    navigate('/projetos')
  }

  if (initLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader title="Novo Projeto" />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4">
          <Select
            label="Cliente *"
            value={form.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            error={errors.client_id}
          >
            <option value="">Selecionar cliente...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Select>

          <Input
            label="Nome do projeto *"
            placeholder="Ex: Manga completa, Costas..."
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            error={errors.nome}
          />

          <Input
            label="Área do corpo"
            placeholder="Ex: Braço direito, Costela..."
            value={form.area_corpo}
            onChange={(e) => handleChange('area_corpo', e.target.value)}
          />
        </Card>

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
            <Input
              label={form.tipo_cobranca === 'fechado' ? 'Valor total (R$)' : 'Valor estimado (R$)'}
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.valor_total}
              onChange={(e) => handleChange('valor_total', e.target.value)}
            />
            <Input
              label="Sessões estimadas"
              type="number"
              placeholder="Ex: 3"
              value={form.sessoes_estimadas}
              onChange={(e) => handleChange('sessoes_estimadas', e.target.value)}
            />
          </div>
        </Card>

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          Criar Projeto
        </Button>
      </form>
    </div>
  )
}
