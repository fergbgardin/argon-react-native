import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/ui/BottomNav'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Maintenance from './pages/Maintenance'
import SessionList from './pages/sessions/SessionList'
import SessionForm from './pages/sessions/SessionForm'
import SessionDetail from './pages/sessions/SessionDetail'
import ProjectList from './pages/projects/ProjectList'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectDetail from './pages/projects/ProjectDetail'
import ClientList from './pages/clients/ClientList'
import ClientForm from './pages/clients/ClientForm'
import ClientDetail from './pages/clients/ClientDetail'
import StudioList from './pages/studios/StudioList'
import StudioForm from './pages/studios/StudioForm'
import StudioPayout from './pages/studios/StudioPayout'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import LoadingSpinner from './components/ui/LoadingSpinner'
import PrivacyGate from './components/PrivacyGate'
import { useAuth } from './hooks/useAuth'
import { isConfigured } from './lib/supabase'

// Desligar (false) quando a manutenção terminar.
const MAINTENANCE_MODE = true

export default function App() {
  const { session, loading } = useAuth()

  if (MAINTENANCE_MODE) return <Maintenance />

  if (loading) return <LoadingSpinner fullPage />

  // Require login when Supabase is configured
  if (isConfigured && !session) return <Login />

  return (
    <PrivacyGate user={session?.user}>
      <BrowserRouter>
        <div className="max-w-lg mx-auto relative min-h-screen bg-bg">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Sessions */}
            <Route path="/sessoes" element={<SessionList />} />
            <Route path="/sessoes/nova" element={<SessionForm />} />
            <Route path="/sessoes/:id" element={<SessionDetail />} />
            <Route path="/sessoes/:id/editar" element={<SessionForm />} />

            {/* Projects */}
            <Route path="/projetos" element={<ProjectList />} />
            <Route path="/projetos/novo" element={<ProjectForm />} />
            <Route path="/projetos/:id" element={<ProjectDetail />} />
            <Route path="/projetos/:id/editar" element={<ProjectForm />} />

            {/* Clients */}
            <Route path="/clientes" element={<ClientList />} />
            <Route path="/clientes/novo" element={<ClientForm />} />
            <Route path="/clientes/:id" element={<ClientDetail />} />
            <Route path="/clientes/:id/editar" element={<ClientForm />} />

            {/* Studios */}
            <Route path="/studios" element={<StudioList />} />
            <Route path="/studios/novo" element={<StudioForm />} />
            <Route path="/studios/:id/editar" element={<StudioForm />} />
            <Route path="/studios/:id/acerto" element={<StudioPayout />} />

            {/* Expenses */}
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/despesas/nova" element={<Expenses />} />

            {/* Settings */}
            <Route path="/config" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <BottomNav />
        </div>
      </BrowserRouter>
    </PrivacyGate>
  )
}
