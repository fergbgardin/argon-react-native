import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { formatDate } from '../../lib/utils'

export default function NotificationBell({ updates, hasUnseen, onSeen }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  function handleClose() {
    setOpen(false)
    if (hasUnseen) onSeen?.()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-muted hover:text-white transition-colors flex-shrink-0"
      >
        <Bell size={20} />
        {hasUnseen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <Modal open={open} onClose={handleClose} title={t('notifications.title')}>
        {(updates || []).length === 0 ? (
          <p className="text-sm text-muted">{t('notifications.empty')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {updates.map((u) => (
              <div key={u.id} className="flex flex-col gap-1 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{u.titulo}</p>
                  <span className="text-xs text-muted flex-shrink-0">{formatDate(u.criado_em)}</span>
                </div>
                <p className="text-sm text-muted whitespace-pre-wrap">{u.corpo}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
