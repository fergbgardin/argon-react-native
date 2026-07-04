// Monthly profit: one bar per month, height = lucro (entradas - saidas).
// Gradient fill when positive, danger tone when negative. Every bar is
// labeled with its exact value so there's no need to compare heights.
export default function CashflowChart({ data = [] }) {
  const W = 320
  const H = 152
  const padX = 8
  const padTop = 26
  const padBottom = 22
  const chartH = H - padTop - padBottom
  const n = data.length || 1
  const slot = (W - padX * 2) / n
  const barW = Math.min(28, slot * 0.5)
  const baselineY = H - padBottom

  const lucros = data.map((d) => (d.entradas || 0) - (d.saidas || 0))
  const maxAbs = Math.max(1, ...lucros.map((v) => Math.abs(v)))

  const compact = (v) => {
    const sign = v < 0 ? '-' : ''
    const a = Math.abs(v)
    if (a >= 1000) return `${sign}${(a / 1000).toFixed(1).replace('.', ',')}k`
    return `${sign}${Math.round(a)}`
  }

  const roundedRect = (x, y, w, h, r) => {
    const rr = Math.max(0, Math.min(r, h, w / 2))
    return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Lucro mensal">
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
        const lucro = lucros[i]
        const hasData = (d.entradas || 0) > 0 || (d.saidas || 0) > 0
        const isLoss = lucro < 0
        const isCurrent = i === n - 1
        const barH = Math.max((Math.abs(lucro) / maxAbs) * chartH, hasData ? 3 : 0)
        const monthLabel = (d.name || '').split('/')[0]
        const op = isCurrent ? 1 : 0.55

        return (
          <g key={i}>
            {hasData && (
              <path
                d={roundedRect(x, baselineY - barH, barW, barH, 5)}
                fill={isLoss ? '#f87171' : 'url(#lucroGrad)'}
                opacity={op}
              />
            )}

            {hasData && (
              <text
                x={cx}
                y={baselineY - barH - 7}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight={isCurrent ? '700' : '500'}
                fontFamily="ui-monospace, monospace"
                fill={isCurrent ? (isLoss ? '#f87171' : '#ececf1') : '#6d6d78'}
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
