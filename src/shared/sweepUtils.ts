import type { BacktestResult, StrategyParams } from "./types"

export type HeatmapMetric = "totalReturn" | "avgPnlPerTrade" | "profitFactor" | "totalTrades" | "score"

export const HEATMAP_METRICS: { key: HeatmapMetric; label: string }[] = [
  { key: "score", label: "Quality Score" },
  { key: "totalReturn", label: "Total Return %" },
  { key: "avgPnlPerTrade", label: "Avg P&L / Trade" },
  { key: "profitFactor", label: "Profit Factor" },
  { key: "totalTrades", label: "Trade Count" }
]

/** Params we skip as heatmap axes (risk sizing, not signal tuning) */
export const SWEEP_SKIP_PARAMS = new Set([
  "notionalUsd",
  "stopLossPct",
  "takeProfitPct",
  "riskPct",
  "leverageMode",
  "leverageMin",
  "leverageMax"
])

export type ParamField = {
  key: string
  label: string
  type: string
  default: unknown
  min?: number
  max?: number
}

export function getTunableParams(schema: ParamField[]): ParamField[] {
  return schema.filter((f) => f.type === "number" && !SWEEP_SKIP_PARAMS.has(f.key))
}

export function defaultSweepAxes(schema: ParamField[]): { xKey: string; yKey: string } {
  const tunable = getTunableParams(schema)
  return {
    xKey: tunable[0]?.key ?? "cooldownBars",
    yKey: tunable[1]?.key ?? tunable[0]?.key ?? "volumeMultiplier"
  }
}

export function linspace(min: number, max: number, steps: number): number[] {
  if (steps <= 1) return [min]
  const out: number[] = []
  for (let i = 0; i < steps; i++) {
    out.push(min + ((max - min) * i) / (steps - 1))
  }
  return out
}

/** Round period-like params to integers; keep multipliers as decimals */
export function formatSweepValue(key: string, value: number): number {
  if (key.startsWith("weight:")) return Math.round(value)
  if (
    key.toLowerCase().includes("period") ||
    key.toLowerCase().includes("bars") ||
    key === "channelPeriod" ||
    key === "rangePeriod" ||
    key === "emaPeriod" ||
    key === "vwmaPeriod" ||
    key === "trendEmaPeriod" ||
    key === "pullbackLookback" ||
    key === "volumePeriod"
  ) {
    return Math.round(value)
  }
  return Math.round(value * 100) / 100
}

/** Few trades + high income composite (higher is better) */
export function compositeScore(metrics: BacktestResult["metrics"]): number {
  const tradePenalty = metrics.totalTrades > 0 ? Math.log10(metrics.totalTrades + 1) : 0
  return (
    metrics.totalReturn * 0.35 +
    metrics.avgPnlPerTrade * 2 * 0.35 +
    metrics.profitFactor * 5 * 0.2 -
    metrics.maxDrawdown * 0.15 -
    tradePenalty * 2
  )
}

export function metricValue(metrics: BacktestResult["metrics"], metric: HeatmapMetric): number {
  if (metric === "score") return compositeScore(metrics)
  return metrics[metric]
}

export function metricLabel(metric: HeatmapMetric, value: number): string {
  switch (metric) {
    case "totalReturn":
      return `${value.toFixed(2)}%`
    case "avgPnlPerTrade":
      return `$${value.toFixed(2)}`
    case "profitFactor":
      return value.toFixed(2)
    case "totalTrades":
      return String(Math.round(value))
    case "score":
      return value.toFixed(2)
  }
}

export function paramKey(params: StrategyParams, xKey: string, yKey: string): string {
  return `${params[xKey]}|${params[yKey]}`
}
