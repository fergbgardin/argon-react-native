import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Wallet, AlertCircle, Cake, Building2, ChevronRight, Plus, CheckCircle2,
  CalendarDays, Banknote, Settings as SettingsIcon
} from 'lucide-react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { sessionsApi, expensesApi, clientsApi, projectPaymentsApi, studiosApi, settingsApi } from '../lib/api'
import { isConfigured } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import { useAuth, getProfile } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import AmbientGlow from '../components/ui/AmbientGlow'
import CashflowChart from '../components/ui/CashflowChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function StatTile({ label, value, icon: Icon, iconColor = 'text-primary', valueColor = 'text-white' }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
        <Icon size={15} className={iconColor} />
      </div>
      <p className={`text-lg leading-none font-bold tracking-tight tabular-nums truncate ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profile = user ? getProfile(user) : null
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ faturamento: 0, lucro: 0, pendentes: [], despesasAbertas: 0 })
  const [chartData, setChartData] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [hasStudios, setHasStudios] = useState(true)
  const [hasMaterialCosts, setHasMaterialCosts] = useState(true)
  const [materialAlertDismissed, setMaterialAlertDismissed] = useState(
    () => localStorage.getItem('materialCostAlertDismissed') === 'true'
  )

  function dismissMaterialAlert() {
    localStorage.setItem('materialCostAlertDismissed', 'true')
    setMaterialAlertDismissed(true)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const [sessionsRes, expensesRes, clientsRes, projPaysRes, studiosRes, settingsRes] = await Promise.all([
        sessionsApi.list(),
        expensesApi.list(),
        clientsApi.list(),
        projectPaymentsApi.listAll(),
        studiosApi.list(),
        settingsApi.get(),
      ])

      const sessions = sessionsRes.data || []
      const expenses = expensesRes.data || []
      const clients = clientsRes.data || []
      const projectPayments = projPaysRes.data || []
      const studios = studiosRes.data || []
      const settings = settingsRes.data

      setHasStudios(studios.length > 0)
      setHasMaterialCosts(
        !!settings && (
          settings.custo_material_pequena > 0 ||
          settings.custo_material_media > 0 ||
          settings.custo_material_grande > 0
        )
      )

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const monthStart = startOfMonth(now).toISOString().split('T')[0]
      const monthEnd = endOfMonth(now).toISOString().split('T')[0]

      const concluded = sessions.filter((s) => s.status === 'concluida')
      const monthSessions = concluded.filter(
        (s) => s.data_sessao >= monthStart && s.data_sessao <= monthEnd
      )

      // Revenue: session payments (por_sessao) + project payments (fechado)
      const receitaSessoes = monthSessions.reduce((sum, s) => {
        const pays = (s.session_payments || []).reduce((a, p) => a + (p.valor || 0), 0)
        return sum + pays
      }, 0)
      const receitaProjetos = projectPayments
        .filter((p) => p.data_pagamento >= monthStart && p.data_pagamento <= monthEnd)
        .reduce((sum, p) => sum + (p.valor || 0), 0)
      const faturamento = receitaSessoes + receitaProjetos

      const custoMaterial = monthSessions.reduce((s, sess) => s + (sess.custo_material || 0), 0)
      const comissoes = monthSessions.reduce((s, sess) => s + (sess.valor_comissao_estudio || 0), 0)
      const despesas = expenses
        .filter((e) => e.data_pagamento && e.data_pagamento >= monthStart && e.data_pagamento <= monthEnd)
        .reduce((s, e) => s + (e.valor || 0), 0)
      const lucro = faturamento - custoMaterial - comissoes - despesas

      // Group pending payouts by studio (only concluded sessions that owe commission)
      const pendingSessions = concluded.filter((s) => !s.payout_id && s.valor_comissao_estudio > 0)
      const pendingByStudio = {}
      pendingSessions.forEach((s) => {
        const studioId = s.studio_id
        if (!pendingByStudio[studioId]) {
          pendingByStudio[studioId] = {
            studio: s.studios,
            total: 0,
            count: 0,
          }
        }
        pendingByStudio[studioId].total += s.valor_comissao_estudio || 0
        pendingByStudio[studioId].count += 1
      })

      // Open (unpaid) expenses
      const openExpenses = expenses.filter((e) => !e.data_pagamento)
      const despesasAbertas = openExpenses.reduce((s, e) => s + (e.valor || 0), 0)

      setKpis({
        faturamento,
        lucro,
        pendentes: Object.values(pendingByStudio),
        despesasAbertas,
      })

      // Upcoming scheduled sessions (agenda)
      const upcoming = sessions
        .filter((s) => s.status === 'agendada' && s.data_sessao >= today)
        .sort((a, b) => a.data_sessao.localeCompare(b.data_sessao))
        .slice(0, 5)
      setUpcomingSessions(upcoming)

      // Build chart: last 6 months
      const chartMonths = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i)
        return {
          label: format(d, 'MMM/yy', { locale: ptBR }),
          start: startOfMonth(d).toISOString().split('T')[0],
          end: endOfMonth(d).toISOString().split('T')[0],
        }
      })

      const chart = chartMonths.map((m) => {
        const mSessions = concluded.filter(
          (s) => s.data_sessao >= m.start && s.data_sessao <= m.end
        )
        const entradaSessoes = mSessions.reduce((sum, s) => {
          return sum + (s.session_payments || []).reduce((a, p) => a + (p.valor || 0), 0)
        }, 0)
        const entradaProjetos = projectPayments
          .filter((p) => p.data_pagamento >= m.start && p.data_pagamento <= m.end)
          .reduce((sum, p) => sum + (p.valor || 0), 0)
        const mMaterial = mSessions.reduce((s, sess) => s + (sess.custo_material || 0), 0)
        const mComissoes = mSessions.reduce((s, sess) => s + (sess.valor_comissao_estudio || 0), 0)
        const mDespesas = expenses
          .filter((e) => e.data_pagamento && e.data_pagamento >= m.start && e.data_pagamento <= m.end)
          .reduce((s, e) => s + (e.valor || 0), 0)
        return {
          name: m.label,
          entradas: entradaSessoes + entradaProjetos,
          saidas: mMaterial + mComissoes + mDespesas,
        }
      })
      setChartData(chart)

      // Birthdays this month
      const bdays = clients.filter((c) => {
        if (!c.nascimento) return false
        try {
          const bday = parseISO(c.nascimento)
          return bday.getMonth() === now.getMonth()
        } catch { return false }
      })
      setBirthdays(bdays)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  const totalPendente = kpis.pendentes.reduce((s, p) => s + p.total, 0)
  const aPagar = totalPendente + kpis.despesasAbertas

  return (
    <div className="relative min-h-screen bg-bg pb-nav">
      <AmbientGlow />
      {/* Demo banner */}
      {!isConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
          <p className="text-xs text-amber-400">Modo demo — conecte o Supabase para usar com dados reais</p>
        </div>
      )}

      {/* Header */}
      <div
        className="sticky top-0 z-30 glass-header px-4 pb-4 flex items-center justify-between gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        <div className="min-w-0">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {profile ? (
            <h1 className="text-2xl font-bold text-white truncate">
              {greeting()}, {profile.firstName}
            </h1>
          ) : (
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          )}
        </div>
        {profile && (
          <button onClick={() => navigate('/config')} className="flex-shrink-0">
            <Avatar src={profile.avatar} initials={profile.initials} size={44} />
          </button>
        )}
      </div>

      {/* Setup alerts — grouped, shown until each is resolved */}
      {(!hasStudios || (!hasMaterialCosts && !materialAlertDismissed)) && (
        <div className="px-4 mb-4 flex flex-col gap-2">
          {!hasStudios && (
            <Card
              className="p-3 flex items-center gap-3"
              onClick={() => navigate('/studios/novo')}
            >
              <div className="p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                <Building2 size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Cadastre um estúdio</p>
                <p className="text-xs text-muted">Necessário para registrar sessões</p>
              </div>
              <ChevronRight size={16} className="text-muted flex-shrink-0" />
            </Card>
          )}
          {!hasMaterialCosts && !materialAlertDismissed && (
            <Card className="p-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                  <SettingsIcon size={16} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Custo de material no padrão</p>
                  <p className="text-xs text-muted">
                    Estamos usando os valores padrão (Pequena R$70, Média R$150, Grande R$250).
                    Você pode alterar isso quando quiser em Configurações.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={dismissMaterialAlert}>
                  Entendi
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/config')}>
                  Configurar
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Financial bento — hero result + supporting stats */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-5">
        {/* Hero: monthly result */}
        <div
          className="col-span-2 relative overflow-hidden rounded-2xl border border-primary/25 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(124,108,255,0.16), rgba(240,99,126,0.06) 62%), #1a1a1f' }}
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Resultado · {format(new Date(), 'MMMM', { locale: ptBR })}
            </p>
            <Wallet size={16} className={kpis.lucro >= 0 ? 'text-primary' : 'text-red-400'} />
          </div>
          <p
            className={`mt-3 text-[40px] leading-none font-extrabold tracking-tight tabular-nums ${
              kpis.lucro >= 0 ? 'text-gradient' : 'text-red-400'
            }`}
          >
            {formatCurrency(kpis.lucro)}
          </p>
          <p className="text-xs text-muted mt-2">Lucro líquido do mês</p>
        </div>

        {/* Faturamento */}
        <StatTile
          label="Faturamento"
          value={formatCurrency(kpis.faturamento)}
          icon={TrendingUp}
          iconColor="text-green-400"
        />

        {/* A pagar */}
        <StatTile
          label="A pagar"
          value={formatCurrency(aPagar)}
          icon={Banknote}
          iconColor="text-red-400"
          valueColor="text-red-400"
        />
      </div>

      {/* Upcoming sessions (agenda) */}
      <div className="px-4 mb-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Próximas sessões</p>
        {upcomingSessions.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-muted">Nenhuma sessão agendada</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingSessions.map((s) => (
              <Card
                key={s.id}
                className="p-3 flex items-center justify-between"
                onClick={() => navigate(`/sessoes/${s.id}`)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {s.projects?.clients?.nome || '—'}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {s.projects?.nome || ''}{s.studios?.nome ? ` · ${s.studios.nome}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted flex-shrink-0 ml-2">{formatDate(s.data_sessao)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Payouts — always shown as a reminder */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted uppercase tracking-wide">
            Comissões pendentes
          </p>
          {kpis.pendentes.length > 0 && (
            <Badge variant="warning">{formatCurrency(totalPendente)}</Badge>
          )}
        </div>
        {kpis.pendentes.length === 0 ? (
          <Card className="p-4 flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <CheckCircle2 size={16} className="text-green-400" />
            </div>
            <p className="text-sm text-muted">Nenhuma comissão pendente</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {kpis.pendentes.map((p, i) => (
              <Card
                key={i}
                className="p-3 flex items-center justify-between"
                onClick={() => navigate('/studios')}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Building2 size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.studio?.nome || '—'}</p>
                    <p className="text-xs text-muted">{p.count} sessão(ões)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-amber-400">
                    {formatCurrency(p.total)}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Birthdays */}
      {birthdays.length > 0 && (
        <div className="px-4 mb-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            Aniversariantes do mês
          </p>
          <div className="flex flex-col gap-2">
            {birthdays.map((c) => (
              <Card
                key={c.id}
                className="p-3 flex items-center gap-3"
                onClick={() => navigate(`/clientes/${c.id}`)}
              >
                <div className="p-1.5 bg-pink-500/10 rounded-lg">
                  <Cake size={16} className="text-pink-400" />
                </div>
                <p className="text-sm text-white flex-1">{c.nome}</p>
                <ChevronRight size={16} className="text-muted" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cashflow chart — signed monthly profit, gradient when positive */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted uppercase tracking-wide">
            Lucro — últimos 6 meses
          </p>
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-wide text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'linear-gradient(180deg,#f0637e,#7c6cff)' }} />
              Lucro
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#f87171]" />
              Prejuízo
            </span>
          </div>
        </div>
        <Card className="p-4">
          <CashflowChart data={chartData} />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Nova Sessão', to: '/sessoes/nova', icon: Plus },
            { label: 'Nova Despesa', to: '/despesas/nova', icon: AlertCircle },
          ].map(({ label, to, icon: Icon }) => (
            <Card
              key={to}
              className="p-3 flex items-center gap-2"
              onClick={() => navigate(to)}
            >
              <Icon size={16} className="text-primary" />
              <span className="text-sm text-white">{label}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
