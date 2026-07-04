import { cn } from '../../lib/utils'

export default function Textarea({ label, error, hint, className, rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          'w-full bg-card-hover border border-line rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#555] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
