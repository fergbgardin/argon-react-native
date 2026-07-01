import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { projectsApi, clientsApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ProjectForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

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
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const clientSearchRef = useRef(null)

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
      area_corpo: form.area_corpo || null,
      tipo_cobranca: form.tipo_cobranca,
      valor_total: form.valor_total !== '' ? parseFloat(form.valor_total) : null,
      sessoes_estimadas: form.sessoes_estimadas !== '' ? parseInt(form.sessoes_estimadas) : null,
      status: form.status,
    }

    const { error } = isEditing
      ? await projectsApi.update(id, data)
      : await projectsApi.create(data)

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }
    navigate(isEditing ? `/projetos/${id}` : '/projetos')
  }

  if (initLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader title={isEditing ? 'Editar Projeto' : 'Novo Projeto'} />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
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
                onFocus={() => {
                  setClientSearch('')
                  setShowClientList(true)
                }}
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
          {isEditing ? 'Salvar alterações' : 'Criar Projeto'}
        </Button>
      </form>
    </div>
  )
}
