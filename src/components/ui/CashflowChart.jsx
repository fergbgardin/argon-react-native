// Monthly cashflow: one bar per month whose height is the revenue,
// split into cost (muted base) + profit (brand gradient top).
// The current month is emphasized. Loss months render in danger tone.
export default function CashflowChart({ data = [] }) {
  const W = 320
  const H = 152
  const padX = 8
  const padTop = 24
  const padBottom = 22
  const chartH = H - padTop - padBottom
  const n = data.length || 1
  const slot = (W - padX * 2) / n
  const barW = Math.min(22, slot * 0.44)
  const baselineY = H - padBottom
  const maxEnt = Math.max(1, ...data.map((d) => d.entradas || 0))

  const compact = (v) => {
    const sign = v < 0 ? '-' : '+'
    const a = Math.abs(v)
    if (a >= 1000) return `${sign}R$ ${(a / 1000).toFixed(1).replace('.', ',')}k`
    return `${sign}R$ ${Math.round(a)}`
  }

  // rounded-top rectangle path
  const topRect = (x, y, w, h, r) => {
    const rr = Math.max(0, Math.min(r, h, w / 2))
    return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Fluxo mensal">
      <defs>
        <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0637e" />
          <stop offset="1" stopColor="#7c6cff" />
        </linearGradient>
      </defs>

      <line x1={padX} y1={baselineY} x2={W - padX} y2={baselineY} stroke="#2a2a33" strokeWidth="1" />

      {data.map((d, i) => {
        const cx = padX + slot * i + slot / 2
        const x = cx - barW / 2
        const entradas = d.entradas || 0
        const saidas = d.saidas || 0
        const lucro = entradas - saidas
        const isLoss = lucro < 0
        const isCurrent = i === n - 1
        const totalH = (entradas / maxEnt) * chartH
        const custosH = (Math.min(saidas, entradas) / maxEnt) * chartH
        const lucroH = Math.max(totalH - custosH, 0)
        const topY = baselineY - totalH
        const monthLabel = (d.name || '').split('/')[0]
        const op = isCurrent ? 1 : 0.5

        return (
          <g key={i}>
            {entradas > 0 && (
              isLoss ? (
                <path d={topRect(x, topY, barW, totalH, 5)} fill="#f87171" opacity={isCurrent ? 0.9 : 0.45} />
              ) : (
                <>
                  {custosH > 0 && (
                    <rect x={x} y={baselineY - custosH} width={barW} height={custosH} fill="#3a3a46" opacity={op} />
                  )}
                  {lucroH > 0.5 && (
                    <path d={topRect(x, topY, barW, lucroH, 5)} fill="url(#lucroGrad)" opacity={op} />
                  )}
                </>
              )
            )}

            {isCurrent && entradas > 0 && (
              <text
                x={cx}
                y={topY - 7}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
                fill={isLoss ? '#f87171' : '#ececf1'}
              >
                {compact(lucro)}
              </text>
            )}

            <text
              x={cx}
              y={H - 6}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="ui-monospace, monospace"
              fill={isCurrent ? '#ececf1' : '#6d6d78'}
            >
              {monthLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
