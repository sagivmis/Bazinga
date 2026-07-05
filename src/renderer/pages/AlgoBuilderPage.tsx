import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button } from "@mui/material"
import { useEngineStore } from "../stores/engineStore"
import { useBacktestStore } from "../stores/backtestStore"
import type { EnsembleMemberConfig, StrategyParams } from "../../shared/types"
import type { HeatmapApplyPayload } from "../../shared/backtestSweepTypes"
import { useHeatmapLabSync } from "../hooks/useHeatmapLabSync"
import { ENSEMBLE_STRATEGY_ID } from "../../shared/ensembleUtils"
import { schemaWithoutLeverage } from "../../shared/leverageUtils"
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
  params: { key: string; label: string; type: string; default: unknown }[]
  defaultParams?: StrategyParams
}

export default function AlgoBuilderPage() {
  const {
    params,
    setParams,
    strategyId,
    setStrategyId,
    symbols,
    setSymbol,
    ensemble,
    setEnsemble,
    armed,
    runningSymbols,
    error,
    saveConfig,
    armEngine,
    disarmEngine
  } = useEngineStore()
  const { history, load } = useBacktestStore()
  const [strategies, setStrategies] = useState<StrategyMeta[]>([])
  const [sweepResult, setSweepResult] = useState<import("../../shared/types").BacktestSweepResult | null>(null)
  const [labApplied, setLabApplied] = useState<HeatmapApplyPayload | null>(null)
  const [heatmapInterval, setHeatmapInterval] = useState("4h")
  const [heatmapDays, setHeatmapDays] = useState(90)

  const isEnsemble = strategyId === ENSEMBLE_STRATEGY_ID
  const baseStrategies = useMemo(
    () => strategies.filter((s) => s.id !== ENSEMBLE_STRATEGY_ID),
    [strategies]
  )

  useEffect(() => {
    if (window.api) {
      void Promise.all([
        window.api.strategies.list(),
        window.api.backtest.getLatestSweep(),
        load()
      ]).then(([list, latestSweep]) => {
        const items = list as StrategyMeta[]
        setStrategies(items)
        useEngineStore.getState().setStrategyCatalog(items)
        if (latestSweep) setSweepResult(latestSweep)
      })
    }
  }, [load])

  const selected = strategies.find((s) => s.id === strategyId)
  const schema = schemaWithoutLeverage(selected?.params ?? [])

  const applyHeatmap = useCallback((nextParams: StrategyParams, nextEnsemble?: EnsembleMemberConfig[]) => {
    setParams(nextParams)
    if (nextEnsemble) setEnsemble(nextEnsemble)
  }, [setParams, setEnsemble])

  useHeatmapLabSync(useCallback((nextParams, nextEnsemble, payload) => {
    setParams(nextParams)
    setEnsemble(nextEnsemble)
    setLabApplied(payload)
  }, [setParams, setEnsemble]))

  return (
    <div className="page-content">
      <h1 className="page-title">Algo Builder</h1>
      <p className="page-desc">
        Configure a single strategy or a weighted ensemble, tune parameters, sweep the heatmap, then
        arm the live engine.
      </p>

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 720 }}>
          {error}
        </Alert>
      )}

      {armed && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: 720 }}>
          Engine running — {strategyId} on {runningSymbols.join(", ") || symbols.join(", ")}
        </Alert>
      )}

      <div className="panel form-panel" style={{ maxWidth: 720, marginBottom: 20 }}>
        <FormSection>
          <CompactField
            select
            className="form-field-full"
            label="Strategy"
            value={strategyId ?? ""}
            onChange={(e) => {
              const id = e.target.value
              const strat = strategies.find((s) => s.id === id)
              setStrategyId(id, strat?.defaultParams as StrategyParams | undefined)
            }}
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
              value={symbols[0] ?? ""}
              onChange={(e) => setSymbol(e.target.value)}
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
            <FormSection title={isEnsemble ? "Shared risk & threshold" : "Parameters"}>
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
          <Button variant="outlined" onClick={() => void saveConfig()}>
            Save Config
          </Button>
          {!armed ? (
            <Button variant="contained" color="primary" onClick={() => void armEngine()}>
              Arm Engine
            </Button>
          ) : (
            <Button variant="contained" color="warning" onClick={() => void disarmEngine()}>
              Disarm Engine
            </Button>
          )}
        </FormActions>
      </div>

      <div className="panel form-panel" style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <OpenHeatmapLabButton
            strategyId={strategyId ?? ENSEMBLE_STRATEGY_ID}
            symbol={symbols[0] ?? "BTCUSDT"}
            interval={heatmapInterval}
            days={heatmapDays}
            params={params}
            ensemble={ensemble}
          />
        </div>
        <FormSection title="Heatmap settings">
          <FormRow>
            <CompactField
              className="field-md"
              select
              label="Interval"
              value={heatmapInterval}
              onChange={(e) => setHeatmapInterval(e.target.value)}
              options={["15m", "1h", "4h", "1d"].map((i) => ({ value: i, label: i }))}
            />
            <CompactField
              className="field-sm"
              label="Days"
              type="number"
              value={heatmapDays}
              onChange={(e) => setHeatmapDays(parseInt(e.target.value) || 90)}
            />
          </FormRow>
        </FormSection>

        <div className="form-divider" />

        <ParameterHeatmapPanel
          strategyId={strategyId ?? "wyckoff-spring"}
          params={params}
          ensemble={ensemble}
          symbol={symbols[0] ?? "BTCUSDT"}
          interval={heatmapInterval}
          days={heatmapDays}
          strategies={strategies}
          history={history}
          sweepResult={sweepResult}
          labApplied={labApplied}
          onApply={applyHeatmap}
        />
      </div>
    </div>
  )
}
