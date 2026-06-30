import { cn } from '../../lib/utils'

export default function Input({ label, error, hint, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-primary transition-colors',
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
