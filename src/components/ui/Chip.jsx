import { cn } from '../../lib/utils'

export default function Chip({ children, active, onClick, color = 'primary', className }) {
  const colors = {
    primary: active ? 'bg-primary/20 text-primary border-primary/50' : 'bg-[#2A2A2A] text-muted border-[#333]',
    success: active ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-[#2A2A2A] text-muted border-[#333]',
    danger: active ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#2A2A2A] text-muted border-[#333]',
    warning: active ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-[#2A2A2A] text-muted border-[#333]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95',
        colors[color],
        onClick ? 'cursor-pointer' : 'cursor-default',
        className
      )}
    >
      {children}
    </button>
  )
}
