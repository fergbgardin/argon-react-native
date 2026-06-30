import { cn } from '../../lib/utils'

export default function Card({ children, className, onClick, ...props }) {
  const base = 'bg-card rounded-xl border border-[#2A2A2A]'
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
  return (
    <div className={cn(base, interactive, className)} onClick={onClick} {...props}>
      {children}
    </div>
  )
}
