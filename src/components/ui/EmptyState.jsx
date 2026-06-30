export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] flex items-center justify-center mb-4">
          <Icon size={28} className="text-muted" />
        </div>
      )}
      <p className="text-white font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-muted mb-4">{description}</p>}
      {action}
    </div>
  )
}
