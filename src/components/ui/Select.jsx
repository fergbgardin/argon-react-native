import { cn } from '../../lib/utils'

export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors appearance-none',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
