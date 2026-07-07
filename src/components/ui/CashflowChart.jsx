// Monthly bars grouped by month: Lucro (signed, gradient positive / red
// negative), Material and Despesas (always >=0, fixed hue each). All three
// share one linear scale (same currency unit) so heights stay comparable.
// Only the current month gets value labels, to avoid crowding six months x
// three bars on a mobile-width chart.
export default function CashflowChart({ data = [] }) {
  const W = 320
  const H = 160
  const padX = 8
  const padTop = 28
  const padBottom = 22
  const chartH = H - padTop - padBottom
  const n = data.length || 1
  const slot = (W - padX * 2) / n
  const groupW = slot * 0.74
  const barGap = 2
  const barW = Math.max(4, (groupW - barGap * 2) / 3)
  const baselineY = H - padBottom

  const lucros = data.map((d) => (d.entradas || 0) - (d.saidas || 0))
  const materiais = data.map((d) => d.material || 0)
  const despesas = data.map((d) => d.despesas || 0)
  const maxAbs = Math.max(
    1,
    ...lucros.map((v) => Math.abs(v)),
    ...materiais,
    ...despesas
  )

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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Lucro, material e despesas mensais">
      <defs>
        <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0637e" />
          <stop offset="1" stopColor="#7c6cff" />
        </linearGradient>
      </defs>

      <line x1={padX} y1={baselineY} x2={W - padX} y2={baselineY} stroke="#2a2a33" strokeWidth="1" />

      {data.map((d, i) => {
        const groupX0 = padX + slot * i + (slot - groupW) / 2
        const isCurrent = i === n - 1
        const op = isCurrent ? 1 : 0.55
        const hasData = (d.entradas || 0) > 0 || (d.saidas || 0) > 0 || materiais[i] > 0 || despesas[i] > 0

        const bars = [
          { value: lucros[i], color: lucros[i] < 0 ? '#f87171' : 'url(#lucroGrad)', abs: Math.abs(lucros[i]) },
          { value: materiais[i], color: '#3987e5', abs: materiais[i] },
          { value: despesas[i], color: '#199e70', abs: despesas[i] },
        ]

        return (
          <g key={i}>
            {bars.map((bar, j) => {
              const x = groupX0 + j * (barW + barGap)
              const barH = Math.max((bar.abs / maxAbs) * chartH, bar.abs > 0 ? 2 : 0)
              return (
                <g key={j}>
                  {bar.abs > 0 && (
                    <path
                      d={roundedRect(x, baselineY - barH, barW, barH, 3)}
                      fill={bar.color}
                      opacity={op}
                    />
                  )}
                  {isCurrent && bar.abs > 0 && (
                    <text
                      x={x + barW / 2}
                      y={baselineY - barH - 4}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fontFamily="ui-monospace, monospace"
                      fill={j === 0 && bar.value < 0 ? '#f87171' : '#ececf1'}
                    >
                      {compact(bar.value)}
                    </text>
                  )}
                </g>
              )
            })}

            <text
              x={groupX0 + groupW / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="ui-monospace, monospace"
              fill={isCurrent ? '#ececf1' : '#6d6d78'}
              opacity={hasData ? 1 : 0.6}
            >
              {(d.name || '').split('/')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
