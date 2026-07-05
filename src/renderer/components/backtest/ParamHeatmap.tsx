import { Fragment } from "react"
import type { BacktestResult, BacktestSweepCell, BacktestSweepResult } from "../../../shared/types"
import type { HeatmapMetric } from "../../../shared/sweepUtils"
import { metricLabel, metricValue } from "../../../shared/sweepUtils"
import { resolveSweepValue } from "../../../shared/ensembleUtils"
import "./param-heatmap.css"

type HeatmapData = {
  paramXKey: string
  paramYKey: string
  paramXLabel: string
  paramYLabel: string
  xValues: number[]
  yValues: number[]
  cells: BacktestSweepCell[]
  bestCell?: BacktestSweepCell
  source: "sweep" | "history"
}

interface ParamHeatmapProps {
  data: HeatmapData | null
  metric: HeatmapMetric
  onSelectCell?: (cell: BacktestSweepCell) => void
}

function cellColor(value: number, min: number, max: number, metric: HeatmapMetric): string {
  if (max === min) return "var(--heatmap-mid, #1a2332)"
  const t = (value - min) / (max - min)

  if (metric === "totalTrades") {
    // Lower trade count = greener (invert)
    const inv = 1 - t
    return lerpColor(inv, "#ff4d8d", "#1a2332", "#00e5c3")
  }

  if (value < 0 && (metric === "totalReturn" || metric === "avgPnlPerTrade" || metric === "score")) {
    const tNeg = Math.max(0, Math.min(1, (value - min) / (0 - min || 1)))
    return lerpColor(1 - tNeg, "#ff4d8d", "#1a2332", "#2a3544")
  }

  return lerpColor(t, "#ff4d8d", "#1a2332", "#00e5c3")
}

function lerpColor(t: number, low: string, mid: string, high: string): string {
  if (t <= 0.5) {
    const u = t * 2
    return mixHex(low, mid, u)
  }
  const u = (t - 0.5) * 2
  return mixHex(mid, high, u)
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const n = h.replace("#", "")
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${bl})`
}

export function buildHistoryHeatmap(
  history: BacktestResult[],
  strategyId: string,
  symbol: string,
  interval: string,
  xKey: string,
  yKey: string,
  xLabel: string,
  yLabel: string
): HeatmapData | null {
  const filtered = history.filter((r) => {
    if (r.strategyId !== strategyId || r.symbol !== symbol || r.interval !== interval) return false
    const xv = resolveSweepValue(r.params ?? {}, r.ensemble, xKey)
    const yv = resolveSweepValue(r.params ?? {}, r.ensemble, yKey)
    return xv !== undefined && yv !== undefined
  })
  if (!filtered.length) return null

  const xSet = new Set<number>()
  const ySet = new Set<number>()
  for (const r of filtered) {
    xSet.add(resolveSweepValue(r.params ?? {}, r.ensemble, xKey)!)
    ySet.add(resolveSweepValue(r.params ?? {}, r.ensemble, yKey)!)
  }

  const xValues = [...xSet].sort((a, b) => a - b)
  const yValues = [...ySet].sort((a, b) => a - b)

  const cells: BacktestSweepCell[] = filtered.map((r) => ({
    xValue: resolveSweepValue(r.params ?? {}, r.ensemble, xKey)!,
    yValue: resolveSweepValue(r.params ?? {}, r.ensemble, yKey)!,
    params: r.params ?? {},
    ensemble: r.ensemble,
    metrics: r.metrics
  }))

  const bestCell = cells.reduce((best, cell) =>
    metricValue(cell.metrics, "score") > metricValue(best.metrics, "score") ? cell : best
  )

  return {
    paramXKey: xKey,
    paramYKey: yKey,
    paramXLabel: xLabel,
    paramYLabel: yLabel,
    xValues,
    yValues,
    cells,
    bestCell,
    source: "history"
  }
}

export default function ParamHeatmap({ data, metric, onSelectCell }: ParamHeatmapProps) {
  if (!data || !data.cells.length) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
        No heatmap data yet. Run a parameter sweep or backtest different param combinations.
      </p>
    )
  }

  const values = data.cells.map((c) => metricValue(c.metrics, metric))
  const min = Math.min(...values)
  const max = Math.max(...values)

  const cellMap = new Map<string, BacktestSweepCell>()
  for (const cell of data.cells) {
    cellMap.set(`${cell.xValue}|${cell.yValue}`, cell)
  }

  const isBest = (cell: BacktestSweepCell) =>
    data.bestCell &&
    cell.xValue === data.bestCell.xValue &&
    cell.yValue === data.bestCell.yValue

  return (
    <div className="param-heatmap">
      <div className="heatmap-meta">
        <span className="heatmap-source">
          Source: {data.source === "sweep" ? "Parameter sweep" : "Past backtests"} ·{" "}
          {data.cells.length} points
        </span>
        <div className="heatmap-legend">
          <span>{metricLabel(metric, min)}</span>
          <div className="legend-bar" />
          <span>{metricLabel(metric, max)}</span>
        </div>
      </div>

      <div
        className="heatmap-grid"
        style={{
          gridTemplateColumns: `72px repeat(${data.xValues.length}, minmax(52px, 1fr))`
        }}
      >
        <div className="heatmap-corner" />
        {data.xValues.map((x) => (
          <div key={`x-${x}`} className="heatmap-axis-x" title={String(x)}>
            {x}
          </div>
        ))}

        {[...data.yValues].reverse().map((y) => (
          <Fragment key={`row-${y}`}>
            <div className="heatmap-axis-y" title={String(y)}>
              {y}
            </div>
            {data.xValues.map((x) => {
              const cell = cellMap.get(`${x}|${y}`)
              if (!cell) {
                return <div key={`${x}-${y}`} className="heatmap-cell empty" />
              }
              const val = metricValue(cell.metrics, metric)
              const best = isBest(cell)
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={`heatmap-cell${best ? " best" : ""}`}
                  style={{ background: cellColor(val, min, max, metric) }}
                  title={`${data.paramXLabel}: ${x}, ${data.paramYLabel}: ${y}\nReturn: ${cell.metrics.totalReturn.toFixed(2)}% ($${(cell.metrics.totalPnl ?? 0).toFixed(2)})\nTrades: ${cell.metrics.totalTrades}\nAvg P&L: $${cell.metrics.avgPnlPerTrade.toFixed(2)}\nPF: ${cell.metrics.profitFactor.toFixed(2)}`}
                  onClick={() => onSelectCell?.(cell)}
                >
                  <span className="cell-value">{metricLabel(metric, val)}</span>
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>

      <p className="heatmap-axis-label-x">{data.paramXLabel} →</p>
      <p className="heatmap-axis-label-y">↑ {data.paramYLabel}</p>

      {data.bestCell && (
        <div className="heatmap-best panel" style={{ padding: 12, marginTop: 12 }}>
          <strong style={{ color: "var(--accent-teal)" }}>Best cell</strong>
          <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 13 }}>
            {data.paramXLabel}={data.bestCell.xValue}, {data.paramYLabel}={data.bestCell.yValue} ·{" "}
            Return {data.bestCell.metrics.totalReturn.toFixed(2)}% (${(data.bestCell.metrics.totalPnl ?? 0).toFixed(2)}) ·{" "}
            {data.bestCell.metrics.totalTrades}{" "}
            trades · Avg {metricLabel("avgPnlPerTrade", data.bestCell.metrics.avgPnlPerTrade)}
          </span>
          {onSelectCell && (
            <button
              type="button"
              className="heatmap-apply-btn"
              onClick={() => onSelectCell(data.bestCell!)}
            >
              Apply params
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export type { HeatmapData }

/** Merge sweep grid with history points (history overrides matching coords) */
export function mergeHeatmapData(
  sweep: BacktestSweepResult | null,
  history: HeatmapData | null
): HeatmapData | null {
  if (!sweep && !history) return null
  if (!sweep) return history
  if (!history) {
    return {
      paramXKey: sweep.paramXKey,
      paramYKey: sweep.paramYKey,
      paramXLabel: sweep.paramXLabel,
      paramYLabel: sweep.paramYLabel,
      xValues: sweep.xValues,
      yValues: sweep.yValues,
      cells: sweep.cells,
      bestCell: sweep.bestCell,
      source: "sweep"
    }
  }

  if (
    sweep.paramXKey !== history.paramXKey ||
    sweep.paramYKey !== history.paramYKey
  ) {
    return {
      paramXKey: sweep.paramXKey,
      paramYKey: sweep.paramYKey,
      paramXLabel: sweep.paramXLabel,
      paramYLabel: sweep.paramYLabel,
      xValues: sweep.xValues,
      yValues: sweep.yValues,
      cells: sweep.cells,
      bestCell: sweep.bestCell,
      source: "sweep"
    }
  }

  const merged = new Map<string, BacktestSweepCell>()
  for (const c of sweep.cells) merged.set(`${c.xValue}|${c.yValue}`, c)
  for (const c of history.cells) merged.set(`${c.xValue}|${c.yValue}`, c)

  const cells = [...merged.values()]
  const xValues = [...new Set(cells.map((c) => c.xValue))].sort((a, b) => a - b)
  const yValues = [...new Set(cells.map((c) => c.yValue))].sort((a, b) => a - b)
  const bestCell = cells.reduce((best, cell) =>
    metricValue(cell.metrics, "score") > metricValue(best.metrics, "score") ? cell : best
  )

  return {
    paramXKey: sweep.paramXKey,
    paramYKey: sweep.paramYKey,
    paramXLabel: sweep.paramXLabel,
    paramYLabel: sweep.paramYLabel,
    xValues,
    yValues,
    cells,
    bestCell,
    source: "sweep"
  }
}
