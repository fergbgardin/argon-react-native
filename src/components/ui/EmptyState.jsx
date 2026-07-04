export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl border border-primary/15 flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(124,108,255,0.14), rgba(240,99,126,0.05) 62%), #1a1a1f' }}
        >
          <Icon size={28} className="text-primary/80" />
        </div>
      )}
      <p className="text-white font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-muted mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
