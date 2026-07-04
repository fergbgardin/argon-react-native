import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-primary text-white shadow-[0_4px_16px_-4px_rgba(192,132,252,0.5)] hover:bg-primary-dark active:scale-[0.97]',
  secondary: 'bg-border text-white hover:bg-card-hover active:scale-[0.97]',
  ghost: 'text-muted hover:text-white hover:bg-border active:scale-[0.97]',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
  outline: 'border border-border text-white hover:bg-border active:scale-[0.97]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading,
  disabled,
  full,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        variants[variant],
        sizes[size],
        full && 'w-full',
        (loading || disabled) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
