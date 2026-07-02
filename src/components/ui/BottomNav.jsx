import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/projetos', icon: FolderKanban, label: 'Projetos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/config', icon: Settings, label: 'Config' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-[#2A2A2A] safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[3.5rem] ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
