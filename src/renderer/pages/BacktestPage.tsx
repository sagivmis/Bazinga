import { useCallback, useEffect, useState } from "react"
import { Button, Alert } from "@mui/material"
import type { BacktestResult, EnsembleMemberConfig, StrategyParams } from "../../shared/types"
import type { HeatmapApplyPayload } from "../../shared/backtestSweepTypes"
import { useBacktestStore } from "../stores/backtestStore"
import { useHeatmapLabSync } from "../hooks/useHeatmapLabSync"
import { formatPct, formatUsd } from "../../shared/format"
import { IPC } from "../../shared/ipc"
import { ENSEMBLE_STRATEGY_ID, defaultEnsembleMembers } from "../../shared/ensembleUtils"
import { schemaWithoutLeverage } from "../../shared/leverageUtils"
import type { ParamField } from "../../shared/sweepUtils"
import EnsembleBuilder from "../components/ensemble/EnsembleBuilder"
import ParameterHeatmapPanel from "../components/backtest/ParameterHeatmapPanel"
import OpenHeatmapLabButton from "../components/backtest/OpenHeatmapLabButton"
import { LeverageParamsSection } from "../components/forms/LeverageParamsSection"
import {
  CompactField,
  FormActions,
  FormRow,
  FormSection,
  StrategyParamsGrid
} from "../components/forms/CompactField"

type StrategyMeta = {
  id: string
  name: string
  description: string
  defaultParams?: StrategyParams
  params: ParamField[]
}

export default function BacktestPage() {
  const { history, load } = useBacktestStore()
  const [strategies, setStrategies] = useState<StrategyMeta[]>([])
  const [strategyId, setStrategyId] = useState("wyckoff-spring")
  const [params, setParams] = useState<StrategyParams>({})
  const [ensemble, setEnsemble] = useState<EnsembleMemberConfig[]>(defaultEnsembleMembers())
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [interval, setInterval] = useState("4h")
  const [days, setDays] = useState(90)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [sweepResult, setSweepResult] = useState<import("../../shared/types").BacktestSweepResult | null>(null)
  const [labApplied, setLabApplied] = useState<HeatmapApplyPayload | null>(null)

  const isEnsemble = strategyId === ENSEMBLE_STRATEGY_ID
  const baseStrategies = strategies.filter((s) => s.id !== ENSEMBLE_STRATEGY_ID)

  useEffect(() => {
    if (window.api) {
      void Promise.all([
        window.api.strategies.list(),
        window.api.backtest.getLatestSweep(),
        load()
      ]).then(([list, latestSweep]) => {
        const items = list as StrategyMeta[]
        setStrategies(items)
        const first = items.find((s) => s.id === "wyckoff-spring") ?? items[0]
        if (first) {
          setStrategyId(first.id)
          setParams(first.defaultParams ?? {})
        }
        if (latestSweep) setSweepResult(latestSweep)
      })
    }
  }, [load])

  useEffect(() => {
    if (!window.api) return
    const unsubSweep = window.api.on(IPC.EVENT_BACKTEST_SWEEP, (_, data) => {
      setSweepResult(data as import("../../shared/types").BacktestSweepResult)
    })
    return () => unsubSweep?.()
  }, [])

  const onStrategyChange = (id: string) => {
    setStrategyId(id)
    const strat = strategies.find((s) => s.id === id)
    setParams(strat?.defaultParams ? { ...strat.defaultParams } : {})
    if (id === ENSEMBLE_STRATEGY_ID && !isEnsemble) {
      setEnsemble(defaultEnsembleMembers())
    }
  }

  const selected = strategies.find((s) => s.id === strategyId)
  const schema = schemaWithoutLeverage(selected?.params ?? [])

  const run = async () => {
    if (!window.api) {
      setError("Not running in Electron — use the desktop app window.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const endTime = Date.now()
      const startTime = endTime - days * 86400000
      const res = await window.api.backtest.run({
        strategyId,
        symbol,
        interval: interval as import("binance").KlineInterval,
        startTime,
        endTime,
        params,
        initialBalance: 10000,
        ensemble: isEnsemble ? ensemble : undefined
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backtest failed")
    } finally {
      setLoading(false)
    }
  }

  const applyHeatmap = useCallback((nextParams: StrategyParams, nextEnsemble?: EnsembleMemberConfig[]) => {
    setParams(nextParams)
    if (nextEnsemble) setEnsemble(nextEnsemble)
  }, [])

  useHeatmapLabSync(useCallback((nextParams, nextEnsemble, payload) => {
    setParams(nextParams)
    setEnsemble(nextEnsemble)
    setLabApplied(payload)
  }, []))

  return (
    <div className="page-content">
      <h1 className="page-title">Backtest</h1>
      <p className="page-desc">
        Test single strategies or weighted ensembles. Use the heatmap to find optimal weights and
        parameters.
      </p>

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 720 }}>
          {error}
        </Alert>
      )}

      <div className="panel form-panel" style={{ maxWidth: 720, marginBottom: 20 }}>
        <FormSection>
          <CompactField
            select
            className="form-field-full"
            label="Strategy"
            value={strategyId}
            onChange={(e) => onStrategyChange(e.target.value)}
            options={strategies.map((s) => ({ value: s.id, label: s.name }))}
          />
          {selected && (
            <p className="form-section-desc" style={{ marginTop: 10, marginBottom: 0 }}>
              {selected.description}
            </p>
          )}
        </FormSection>

        <div className="form-divider" />

        <FormSection title="Market">
          <FormRow>
            <CompactField
              className="field-grow"
              label="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
            <CompactField
              className="field-md"
              select
              label="Interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              options={["15m", "1h", "4h", "1d"].map((i) => ({ value: i, label: i }))}
            />
            <CompactField
              className="field-sm"
              label="Days"
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
            />
          </FormRow>
        </FormSection>

        {isEnsemble && (
          <>
            <div className="form-divider" />
            <EnsembleBuilder
              members={ensemble}
              baseStrategies={baseStrategies}
              onChange={setEnsemble}
            />
          </>
        )}

        {schema.length > 0 && (
          <>
            <div className="form-divider" />
            <FormSection
              title={isEnsemble ? "Shared risk & threshold" : "Strategy parameters"}
            >
              <StrategyParamsGrid
                fields={schema}
                values={params}
                onChange={(key, value) => setParams({ ...params, [key]: value })}
              />
            </FormSection>
          </>
        )}

        <div className="form-divider" />
        <LeverageParamsSection params={params} onChange={setParams} />

        <FormActions>
          <Button variant="contained" onClick={() => void run()} disabled={loading}>
            {loading ? "Running..." : "Run Backtest"}
          </Button>
        </FormActions>
      </div>

      <div className="panel form-panel" style={{ maxWidth: 900, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <OpenHeatmapLabButton
            strategyId={strategyId}
            symbol={symbol}
            interval={interval}
            days={days}
            params={params}
            ensemble={ensemble}
            disabled={loading}
          />
        </div>
        <ParameterHeatmapPanel
          strategyId={strategyId}
          params={params}
          ensemble={ensemble}
          symbol={symbol}
          interval={interval}
          days={days}
          strategies={strategies}
          history={history}
          sweepResult={sweepResult}
          labApplied={labApplied}
          disabled={loading}
          onApply={applyHeatmap}
        />
      </div>

      {result && (
        <div className="panel form-panel">
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>
            Results — {result.strategyId} / {result.symbol} ({result.interval})
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 12
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Total Return</span>
              <br />
              <strong className={result.metrics.totalReturn >= 0 ? "positive" : "negative"}>
                {formatPct(result.metrics.totalReturn)}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Trades</span>
              <br />
              <strong>{result.metrics.totalTrades}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Avg P&amp;L</span>
              <br />
              <strong className={result.metrics.avgPnlPerTrade >= 0 ? "positive" : "negative"}>
                {formatUsd(result.metrics.avgPnlPerTrade)}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Win Rate</span>
              <br />
              <strong>{result.metrics.winRate.toFixed(1)}%</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Profit Factor</span>
              <br />
              <strong>{result.metrics.profitFactor.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Sharpe</span>
              <br />
              <strong>{result.metrics.sharpeRatio.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Max DD</span>
              <br />
              <strong className="negative">{result.metrics.maxDrawdown.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
