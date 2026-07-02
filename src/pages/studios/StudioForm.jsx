import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { studiosApi } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function StudioForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEditing)
  const [deleteModal, setDeleteModal] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    local: '',
    tipo_cobranca: 'porcentagem',
    valor_padrao: '',
    is_favorite: false,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEditing) return
    studiosApi.get(id).then(({ data }) => {
      if (data) {
        setForm({
          nome: data.nome || '',
          local: data.local || '',
          tipo_cobranca: data.tipo_cobranca || 'porcentagem',
          valor_padrao: data.valor_padrao ?? '',
          is_favorite: !!data.is_favorite,
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
    if (!form.valor_padrao) errs.valor_padrao = 'Informe o valor'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const payload = {
      nome: form.nome,
      local: form.local || null,
      tipo_cobranca: form.tipo_cobranca,
      valor_padrao: parseFloat(form.valor_padrao),
      is_favorite: form.is_favorite,
    }
    const { error } = isEditing
      ? await studiosApi.update(id, payload)
      : await studiosApi.create(payload)

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }
    navigate('/studios')
  }

  async function handleDelete() {
    await studiosApi.delete(id)
    navigate('/studios')
  }

  if (initLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <PageHeader
        title={isEditing ? 'Editar Estúdio' : 'Novo Estúdio'}
        actions={
          isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteModal(true)}>
              <Trash2 size={18} className="text-red-400" />
            </Button>
          )
        }
      />

      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4">
          <Input
            label="Nome *"
            placeholder="Nome do estúdio"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            error={errors.nome}
          />
          <Input
            label="Endereço / Cidade"
            placeholder="Ex: Rua das Flores, 123 — São Paulo"
            value={form.local}
            onChange={(e) => handleChange('local', e.target.value)}
          />
        </Card>

        <Card className="p-4 flex flex-col gap-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tipo de cobrança</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'porcentagem', label: 'Porcentagem', desc: 'Ex: 30% do total' },
              { key: 'fixo', label: 'Valor fixo', desc: 'Ex: R$ 150 por sessão' },
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

          <Input
            label={form.tipo_cobranca === 'porcentagem' ? 'Porcentagem (%)' : 'Valor fixo (R$)'}
            type="number"
            step={form.tipo_cobranca === 'porcentagem' ? '1' : '0.01'}
            placeholder={form.tipo_cobranca === 'porcentagem' ? 'Ex: 30' : 'Ex: 150,00'}
            value={form.valor_padrao}
            onChange={(e) => handleChange('valor_padrao', e.target.value)}
            error={errors.valor_padrao}
          />
        </Card>

        {/* Favorite toggle */}
        <Card className="p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">Estúdio favorito</p>
              <p className="text-xs text-muted">Pré-selecionado em novas sessões</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_favorite', !form.is_favorite)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_favorite ? 'bg-primary' : 'bg-[#333]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.is_favorite ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </Card>

        {errors.submit && (
          <p className="text-sm text-red-400 text-center">{errors.submit}</p>
        )}

        <Button type="submit" full loading={loading} className="mb-6">
          {isEditing ? 'Salvar alterações' : 'Salvar Estúdio'}
        </Button>
      </form>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir estúdio">
        <p className="text-sm text-muted mb-4">
          Tem certeza? As sessões vinculadas a este estúdio ficarão sem estúdio, mas não serão excluídas.
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
