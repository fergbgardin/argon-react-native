import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profilesApi } from '../lib/api'
import { isConfigured } from '../lib/supabase'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'

export default function PrivacyGate({ user, children }) {
  const { t } = useTranslation()
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
      setError(t('privacy.error'))
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
            {t('privacy.title')}
          </h2>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-muted whitespace-pre-line leading-relaxed">
            {t('privacy.intro')}
            {'\n\n'}
            {t('privacy.declareIntro')}
          </p>

          <ul className="text-sm text-muted leading-relaxed list-disc pl-5 flex flex-col gap-1">
            <li>{t('privacy.bullets.consent')}</li>
            <li>{t('privacy.bullets.storage')}</li>
            <li>{t('privacy.bullets.purpose')}</li>
            <li>{t('privacy.bullets.sensitive')}</li>
          </ul>

          <p className="text-sm text-muted leading-relaxed">
            {t('privacy.lgpd')}
          </p>

          <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkbox}
              onChange={(e) => setCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
            />
            <span className="text-sm text-white leading-relaxed">
              {t('privacy.checkboxLabel')}
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button full disabled={!checkbox} loading={saving} onClick={handleAccept}>
            {t('privacy.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
