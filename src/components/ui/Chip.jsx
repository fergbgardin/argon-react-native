import { cn } from '../../lib/utils'

export default function Chip({ children, active, onClick, color = 'primary', className }) {
  const colors = {
    primary: active
      ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_14px_-6px_rgba(192,132,252,0.65)]'
      : 'bg-border text-muted border-border',
    success: active
      ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_14px_-6px_rgba(34,197,94,0.55)]'
      : 'bg-border text-muted border-border',
    danger: active
      ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_14px_-6px_rgba(239,68,68,0.55)]'
      : 'bg-border text-muted border-border',
    warning: active
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_14px_-6px_rgba(245,158,11,0.55)]'
      : 'bg-border text-muted border-border',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all active:scale-95',
        colors[color],
        onClick ? 'cursor-pointer' : 'cursor-default',
        className
      )}
    >
      {children}
    </button>
  )
}
