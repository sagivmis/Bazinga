export const formatUsd = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

export const formatPnl = (value: number, decimals = 2) => {
  const formatted = Math.abs(value).toFixed(decimals)
  return value < 0 ? `(${formatted})` : formatted
}

export const formatPct = (value: number, decimals = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`

/** Dollar P&L from backtest metrics, with fallback for older saved results */
export function resolveBacktestTotalPnl(
  metrics: { totalPnl?: number; totalReturn?: number },
  equityCurve?: { equity: number }[]
): number {
  if (metrics.totalPnl !== undefined && !Number.isNaN(metrics.totalPnl)) {
    return metrics.totalPnl
  }
  if (equityCurve?.length) {
    const start = equityCurve[0]?.equity ?? 0
    const end = equityCurve.at(-1)?.equity ?? start
    return end - start
  }
  return 0
}
