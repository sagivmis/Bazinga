import { useEffect, useMemo, useState } from "react"
import { Alert, Button, LinearProgress } from "@mui/material"
import type {
  BacktestResult,
  BacktestSweepCell,
  BacktestSweepResult,
  EnsembleMemberConfig,
  StrategyParams
} from "../../../shared/types"
import type { HeatmapApplyPayload } from "../../../shared/backtestSweepTypes"
import {
  ENSEMBLE_STRATEGY_ID,
  defaultEnsembleSweepAxes,
  getEnsembleTunableParams
} from "../../../shared/ensembleUtils"
import {
  HEATMAP_METRICS,
  defaultSweepAxes,
  getTunableParams,
  metricLabel,
  metricValue,
  type HeatmapMetric,
  type ParamField
} from "../../../shared/sweepUtils"
import { formatWeightSummary } from "../../utils/multiSweepUtils"
import ParamHeatmap, { buildHistoryHeatmap, mergeHeatmapData } from "./ParamHeatmap"
import { CompactField, FormGrid, FormSection } from "../forms/CompactField"

type StrategyMeta = {
  id: string
  name: string
  params: ParamField[]
}

export interface ParameterHeatmapPanelProps {
  strategyId: string
  params: StrategyParams
  ensemble: EnsembleMemberConfig[]
  symbol: string
  interval: string
  days: number
  strategies: StrategyMeta[]
  history: BacktestResult[]
  sweepResult: BacktestSweepResult | null
  labApplied?: HeatmapApplyPayload | null
  disabled?: boolean
  onApply: (params: StrategyParams, ensemble?: EnsembleMemberConfig[]) => void
}

export default function ParameterHeatmapPanel({
  strategyId,
  params,
  ensemble,
  symbol,
  interval,
  days,
  strategies,
  history,
  sweepResult,
  labApplied,
  disabled,
  onApply
}: ParameterHeatmapPanelProps) {
  const isEnsemble = strategyId === ENSEMBLE_STRATEGY_ID
  const selected = strategies.find((s) => s.id === strategyId)
  const schema = selected?.params ?? []
  const nameById = Object.fromEntries(strategies.map((s) => [s.id, s.name]))

  const tunable = useMemo(() => {
    if (isEnsemble) return getEnsembleTunableParams(schema, ensemble, nameById)
    return getTunableParams(schema)
  }, [isEnsemble, schema, ensemble, nameById])

  const defaultAxes = useMemo(() => {
    if (isEnsemble) return defaultEnsembleSweepAxes(ensemble, schema)
    return defaultSweepAxes(schema)
  }, [isEnsemble, ensemble, schema])

  const [paramXKey, setParamXKey] = useState(defaultAxes.xKey)
  const [paramYKey, setParamYKey] = useState(defaultAxes.yKey)
  const [sweepSteps, setSweepSteps] = useState(5)
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("score")
  const [sweepLoading, setSweepLoading] = useState(false)
  const [sweepProgress, setSweepProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localSweep, setLocalSweep] = useState<BacktestSweepResult | null>(sweepResult)

  useEffect(() => {
    setParamXKey(defaultAxes.xKey)
    setParamYKey(defaultAxes.yKey)
  }, [defaultAxes.xKey, defaultAxes.yKey, strategyId])

  useEffect(() => {
    setLocalSweep(sweepResult)
  }, [sweepResult])

  const paramXField = tunable.find((f) => f.key === paramXKey)
  const paramYField = tunable.find((f) => f.key === paramYKey)
  const totalRuns = sweepSteps * sweepSteps

  const heatmapData = useMemo(() => {
    if (!paramXKey || !paramYKey) return null
    const historyData = buildHistoryHeatmap(
      history,
      strategyId,
      symbol,
      interval,
      paramXKey,
      paramYKey,
      paramXField?.label ?? paramXKey,
      paramYField?.label ?? paramYKey
    )
    const sweepData =
      localSweep &&
      localSweep.strategyId === strategyId &&
      localSweep.symbol === symbol &&
      localSweep.interval === interval &&
      localSweep.paramXKey === paramXKey &&
      localSweep.paramYKey === paramYKey
        ? localSweep
        : null
    return mergeHeatmapData(sweepData, historyData)
  }, [
    history,
    localSweep,
    strategyId,
    symbol,
    interval,
    paramXKey,
    paramYKey,
    paramXField,
    paramYField
  ])

  const runSweep = async () => {
    if (!window.api) {
      setError("Not running in Electron — use the desktop app window.")
      return
    }
    if (!paramXField || !paramYField) {
      setError("Pick two parameters for the heatmap axes.")
      return
    }
    if (paramXKey === paramYKey) {
      setError("X and Y parameters must be different.")
      return
    }
    if (isEnsemble && ensemble.filter((m) => m.enabled !== false).length < 2) {
      setError("Ensemble needs at least 2 enabled strategies for weight sweeps.")
      return
    }

    setSweepLoading(true)
    setError(null)
    setSweepProgress({ done: 0, total: totalRuns })
    try {
      const endTime = Date.now()
      const startTime = endTime - days * 86400000
      const res = await window.api.backtest.sweep({
        strategyId,
        symbol,
        interval: interval as import("binance").KlineInterval,
        startTime,
        endTime,
        baseParams: params,
        initialBalance: 10000,
        ensemble: isEnsemble ? ensemble : undefined,
        paramX: {
          key: paramXKey,
          min: paramXField.min ?? 0,
          max: paramXField.max ?? 100,
          steps: sweepSteps,
          label: paramXField.label
        },
        paramY: {
          key: paramYKey,
          min: paramYField.min ?? 0,
          max: paramYField.max ?? 100,
          steps: sweepSteps,
          label: paramYField.label
        }
      })
      setLocalSweep(res)
      onApply(res.bestCell.params, res.bestCell.ensemble)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parameter sweep failed")
    } finally {
      setSweepLoading(false)
      setSweepProgress(null)
    }
  }

  const applyCell = (cell: BacktestSweepCell) => {
    onApply(cell.params, cell.ensemble)
  }

  return (
    <div>
      <FormSection
        title="Parameter heatmap"
        description={
          isEnsemble
            ? "Quick 2-axis sweep here, or use Heatmap Lab for full multi-member weight grid."
            : "Sweep parameter combinations locally. Click a cell to apply."
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {labApplied && isEnsemble && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Applied from Heatmap Lab</strong>
            {" — "}
            {labApplied.weights
              ? formatWeightSummary(labApplied.weights, nameById)
              : labApplied.ensemble.map((m) => `${nameById[m.strategyId] ?? m.strategyId}: ${m.weight}`).join(" · ")}
            {labApplied.metrics && (
              <>
                {" · Return "}
                {labApplied.metrics.totalReturn.toFixed(2)}%
                {" · "}
                {labApplied.metrics.totalTrades} trades
                {" · Score "}
                {metricLabel("score", metricValue(labApplied.metrics, "score"))}
              </>
            )}
          </Alert>
        )}

        <FormGrid wide>
          <CompactField
            select
            label="X axis"
            value={paramXKey}
            onChange={(e) => setParamXKey(e.target.value)}
            options={tunable.map((f) => ({ value: f.key, label: f.label }))}
          />
          <CompactField
            select
            label="Y axis"
            value={paramYKey}
            onChange={(e) => setParamYKey(e.target.value)}
            options={tunable.map((f) => ({ value: f.key, label: f.label }))}
          />
          <CompactField
            select
            label="Grid"
            value={String(sweepSteps)}
            onChange={(e) => setSweepSteps(parseInt(e.target.value) || 5)}
            options={[4, 5, 6, 7, 8].map((n) => ({
              value: String(n),
              label: `${n}×${n}`
            }))}
          />
          <CompactField
            select
            label="Color by"
            value={heatmapMetric}
            onChange={(e) => setHeatmapMetric(e.target.value as HeatmapMetric)}
            options={HEATMAP_METRICS.map((m) => ({ value: m.key, label: m.label }))}
          />
        </FormGrid>

        <Button
          variant="outlined"
          color="secondary"
          size="small"
          sx={{ mt: 1.5 }}
          onClick={() => void runSweep()}
          disabled={disabled || sweepLoading}
        >
          {sweepLoading
            ? `Sweeping ${sweepProgress?.done ?? 0}/${sweepProgress?.total ?? totalRuns}…`
            : `Run sweep (${totalRuns})`}
        </Button>

        {sweepLoading && sweepProgress && (
          <LinearProgress
            variant="determinate"
            value={(sweepProgress.done / sweepProgress.total) * 100}
            sx={{ mt: 1.5, borderRadius: 1 }}
          />
        )}
      </FormSection>

      <div style={{ marginTop: 16 }}>
        <ParamHeatmap data={heatmapData} metric={heatmapMetric} onSelectCell={applyCell} />
      </div>
    </div>
  )
}
