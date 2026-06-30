import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, subtitle, onBack, actions }) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      {(onBack !== false) && (
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
