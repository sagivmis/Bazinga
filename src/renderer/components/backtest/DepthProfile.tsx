import { metricLabel, metricValue, type HeatmapMetric } from "../../../shared/sweepUtils"
import type { LabSweepCell, LabSweepResult } from "../../utils/multiSweepUtils"
import "../backtest/sweep-axis-panel.css"

interface DepthProfileProps {
  result: LabSweepResult
  depthAxisKey: string
  depthValue: number | null
  metric: HeatmapMetric
  labels: Record<string, string>
  onSelectDepth: (value: number) => void
}

/** Best metric at each depth slice (aggregated over other axes). */
export function buildDepthProfile(
  result: LabSweepResult,
  depthAxisKey: string,
  metric: HeatmapMetric
): { value: number; score: number; cell: LabSweepCell }[] {
  const byDepth = new Map<number, LabSweepCell>()
  for (const cell of result.cells) {
    const d = cell.values[depthAxisKey]
    if (d === undefined) continue
    const existing = byDepth.get(d)
    if (!existing || metricValue(cell.metrics, metric) > metricValue(existing.metrics, metric)) {
      byDepth.set(d, cell)
    }
  }
  return [...byDepth.entries()]
    .map(([value, cell]) => ({
      value,
      score: metricValue(cell.metrics, metric),
      cell
    }))
    .sort((a, b) => a.value - b.value)
}

export default function DepthProfile({
  result,
  depthAxisKey,
  depthValue,
  metric,
  labels,
  onSelectDepth
}: DepthProfileProps) {
  const profile = buildDepthProfile(result, depthAxisKey, metric)
  if (profile.length < 2) return null

  const scores = profile.map((p) => p.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const span = max - min || 1

  return (
    <div className="depth-profile">
      <p className="depth-profile-title">
        Depth — {labels[depthAxisKey] ?? depthAxisKey} (click a slice)
      </p>
      <div className="depth-profile-bars">
        {profile.map((row) => {
          const t = (row.score - min) / span
          const isActive = depthValue === row.value
          const color =
            row.score >= 0
              ? `rgb(${Math.round(255 * (1 - t))}, ${Math.round(100 + 155 * t)}, ${Math.round(195 * t + 60)})`
              : "#ff4d8d"
          return (
            <button
              key={row.value}
              type="button"
              className={`depth-bar-row${isActive ? " active" : ""}`}
              onClick={() => onSelectDepth(row.value)}
              title={`${labels[depthAxisKey]} = ${row.value}\n${metricLabel(metric, row.score)}`}
            >
              <span className="depth-bar-label">{row.value}</span>
              <div className="depth-bar-track">
                <div
                  className="depth-bar-fill"
                  style={{ width: `${Math.max(4, t * 100)}%`, background: color }}
                />
              </div>
              <span className="depth-bar-value">{metricLabel(metric, row.score)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
