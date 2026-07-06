import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full bg-card-hover border border-line rounded-xl pl-3 pr-9 py-2.5 text-white text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
