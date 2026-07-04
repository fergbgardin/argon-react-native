import { cn } from '../../lib/utils'

export default function Card({ children, className, onClick, ...props }) {
  const base = 'bg-card rounded-2xl border border-border transition-colors'
  const interactive = onClick
    ? 'cursor-pointer active:scale-[0.98] active:bg-card-hover hover:border-white/10 transition-[transform,background-color,border-color]'
    : ''
  return (
    <div className={cn(base, interactive, className)} onClick={onClick} {...props}>
      {children}
    </div>
  )
}
