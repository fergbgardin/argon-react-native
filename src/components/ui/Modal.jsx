import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  // Rendered via portal to document.body: a fixed-position modal nested
  // inside an ancestor with backdrop-filter (e.g. the glass-header the
  // notification bell lives in) would otherwise be confined to that
  // ancestor's box instead of the viewport — backdrop-filter/filter create
  // a new containing block for fixed descendants, same as transform does.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg glass-sheet rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="p-1 text-muted hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
