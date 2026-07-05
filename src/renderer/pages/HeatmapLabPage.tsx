import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Button,
  Checkbox,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from "@mui/material"
import type { KlineInterval } from "binance"
import type {
  EnsembleMemberConfig,
  EnsembleMultiSweepCell,
  EnsembleMultiSweepResult,
  StrategyParams
} from "../../shared/types"
import type { MemberWeightSweepAxis, HeatmapApplyPayload } from "../../shared/backtestSweepTypes"
import {
  countEnsembleSweepRuns,
  MAX_ENSEMBLE_SWEEP_RUNS
} from "../../shared/backtestSweepTypes"
import { defaultWeightAxes } from "../../shared/ensembleSweepUtils"
import { ENSEMBLE_STRATEGY_ID } from "../../shared/ensembleUtils"
import {
  HEATMAP_METRICS,
  metricLabel,
  metricValue,
  type HeatmapMetric
} from "../../shared/sweepUtils"
import ParamHeatmap from "../components/backtest/ParamHeatmap"
import { CompactField, FormGrid, FormRow, FormSection } from "../components/forms/CompactField"
import {
  formatWeightSummary,
  sliceMultiSweepToHeatmap,
  sortMultiSweepCells
} from "../utils/multiSweepUtils"
import { IPC } from "../../shared/ipc"
import { cellToApplyPayload } from "../hooks/useHeatmapLabSync"
import "../components/backtest/param-heatmap.css"
import "./heatmap-lab.css"

type StrategyMeta = { id: string; name: string }

export default function HeatmapLabPage() {
  const [strategies, setStrategies] = useState<StrategyMeta[]>([])
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [interval, setInterval] = useState<KlineInterval>("4h")
  const [days, setDays] = useState(90)
  const [params, setParams] = useState<StrategyParams>({})
  const [ensemble, setEnsemble] = useState<EnsembleMemberConfig[]>([])
  const [weightAxes, setWeightAxes] = useState<MemberWeightSweepAxis[]>([])
  const [xMemberId, setXMemberId] = useState("")
  const [yMemberId, setYMemberId] = useState("")
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("score")
  const [tableMetric, setTableMetric] = useState<HeatmapMetric>("score")
  const [result, setResult] = useState<EnsembleMultiSweepResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tableLimit, setTableLimit] = useState(500)
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [applyNotice, setApplyNotice] = useState<string | null>(null)

  const nameById = useMemo(
    () => Object.fromEntries(strategies.map((s) => [s.id, s.name])),
    [strategies]
  )

  const enabledAxes = weightAxes.filter((a) => a.enabled && a.steps > 0)
  const totalRuns = countEnsembleSweepRuns(weightAxes)
  const overLimit = totalRuns > MAX_ENSEMBLE_SWEEP_RUNS

  useEffect(() => {
    if (!window.api) return
    void Promise.all([
      window.api.strategies.list(),
      window.api.backtest.getLatestEnsembleMultiSweep?.(),
      window.api.heatmap.getBootstrap()
    ]).then(([list, latest, bootstrap]) => {
      const items = (list as StrategyMeta[]).filter((s) => s.id !== ENSEMBLE_STRATEGY_ID)
      setStrategies(items)

      if (bootstrap) {
        setSymbol(bootstrap.symbol)
        setInterval(bootstrap.interval)
        setDays(bootstrap.days)
        setParams(bootstrap.params)
        setEnsemble(bootstrap.ensemble)
        const axes = defaultWeightAxes(bootstrap.ensemble, Object.fromEntries(items.map((s) => [s.id, s.name])))
        setWeightAxes(axes)
        const enabled = bootstrap.ensemble.filter((m) => m.enabled !== false)
        if (enabled.length >= 2) {
          setXMemberId(enabled[0].strategyId)
          setYMemberId(enabled[1].strategyId)
        }
      }

      if (latest) setResult(latest as EnsembleMultiSweepResult)
    })
  }, [])

  useEffect(() => {
    if (!window.api) return
    const unsubResult = window.api.on(IPC.EVENT_ENSEMBLE_MULTI_SWEEP, (_, data) => {
      setResult(data as EnsembleMultiSweepResult)
    })
    const unsubProgress = window.api.on(IPC.EVENT_ENSEMBLE_MULTI_SWEEP_PROGRESS, (_, data) => {
      const p = data as { done: number; total: number }
      setProgress(p)
    })
    return () => {
      unsubResult?.()
      unsubProgress?.()
    }
  }, [])

  const updateAxis = (strategyId: string, patch: Partial<MemberWeightSweepAxis>) => {
    setWeightAxes((prev) =>
      prev.map((a) => (a.strategyId === strategyId ? { ...a, ...patch } : a))
    )
  }

  const heatmapData = useMemo(() => {
    if (!result || !xMemberId || !yMemberId || xMemberId === yMemberId) return null
    return sliceMultiSweepToHeatmap(result, xMemberId, yMemberId, heatmapMetric, nameById)
  }, [result, xMemberId, yMemberId, heatmapMetric, nameById])

  const sortedCells = useMemo(() => {
    if (!result) return []
    return sortMultiSweepCells(result.cells, tableMetric)
  }, [result, tableMetric])

  const runSweep = async () => {
    if (!window.api?.backtest.ensembleMultiSweep) {
      setError("Not running in Electron.")
      return
    }
    if (enabledAxes.length < 2) {
      setError("Enable at least 2 member weight axes.")
      return
    }
    if (overLimit) {
      setError(`Too many combinations (${totalRuns}). Max is ${MAX_ENSEMBLE_SWEEP_RUNS}. Reduce steps or disable members.`)
      return
    }

    setLoading(true)
    setError(null)
    setProgress({ done: 0, total: totalRuns })
    try {
      const endTime = Date.now()
      const startTime = endTime - days * 86400000
      const res = await window.api.backtest.ensembleMultiSweep({
        symbol,
        interval,
        startTime,
        endTime,
        baseParams: params,
        initialBalance: 10000,
        ensemble,
        weightAxes
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ensemble sweep failed")
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const applyCell = async (cell: EnsembleMultiSweepCell) => {
    if (!window.api?.heatmap?.apply) return
    const payload = cellToApplyPayload(cell.params, cell.ensemble, cell.weights, cell.metrics)
    await window.api.heatmap.apply(payload)
    setEnsemble(cell.ensemble.map((m) => ({ ...m, params: { ...m.params } })))
    setParams({ ...cell.params })
    setAppliedId(JSON.stringify(cell.weights))
    setApplyNotice(`Applied to main app — ${formatWeightSummary(cell.weights, nameById)}`)
  }

  const applyHeatmapCell = async (cell: import("../../shared/types").BacktestSweepCell) => {
    if (!cell.ensemble) return
    const weights = Object.fromEntries(cell.ensemble.map((m) => [m.strategyId, m.weight]))
    await applyCell({
      weights,
      ensemble: cell.ensemble,
      params: cell.params,
      metrics: cell.metrics
    })
  }

  const cellKey = (cell: EnsembleMultiSweepCell) => JSON.stringify(cell.weights)

  const memberOptions = enabledAxes.map((a) => ({
    value: a.strategyId,
    label: a.label
  }))

  return (
    <div className="heatmap-lab">
      <header className="heatmap-lab-header">
        <div>
          <h1>Heatmap Lab</h1>
          <p>
            Full grid sweep across all ensemble member weights. One candle fetch — then{" "}
            {totalRuns.toLocaleString()} local backtests.
          </p>
        </div>
      </header>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {applyNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setApplyNotice(null)}>
          {applyNotice}
        </Alert>
      )}

      {overLimit && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {totalRuns.toLocaleString()} runs exceeds the limit of {MAX_ENSEMBLE_SWEEP_RUNS}. Lower
          step counts or disable some members.
        </Alert>
      )}

      <div className="heatmap-lab-grid">
        <section className="panel heatmap-lab-panel">
          <FormSection title="Market & range">
            <FormRow>
              <CompactField label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
              <CompactField
                select
                label="Interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value as KlineInterval)}
                options={["15m", "1h", "4h", "1d"].map((i) => ({ value: i, label: i }))}
              />
              <CompactField
                label="Days"
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 90)}
              />
            </FormRow>
          </FormSection>

          <FormSection
            title="Member weight axes"
            description="Min / max weight and number of steps (evenly spaced). Cartesian product across all enabled members."
          >
            <TableContainer className="weight-axis-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">On</TableCell>
                    <TableCell>Strategy</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Max</TableCell>
                    <TableCell align="right">Steps</TableCell>
                    <TableCell align="right">Step Δ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weightAxes.map((axis) => {
                    const stepDelta =
                      axis.steps <= 1 ? 0 : (axis.max - axis.min) / (axis.steps - 1)
                    return (
                      <TableRow key={axis.strategyId}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={axis.enabled}
                            onChange={(e) => updateAxis(axis.strategyId, { enabled: e.target.checked })}
                          />
                        </TableCell>
                        <TableCell>{axis.label}</TableCell>
                        <TableCell align="right">
                          <input
                            className="axis-num-input"
                            type="number"
                            value={axis.min}
                            onChange={(e) =>
                              updateAxis(axis.strategyId, { min: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <input
                            className="axis-num-input"
                            type="number"
                            value={axis.max}
                            onChange={(e) =>
                              updateAxis(axis.strategyId, { max: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <input
                            className="axis-num-input"
                            type="number"
                            min={2}
                            max={20}
                            value={axis.steps}
                            onChange={(e) =>
                              updateAxis(axis.strategyId, {
                                steps: Math.max(2, parseInt(e.target.value) || 2)
                              })
                            }
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {stepDelta.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <p className="run-estimate">
              Total combinations: <strong>{totalRuns.toLocaleString()}</strong>
              {enabledAxes.length > 0 && (
                <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>
                  ({enabledAxes.map((a) => a.steps).join(" × ")})
                </span>
              )}
            </p>

            <Button
              variant="contained"
              color="primary"
              disabled={loading || overLimit || enabledAxes.length < 2}
              onClick={() => void runSweep()}
            >
              {loading
                ? `Running ${progress?.done ?? 0}/${progress?.total ?? totalRuns}…`
                : `Run full sweep (${totalRuns.toLocaleString()})`}
            </Button>
            {loading && progress && (
              <LinearProgress
                variant="determinate"
                value={(progress.done / progress.total) * 100}
                sx={{ mt: 1.5, borderRadius: 1 }}
              />
            )}
          </FormSection>
        </section>

        <section className="panel heatmap-lab-panel heatmap-lab-viz">
          <FormSection title="2D slice heatmap">
            <FormGrid wide>
              <CompactField
                select
                label="X axis member"
                value={xMemberId}
                onChange={(e) => setXMemberId(e.target.value)}
                options={memberOptions}
              />
              <CompactField
                select
                label="Y axis member"
                value={yMemberId}
                onChange={(e) => setYMemberId(e.target.value)}
                options={memberOptions}
              />
              <CompactField
                select
                label="Color by"
                value={heatmapMetric}
                onChange={(e) => setHeatmapMetric(e.target.value as HeatmapMetric)}
                options={HEATMAP_METRICS.map((m) => ({ value: m.key, label: m.label }))}
              />
            </FormGrid>
            <p className="slice-hint">
              Other member weights vary — each cell shows the best result for that X/Y pair.
            </p>
            <ParamHeatmap
              data={heatmapData}
              metric={heatmapMetric}
              onSelectCell={(cell) => void applyHeatmapCell(cell)}
            />
          </FormSection>

          {result?.bestCell && (
            <div className="heatmap-best panel" style={{ padding: 12, marginTop: 12 }}>
              <strong style={{ color: "var(--accent-teal)" }}>Best overall</strong>
              <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 13 }}>
                {formatWeightSummary(result.bestCell.weights, nameById)} · Return{" "}
                {result.bestCell.metrics.totalReturn.toFixed(2)}% ·{" "}
                {result.bestCell.metrics.totalTrades} trades · Score{" "}
                {metricLabel("score", metricValue(result.bestCell.metrics, "score"))}
              </span>
              <button
                type="button"
                className="heatmap-apply-btn"
                onClick={() => void applyCell(result.bestCell)}
              >
                Apply to main app
              </button>
            </div>
          )}
        </section>
      </div>

      {result && (
        <section className="panel heatmap-lab-results">
          <FormSection
            title={`All results (${result.cells.length.toLocaleString()} cells)`}
            description="Sorted by selected metric. Scroll for full grid output."
          >
            <FormRow>
              <CompactField
                select
                label="Sort by"
                value={tableMetric}
                onChange={(e) => setTableMetric(e.target.value as HeatmapMetric)}
                options={HEATMAP_METRICS.map((m) => ({ value: m.key, label: m.label }))}
              />
              <CompactField
                select
                label="Show rows"
                value={String(tableLimit)}
                onChange={(e) => setTableLimit(parseInt(e.target.value) || 500)}
                options={[
                  { value: "100", label: "Top 100" },
                  { value: "250", label: "Top 250" },
                  { value: "500", label: "Top 500" },
                  { value: "1000", label: "Top 1000" },
                  { value: "99999", label: "All" }
                ]}
              />
            </FormRow>

            <TableContainer className="results-table-wrap">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    {enabledAxes.map((a) => (
                      <TableCell key={a.strategyId} align="right">
                        <TableSortLabel active direction="desc">
                          {a.label} wt
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="right">Return %</TableCell>
                    <TableCell align="right">Trades</TableCell>
                    <TableCell align="right">Avg P&L</TableCell>
                    <TableCell align="right">PF</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Apply</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCells.slice(0, tableLimit).map((cell, i) => (
                    <TableRow
                      key={i}
                      hover
                      selected={appliedId === cellKey(cell)}
                      sx={{ cursor: "pointer" }}
                      onClick={() => void applyCell(cell)}
                    >
                      <TableCell>{i + 1}</TableCell>
                      {enabledAxes.map((a) => (
                        <TableCell key={a.strategyId} align="right">
                          {cell.weights[a.strategyId] ?? "—"}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        className={cell.metrics.totalReturn >= 0 ? "positive" : "negative"}
                      >
                        {cell.metrics.totalReturn.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{cell.metrics.totalTrades}</TableCell>
                      <TableCell align="right">{cell.metrics.avgPnlPerTrade.toFixed(2)}</TableCell>
                      <TableCell align="right">{cell.metrics.profitFactor.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {metricLabel("score", metricValue(cell.metrics, "score"))}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            void applyCell(cell)
                          }}
                        >
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </FormSection>
        </section>
      )}
    </div>
  )
}
