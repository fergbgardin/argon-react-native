import { useEffect, useState } from 'react'
import { profilesApi } from '../lib/api'
import { isConfigured } from '../lib/supabase'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'

export default function PrivacyGate({ user, children }) {
  const [loading, setLoading] = useState(true)
  const [accepted, setAccepted] = useState(true)
  const [checkbox, setCheckbox] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isConfigured || !user) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    profilesApi.get(user.id).then(({ data }) => {
      if (cancelled) return
      setAccepted(!!data?.privacy_accepted_at)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleAccept() {
    setSaving(true)
    setError('')
    const { error: saveError } = await profilesApi.acceptPrivacy(user.id)
    setSaving(false)
    if (saveError) {
      setError('Não foi possível registrar seu aceite. Verifique sua conexão e tente novamente.')
      return
    }
    setAccepted(true)
  }

  if (loading) return <LoadingSpinner fullPage />

  if (accepted) return children

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div className="relative w-full max-w-lg glass-sheet rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">
            Aviso de Privacidade e Tratamento de Dados
          </h2>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-muted whitespace-pre-line leading-relaxed">
            Este aplicativo é uma ferramenta de gestão para tatuadores autônomos. Ao usá-lo, você
            poderá cadastrar dados pessoais dos seus clientes, incluindo informações sensíveis
            relacionadas à saúde (ex: alergias, condições de pele, contraindicações), conforme
            necessário para o seu trabalho.
            {'\n\n'}
            Você, como usuário e responsável pelo cadastro desses dados, declara estar ciente de que:
          </p>

          <ul className="text-sm text-muted leading-relaxed list-disc pl-5 flex flex-col gap-1">
            <li>É responsável por obter o consentimento dos seus clientes para o tratamento das informações que você inserir no sistema;</li>
            <li>Os dados são armazenados de forma segura e isolada, acessíveis apenas pela sua conta;</li>
            <li>O uso das informações deve se limitar à finalidade do seu trabalho como tatuador (histórico de projetos, cuidados pós-tatuagem, contato);</li>
            <li>Você não deve inserir dados sensíveis de clientes sem justificativa ligada à prestação do serviço.</li>
          </ul>

          <p className="text-sm text-muted leading-relaxed">
            Este aviso está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
          </p>

          <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkbox}
              onChange={(e) => setCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
            />
            <span className="text-sm text-white leading-relaxed">
              Li e estou de acordo com o tratamento de dados descrito acima, e assumo a
              responsabilidade pelos dados de terceiros que inserir no sistema.
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button full disabled={!checkbox} loading={saving} onClick={handleAccept}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
