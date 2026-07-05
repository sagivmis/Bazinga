import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Button,
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
import type { EnsembleMemberConfig, StrategyParams } from "../../shared/types"
import type { ParamSweepAxis } from "../../shared/backtestSweepTypes"
import { MAX_PARAM_SWEEP_RUNS, countParamSweepRuns } from "../../shared/backtestSweepTypes"
import { defaultWeightAxes } from "../../shared/ensembleSweepUtils"
import { defaultParamAxes, formatAxisValuesSummary } from "../../shared/paramSweepUtils"
import { ENSEMBLE_STRATEGY_ID } from "../../shared/ensembleUtils"
import { schemaWithoutLeverage } from "../../shared/leverageUtils"
import type { ParamField } from "../../shared/sweepUtils"
import {
  HEATMAP_METRICS,
  metricLabel,
  metricValue,
  type HeatmapMetric
} from "../../shared/sweepUtils"
import ParamHeatmap from "../components/backtest/ParamHeatmap"
import SweepAxisPanel from "../components/backtest/SweepAxisPanel"
import DepthProfile from "../components/backtest/DepthProfile"
import { CompactField, FormGrid, FormRow, FormSection } from "../components/forms/CompactField"
import SymbolField from "../components/forms/SymbolField"
import {
  formatWeightSummary,
  sliceLabSweepToHeatmap,
  sortLabSweepCells,
  uniqueAxisValues,
  type LabSweepCell,
  type LabSweepResult
} from "../utils/multiSweepUtils"
import { IPC } from "../../shared/ipc"
import { cellToApplyPayload } from "../hooks/useHeatmapLabSync"
import "../components/backtest/param-heatmap.css"
import "./heatmap-lab.css"

type StrategyMeta = {
  id: string
  name: string
  params: ParamField[]
}

function toEnsembleLabResult(
  result: import("../../shared/types").EnsembleMultiSweepResult
): LabSweepResult {
  return {
    axes: result.weightAxes.map((a) => ({ ...a, key: a.strategyId ?? a.key })),
    cells: result.cells.map((c) => ({
      values: c.weights,
      params: c.params,
      ensemble: c.ensemble,
      metrics: c.metrics
    })),
    bestCell: {
      values: result.bestCell.weights,
      params: result.bestCell.params,
      ensemble: result.bestCell.ensemble,
      metrics: result.bestCell.metrics
    }
  }
}

function toStrategyLabResult(
  result: import("../../shared/types").StrategyParamMultiSweepResult
): LabSweepResult {
  return {
    axes: result.paramAxes,
    cells: result.cells.map((c) => ({
      values: c.values,
      params: c.params,
      metrics: c.metrics
    })),
    bestCell: {
      values: result.bestCell.values,
      params: result.bestCell.params,
      metrics: result.bestCell.metrics
    }
  }
}

export default function HeatmapLabPage() {
  const [strategies, setStrategies] = useState<StrategyMeta[]>([])
  const [strategyId, setStrategyId] = useState("")
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [interval, setInterval] = useState<KlineInterval>("4h")
  const [days, setDays] = useState(90)
  const [params, setParams] = useState<StrategyParams>({})
  const [ensemble, setEnsemble] = useState<EnsembleMemberConfig[]>([])
  const [sweepAxes, setSweepAxes] = useState<ParamSweepAxis[]>([])
  const [xAxisKey, setXAxisKey] = useState("")
  const [yAxisKey, setYAxisKey] = useState("")
  const [depthAxisKey, setDepthAxisKey] = useState("")
  const [depthValue, setDepthValue] = useState<number | null>(null)
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("score")
  const [tableMetric, setTableMetric] = useState<HeatmapMetric>("score")
  const [labResult, setLabResult] = useState<LabSweepResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tableLimit, setTableLimit] = useState(500)
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [applyNotice, setApplyNotice] = useState<string | null>(null)

  const isEnsemble = strategyId === ENSEMBLE_STRATEGY_ID
  const selected = strategies.find((s) => s.id === strategyId)

  const axisLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    for (const a of sweepAxes) labels[a.key] = a.label
    return labels
  }, [sweepAxes])

  const enabledAxes = sweepAxes.filter((a) => a.enabled && a.steps > 0)
  const totalRuns = countParamSweepRuns(sweepAxes)
  const overLimit = totalRuns > MAX_PARAM_SWEEP_RUNS

  useEffect(() => {
    if (!window.api) return
    void Promise.all([
      window.api.strategies.list(),
      window.api.heatmap.getBootstrap()
    ]).then(([list, bootstrap]) => {
      const items = list as StrategyMeta[]
      setStrategies(items)

      if (!bootstrap) return

      setStrategyId(bootstrap.strategyId)
      setSymbol(bootstrap.symbol)
      setInterval(bootstrap.interval)
      setDays(bootstrap.days)
      setParams(bootstrap.params)
      setEnsemble(bootstrap.ensemble)

      const nameById = Object.fromEntries(items.map((s) => [s.id, s.name]))
      const isEns = bootstrap.strategyId === ENSEMBLE_STRATEGY_ID

      if (isEns) {
        const axes = defaultWeightAxes(bootstrap.ensemble, nameById)
        setSweepAxes(axes)
        const enabled = axes.filter((a) => a.enabled)
        if (enabled.length >= 2) {
          setXAxisKey(enabled[0].key)
          setYAxisKey(enabled[1].key)
        }
        void window.api.backtest.getLatestEnsembleMultiSweep?.().then((latest) => {
          if (latest) setLabResult(toEnsembleLabResult(latest))
        })
      } else {
        const strat = items.find((s) => s.id === bootstrap.strategyId)
        const schema = schemaWithoutLeverage(strat?.params ?? [])
        const axes = defaultParamAxes(schema, bootstrap.params)
        setSweepAxes(axes)
        const enabled = axes.filter((a) => a.enabled)
        if (enabled.length >= 2) {
          setXAxisKey(enabled[0].key)
          setYAxisKey(enabled[1].key)
        } else if (enabled.length === 1) {
          setXAxisKey(enabled[0].key)
        }
        void window.api.backtest.getLatestStrategyParamMultiSweep?.().then((latest) => {
          if (latest && latest.strategyId === bootstrap.strategyId) {
            setLabResult(toStrategyLabResult(latest))
          }
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!window.api) return
    const unsubEns = window.api.on(IPC.EVENT_ENSEMBLE_MULTI_SWEEP, (_, data) => {
      setLabResult(toEnsembleLabResult(data as import("../../shared/types").EnsembleMultiSweepResult))
    })
    const unsubStrat = window.api.on(IPC.EVENT_STRATEGY_PARAM_MULTI_SWEEP, (_, data) => {
      setLabResult(toStrategyLabResult(data as import("../../shared/types").StrategyParamMultiSweepResult))
    })
    const unsubEnsProg = window.api.on(IPC.EVENT_ENSEMBLE_MULTI_SWEEP_PROGRESS, (_, data) => {
      setProgress(data as { done: number; total: number })
    })
    const unsubStratProg = window.api.on(IPC.EVENT_STRATEGY_PARAM_MULTI_SWEEP_PROGRESS, (_, data) => {
      setProgress(data as { done: number; total: number })
    })
    return () => {
      unsubEns?.()
      unsubStrat?.()
      unsubEnsProg?.()
      unsubStratProg?.()
    }
  }, [])

  const depthAxisOptions = useMemo(() => {
    return enabledAxes.filter((a) => a.key !== xAxisKey && a.key !== yAxisKey)
  }, [enabledAxes, xAxisKey, yAxisKey])

  const depthValues = useMemo(() => {
    if (!labResult || !depthAxisKey) return []
    return uniqueAxisValues(labResult.cells, depthAxisKey)
  }, [labResult, depthAxisKey])

  useEffect(() => {
    if (!depthAxisKey) {
      setDepthValue(null)
      return
    }
    if (depthValues.length && (depthValue == null || !depthValues.includes(depthValue))) {
      setDepthValue(depthValues[0])
    }
  }, [depthAxisKey, depthValues, depthValue])

  const heatmapData = useMemo(() => {
    if (!labResult || !xAxisKey || !yAxisKey || xAxisKey === yAxisKey) return null
    return sliceLabSweepToHeatmap(
      labResult,
      xAxisKey,
      yAxisKey,
      heatmapMetric,
      axisLabels,
      depthAxisKey || undefined,
      depthAxisKey ? depthValue : null
    )
  }, [labResult, xAxisKey, yAxisKey, heatmapMetric, axisLabels, depthAxisKey, depthValue])

  const sortedCells = useMemo(() => {
    if (!labResult) return []
    return sortLabSweepCells(labResult.cells, tableMetric)
  }, [labResult, tableMetric])

  const runSweep = async () => {
    if (!window.api?.backtest) {
      setError("Not running in Electron.")
      return
    }
    if (enabledAxes.length < 1) {
      setError("Enable at least 1 parameter axis.")
      return
    }
    if (isEnsemble && enabledAxes.length < 2) {
      setError("Ensemble sweeps need at least 2 enabled member weight axes.")
      return
    }
    if (overLimit) {
      setError(`Too many combinations (${totalRuns}). Max is ${MAX_PARAM_SWEEP_RUNS}. Reduce steps or disable axes.`)
      return
    }

    setLoading(true)
    setError(null)
    setProgress({ done: 0, total: totalRuns })
    try {
      const endTime = Date.now()
      const startTime = endTime - days * 86400000

      if (isEnsemble) {
        await window.api.backtest.ensembleMultiSweep({
          symbol,
          interval,
          startTime,
          endTime,
          baseParams: params,
          initialBalance: 10000,
          ensemble,
          weightAxes: enabledAxes.map((a) => ({
            key: a.key,
            strategyId: a.key,
            label: a.label,
            min: a.min,
            max: a.max,
            steps: a.steps,
            enabled: true
          }))
        })
      } else {
        await window.api.backtest.strategyParamMultiSweep({
          strategyId,
          symbol,
          interval,
          startTime,
          endTime,
          baseParams: params,
          initialBalance: 10000,
          paramAxes: sweepAxes
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sweep failed")
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const applyCell = async (cell: LabSweepCell) => {
    if (!window.api?.heatmap?.apply) return
    const payload = cellToApplyPayload(
      strategyId,
      cell.params,
      cell.ensemble ?? ensemble,
      cell.values,
      cell.metrics,
      isEnsemble ? "ensemble" : "strategy"
    )
    await window.api.heatmap.apply(payload)
    setParams({ ...cell.params })
    if (cell.ensemble) setEnsemble(cell.ensemble.map((m) => ({ ...m, params: { ...m.params } })))
    setAppliedId(JSON.stringify(cell.values))
    const summary = isEnsemble
      ? formatWeightSummary(cell.values, axisLabels)
      : formatAxisValuesSummary(cell.values, axisLabels)
    setApplyNotice(`Applied to main app — ${summary}`)
  }

  const applyHeatmapCell = async (cell: import("../../shared/types").BacktestSweepCell) => {
    if (isEnsemble && cell.ensemble) {
      await applyCell({
        values: Object.fromEntries(cell.ensemble.map((m) => [m.strategyId, m.weight])),
        params: cell.params,
        ensemble: cell.ensemble,
        metrics: cell.metrics
      })
      return
    }
    const values = Object.fromEntries(
      enabledAxes.map((a) => [a.key, Number(cell.params[a.key] ?? 0)])
    )
    await applyCell({
      values,
      params: cell.params,
      metrics: cell.metrics
    })
  }

  const cellKey = (cell: LabSweepCell) => JSON.stringify(cell.values)
  const axisOptions = enabledAxes.map((a) => ({ value: a.key, label: a.label }))
  const strategyName = selected?.name ?? strategyId

  return (
    <div className="heatmap-lab">
      <header className="heatmap-lab-header">
        <div>
          <h1>Heatmap Lab</h1>
          <p>
            {isEnsemble
              ? `Full grid sweep of ensemble member weights for ${strategyName}.`
              : `Full grid sweep of ${strategyName} tunable parameters.`}{" "}
            One candle fetch — then {totalRuns.toLocaleString()} local backtests.
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
          {totalRuns.toLocaleString()} runs exceeds the limit of {MAX_PARAM_SWEEP_RUNS}. Lower step
          counts or disable some axes.
        </Alert>
      )}

      <div className="heatmap-lab-grid">
        <section className="panel heatmap-lab-panel">
          <FormSection title="Market & range">
            <FormRow>
              <SymbolField value={symbol} onChange={setSymbol} showQuickPicks={false} />
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
            title={isEnsemble ? "Member weight axes" : "Parameter axes"}
            description="Toggle parameters to sweep, set min/max/steps per axis. All enabled axes combine in a full grid."
          >
            <SweepAxisPanel
              axes={sweepAxes}
              onChange={setSweepAxes}
              isEnsemble={isEnsemble}
            />

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
              disabled={loading || overLimit || enabledAxes.length < 1}
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
          <FormSection title="3D slice heatmap">
            <p className="heatmap-3d-hint">
              Pick X and Y for the grid. Add a depth axis to slice through a third dimension — or leave
              depth on &quot;None&quot; to show the best cell per X/Y across all other parameters.
            </p>
            <FormGrid wide>
              <CompactField
                select
                label="X axis"
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                options={axisOptions}
              />
              <CompactField
                select
                label="Y axis"
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                options={axisOptions}
              />
              <CompactField
                select
                label="Depth axis"
                value={depthAxisKey}
                onChange={(e) => setDepthAxisKey(e.target.value)}
                options={[
                  { value: "", label: "None (best over all)" },
                  ...depthAxisOptions.map((a) => ({ value: a.key, label: a.label }))
                ]}
              />
              {depthAxisKey && depthValues.length > 0 && (
                <CompactField
                  select
                  label={`Depth = ${axisLabels[depthAxisKey] ?? depthAxisKey}`}
                  value={String(depthValue ?? depthValues[0])}
                  onChange={(e) => setDepthValue(parseFloat(e.target.value))}
                  options={depthValues.map((v) => ({ value: String(v), label: String(v) }))}
                />
              )}
              <CompactField
                select
                label="Color by"
                value={heatmapMetric}
                onChange={(e) => setHeatmapMetric(e.target.value as HeatmapMetric)}
                options={HEATMAP_METRICS.map((m) => ({ value: m.key, label: m.label }))}
              />
            </FormGrid>
            <p className="slice-hint">
              {depthAxisKey && depthValue != null
                ? `Showing slice where ${axisLabels[depthAxisKey] ?? depthAxisKey} = ${depthValue}. Other axes still pick the best cell per X/Y.`
                : "Other axes vary — each cell shows the best result for that X/Y pair."}
            </p>
            <ParamHeatmap
              data={heatmapData}
              metric={heatmapMetric}
              onSelectCell={(cell) => void applyHeatmapCell(cell)}
            />
            {labResult && depthAxisKey && (
              <DepthProfile
                result={labResult}
                depthAxisKey={depthAxisKey}
                depthValue={depthValue}
                metric={heatmapMetric}
                labels={axisLabels}
                onSelectDepth={setDepthValue}
              />
            )}
          </FormSection>

          {labResult?.bestCell && (
            <div className="heatmap-best panel" style={{ padding: 12, marginTop: 12 }}>
              <strong style={{ color: "var(--accent-teal)" }}>Best overall</strong>
              <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 13 }}>
                {isEnsemble
                  ? formatWeightSummary(labResult.bestCell.values, axisLabels)
                  : formatAxisValuesSummary(labResult.bestCell.values, axisLabels)}{" "}
                · Return {labResult.bestCell.metrics.totalReturn.toFixed(2)}% ·{" "}
                {labResult.bestCell.metrics.totalTrades} trades · Score{" "}
                {metricLabel("score", metricValue(labResult.bestCell.metrics, "score"))}
              </span>
              <button
                type="button"
                className="heatmap-apply-btn"
                onClick={() => void applyCell(labResult.bestCell)}
              >
                Apply to main app
              </button>
            </div>
          )}
        </section>
      </div>

      {labResult && (
        <section className="panel heatmap-lab-results">
          <FormSection
            title={`All results (${labResult.cells.length.toLocaleString()} cells)`}
            description="Sorted by selected metric. Click a row to apply."
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
                      <TableCell key={a.key} align="right">
                        <TableSortLabel active direction="desc">
                          {a.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="right">Return %</TableCell>
                    <TableCell align="right">P&amp;L $</TableCell>
                    <TableCell align="right">Trades</TableCell>
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
                        <TableCell key={a.key} align="right">
                          {cell.values[a.key] ?? "—"}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        className={cell.metrics.totalReturn >= 0 ? "positive" : "negative"}
                      >
                        {cell.metrics.totalReturn.toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={(cell.metrics.totalPnl ?? 0) >= 0 ? "positive" : "negative"}
                      >
                        {(cell.metrics.totalPnl ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{cell.metrics.totalTrades}</TableCell>
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
