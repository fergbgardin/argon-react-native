import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, FolderKanban, Users, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'components.nav.home' },
  { to: '/sessoes', icon: CalendarDays, labelKey: 'components.nav.sessions' },
  { to: '/projetos', icon: FolderKanban, labelKey: 'components.nav.projects' },
  { to: '/clientes', icon: Users, labelKey: 'components.nav.clients' },
  { to: '/config', icon: Settings, labelKey: 'components.nav.settings' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[3.25rem] active:scale-95 ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_18px_-6px_rgba(192,132,252,0.65)]" />
                )}
                <Icon size={22} className="relative" />
                <span className="relative text-[10px] font-medium">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
