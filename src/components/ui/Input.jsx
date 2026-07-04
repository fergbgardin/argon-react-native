import { cn } from '../../lib/utils'

export default function Input({ label, error, hint, icon: Icon, right, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        )}
        <input
          className={cn(
            'w-full bg-card-hover border border-line rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#555] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
            Icon && 'pl-9',
            right && 'pr-9',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{right}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
