import { useState, useEffect } from 'react'
import { Plus, X, Building2, Receipt, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { settingsApi } from '../lib/api'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth, getProfile } from '../hooks/useAuth'
import PageHeader from '../components/ui/PageHeader'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profile = user ? getProfile(user) : null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    id: null,
    custo_material_pequena: 30,
    custo_material_media: 60,
    custo_material_grande: 100,
    presets_agulhas: [],
  })

  const [newAgulha, setNewAgulha] = useState('')

  useEffect(() => {
    settingsApi.get().then(({ data }) => {
      if (data) {
        setForm({
          id: data.id,
          custo_material_pequena: data.custo_material_pequena ?? 30,
          custo_material_media: data.custo_material_media ?? 60,
          custo_material_grande: data.custo_material_grande ?? 100,
          presets_agulhas: data.presets_agulhas || [],
        })
      }
      setLoading(false)
    })
  }, [])

  function addAgulha() {
    if (!newAgulha.trim()) return
    setForm((f) => ({ ...f, presets_agulhas: [...f.presets_agulhas, newAgulha.trim()] }))
    setNewAgulha('')
  }

  function removeAgulha(idx) {
    setForm((f) => ({ ...f, presets_agulhas: f.presets_agulhas.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    setSaving(true)
    await settingsApi.upsert(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-bg pb-nav">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* User profile */}
        {profile && (
          <Card className="p-4 flex items-center gap-3">
            <Avatar src={profile.avatar} initials={profile.initials} size={48} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.fullName}</p>
              {profile.email && <p className="text-xs text-muted truncate">{profile.email}</p>}
            </div>
          </Card>
        )}

        {/* Material costs */}
        <Card className="p-4 flex flex-col gap-4">
          <p className="text-xs text-muted uppercase tracking-wide">Custo de Material</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Pequena (R$)"
              type="number"
              step="0.01"
              value={form.custo_material_pequena}
              onChange={(e) =>
                setForm((f) => ({ ...f, custo_material_pequena: parseFloat(e.target.value) || 0 }))
              }
            />
            <Input
              label="Média (R$)"
              type="number"
              step="0.01"
              value={form.custo_material_media}
              onChange={(e) =>
                setForm((f) => ({ ...f, custo_material_media: parseFloat(e.target.value) || 0 }))
              }
            />
            <Input
              label="Grande (R$)"
              type="number"
              step="0.01"
              value={form.custo_material_grande}
              onChange={(e) =>
                setForm((f) => ({ ...f, custo_material_grande: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
        </Card>

        {/* Needle presets */}
        <Card className="p-4 flex flex-col gap-3">
          <p className="text-xs text-muted uppercase tracking-wide">Presets de Agulhas</p>
          <div className="flex flex-wrap gap-2">
            {form.presets_agulhas.map((ag, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-[#2A2A2A] border border-[#333] rounded-full px-3 py-1"
              >
                <span className="text-sm text-white">{ag}</span>
                <button
                  type="button"
                  onClick={() => removeAgulha(i)}
                  className="text-muted hover:text-red-400 transition-colors ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: RL #5"
              value={newAgulha}
              onChange={(e) => setNewAgulha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAgulha())}
              className="flex-1 bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] outline-none focus:border-primary"
            />
            <Button size="icon" variant="secondary" type="button" onClick={addAgulha}>
              <Plus size={16} />
            </Button>
          </div>
        </Card>

        {/* Quick links */}
        <Card className="p-4 flex flex-col gap-2">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Atalhos</p>
          {[
            { label: 'Gerenciar Estúdios', icon: Building2, to: '/studios' },
            { label: 'Despesas', icon: Receipt, to: '/despesas' },
          ].map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center gap-3 py-2 text-white hover:text-primary transition-colors"
            >
              <Icon size={16} className="text-muted" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </Card>

        <Button
          full
          onClick={handleSave}
          loading={saving}
          variant={saved ? 'secondary' : 'primary'}
        >
          {saved ? '✓ Salvo' : 'Salvar Configurações'}
        </Button>

        {isConfigured && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-red-400 transition-colors py-3 mb-6"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        )}
      </div>
    </div>
  )
}
