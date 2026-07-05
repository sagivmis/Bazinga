import type {
  BacktestSweepCell,
  EnsembleMultiSweepCell,
  EnsembleMultiSweepResult
} from "../../shared/types"
import { compositeScore, metricValue, type HeatmapMetric } from "../../shared/sweepUtils"
import type { HeatmapData } from "../components/backtest/ParamHeatmap"

/** Project N-dimensional weight sweep onto a 2D heatmap (best cell per X/Y pair). */
export function sliceMultiSweepToHeatmap(
  result: EnsembleMultiSweepResult,
  xStrategyId: string,
  yStrategyId: string,
  metric: HeatmapMetric,
  nameById: Record<string, string>
): HeatmapData | null {
  if (!result.cells.length) return null

  const xKey = `weight:${xStrategyId}`
  const yKey = `weight:${yStrategyId}`
  const merged = new Map<string, EnsembleMultiSweepCell>()

  for (const cell of result.cells) {
    const x = cell.weights[xStrategyId]
    const y = cell.weights[yStrategyId]
    if (x === undefined || y === undefined) continue
    const key = `${x}|${y}`
    const existing = merged.get(key)
    if (!existing || metricValue(cell.metrics, metric) > metricValue(existing.metrics, metric)) {
      merged.set(key, cell)
    }
  }

  if (!merged.size) return null

  const cells: BacktestSweepCell[] = [...merged.values()].map((cell) => ({
    xValue: cell.weights[xStrategyId]!,
    yValue: cell.weights[yStrategyId]!,
    params: cell.params,
    ensemble: cell.ensemble,
    metrics: cell.metrics
  }))

  const xValues = [...new Set(cells.map((c) => c.xValue))].sort((a, b) => a - b)
  const yValues = [...new Set(cells.map((c) => c.yValue))].sort((a, b) => a - b)
  const bestCell = cells.reduce((best, cell) =>
    metricValue(cell.metrics, metric) > metricValue(best.metrics, metric) ? cell : best
  )

  return {
    paramXKey: xKey,
    paramYKey: yKey,
    paramXLabel: nameById[xStrategyId] ?? xStrategyId,
    paramYLabel: nameById[yStrategyId] ?? yStrategyId,
    xValues,
    yValues,
    cells,
    bestCell,
    source: "sweep"
  }
}

export function sortMultiSweepCells(
  cells: EnsembleMultiSweepCell[],
  metric: HeatmapMetric,
  descending = true
): EnsembleMultiSweepCell[] {
  const dir = descending ? -1 : 1
  return [...cells].sort(
    (a, b) => dir * (metricValue(a.metrics, metric) - metricValue(b.metrics, metric))
  )
}

export function formatWeightSummary(weights: Record<string, number>, nameById: Record<string, string>) {
  return Object.entries(weights)
    .map(([id, w]) => `${nameById[id] ?? id}: ${w}`)
    .join(" · ")
}

export { compositeScore }
