import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Wallet, AlertCircle, Cake, Building2, ChevronRight, Plus
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { sessionsApi, expensesApi, clientsApi } from '../lib/api'
import { isConfigured } from '../lib/supabase'
import { formatCurrency, formatMonthYear } from '../lib/utils'
import { useAuth, getProfile } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function KpiCard({ label, value, sub, icon: Icon, iconColor = 'text-primary' }) {
  return (
    <Card className="p-4 flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
          <p className="text-xl font-bold text-white truncate">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-[#2A2A2A] ${iconColor} flex-shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm">
      <p className="text-muted mb-1">{label}</p>
      <p className="text-white font-semibold">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profile = user ? getProfile(user) : null
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ faturamento: 0, lucro: 0, pendentes: [] })
  const [chartData, setChartData] = useState([])
  const [birthdays, setBirthdays] = useState([])

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const [sessionsRes, expensesRes, clientsRes] = await Promise.all([
        sessionsApi.list(),
        expensesApi.list(),
        clientsApi.list(),
      ])

      const sessions = sessionsRes.data || []
      const expenses = expensesRes.data || []
      const clients = clientsRes.data || []

      const now = new Date()
      const monthStart = startOfMonth(now).toISOString().split('T')[0]
      const monthEnd = endOfMonth(now).toISOString().split('T')[0]

      const concluded = sessions.filter((s) => s.status === 'concluida')
      const monthSessions = concluded.filter(
        (s) => s.data_sessao >= monthStart && s.data_sessao <= monthEnd
      )

      const faturamento = monthSessions.reduce((sum, s) => {
        const pays = (s.session_payments || []).reduce((a, p) => a + (p.valor || 0), 0)
        return sum + pays
      }, 0)

      const custoMaterial = monthSessions.reduce((s, sess) => s + (sess.custo_material || 0), 0)
      const comissoes = monthSessions.reduce((s, sess) => s + (sess.valor_comissao_estudio || 0), 0)
      const despesas = expenses
        .filter((e) => e.data_pagamento && e.data_pagamento >= monthStart && e.data_pagamento <= monthEnd)
        .reduce((s, e) => s + (e.valor || 0), 0)
      const lucro = faturamento - custoMaterial - comissoes - despesas

      // Group pending payouts by studio
      const pendingSessions = concluded.filter((s) => !s.payout_id)
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

      setKpis({
        faturamento,
        lucro,
        pendentes: Object.values(pendingByStudio),
      })

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
        const valor = mSessions.reduce((sum, s) => {
          return sum + (s.session_payments || []).reduce((a, p) => a + (p.valor || 0), 0)
        }, 0)
        return { name: m.label, valor }
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

  return (
    <div className="min-h-screen bg-bg pb-nav">
      {/* Demo banner */}
      {!isConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
          <p className="text-xs text-amber-400">Modo demo — conecte o Supabase para usar com dados reais</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between gap-3">
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

      {/* KPIs */}
      <div className="px-4 flex gap-3 mb-4">
        <KpiCard
          label="Faturamento"
          value={formatCurrency(kpis.faturamento)}
          icon={TrendingUp}
          iconColor="text-green-400"
        />
        <KpiCard
          label="Lucro líquido"
          value={formatCurrency(kpis.lucro)}
          icon={Wallet}
          iconColor={kpis.lucro >= 0 ? 'text-primary' : 'text-red-400'}
        />
      </div>

      {/* Pending Payouts */}
      {kpis.pendentes.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wide">
              Comissões pendentes
            </p>
            <Badge variant="warning">{formatCurrency(totalPendente)}</Badge>
          </div>
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
        </div>
      )}

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

      {/* Revenue Chart */}
      <div className="px-4 mb-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-3">
          Faturamento — últimos 6 meses
        </p>
        <Card className="p-4">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#C084FC"
                strokeWidth={2}
                dot={{ fill: '#C084FC', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
