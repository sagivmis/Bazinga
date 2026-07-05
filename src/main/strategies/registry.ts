import { emaVwmaCrossStrategy, computeEmaVwmaSignals } from "./EmaVwmaCross"
import { volumeBreakoutStrategy, computeVolumeBreakoutSignal } from "./VolumeBreakout"
import { wyckoffSpringStrategy, computeWyckoffSpringSignal } from "./WyckoffSpring"
import { wyckoffBreakoutStrategy, computeWyckoffBreakoutSignal } from "./WyckoffBreakout"
import { highVolumeTrendStrategy, computeHighVolumeTrendSignal } from "./HighVolumeTrend"
import { strategyEnsembleMeta } from "./StrategyEnsemble"
import { ENSEMBLE_STRATEGY_ID } from "./ensembleSignal"
import { withLeverageParams } from "./leverageSchema"
import type { Strategy } from "../engine/Strategy"
import type { StrategyParams } from "../../shared/types"
import type { Candle } from "../../shared/types"
import type { SignalFn, TradeSignal } from "./signalTypes"

const baseStrategies: Strategy[] = [
  volumeBreakoutStrategy,
  wyckoffSpringStrategy,
  wyckoffBreakoutStrategy,
  highVolumeTrendStrategy,
  emaVwmaCrossStrategy
].map(withLeverageParams)

const strategies: Strategy[] = [withLeverageParams(strategyEnsembleMeta), ...baseStrategies]

const signalFns: Record<string, SignalFn> = {
  "ema-vwma-cross": computeEmaVwmaSignals,
  "volume-breakout": computeVolumeBreakoutSignal,
  "wyckoff-spring": computeWyckoffSpringSignal,
  "wyckoff-breakout": computeWyckoffBreakoutSignal,
  "high-volume-trend": computeHighVolumeTrendSignal
}

export function listStrategies() {
  return strategies.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    params: s.paramSchema,
    defaultParams: s.defaultParams,
    isEnsemble: s.id === ENSEMBLE_STRATEGY_ID
  }))
}

export function listBaseStrategies() {
  return baseStrategies.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    params: s.paramSchema,
    defaultParams: s.defaultParams
  }))
}

export function getStrategy(id: string): Strategy {
  const s = strategies.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown strategy: ${id}`)
  return s
}

export function getStrategySignal(id: string, candles: Candle[], params: StrategyParams): TradeSignal | null {
  if (id === ENSEMBLE_STRATEGY_ID) return null
  const fn = signalFns[id]
  if (!fn) return null
  return fn(candles, params)
}

export function getSignalFn(id: string): SignalFn {
  if (id === ENSEMBLE_STRATEGY_ID) {
    throw new Error("Use createEnsembleSignalFn for ensemble strategy")
  }
  const fn = signalFns[id]
  if (!fn) throw new Error(`No signal function for strategy: ${id}`)
  return fn
}

export { strategies, ENSEMBLE_STRATEGY_ID }
