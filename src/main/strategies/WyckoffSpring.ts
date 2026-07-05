import type { Strategy } from "../engine/Strategy"
import { avgVolume, highestHigh, lowestLow, num, type SignalFn } from "./signalTypes"

const commonParams = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 2.5, min: 0.5, max: 20 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 8, min: 2, max: 50 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 36, min: 0, max: 200 }
]

export const wyckoffSpringStrategy: Strategy = {
  id: "wyckoff-spring",
  name: "Wyckoff Spring / Upthrust",
  description:
    "Wyckoff-style liquidity sweep: price pierces range then closes back inside on high volume (spring = long, upthrust = short).",
  defaultParams: {
    rangePeriod: 48,
    sweepPct: 0.3,
    volumePeriod: 20,
    volumeMultiplier: 1.8,
    stopLossPct: 2.5,
    takeProfitPct: 8,
    notionalUsd: 100,
    cooldownBars: 36
  },
  paramSchema: [
    { key: "rangePeriod", label: "Range Lookback", type: "number", default: 48, min: 20, max: 120 },
    { key: "sweepPct", label: "Sweep Beyond Range %", type: "number", default: 0.3, min: 0.1, max: 2 },
    { key: "volumePeriod", label: "Volume Avg Period", type: "number", default: 20, min: 5, max: 60 },
    { key: "volumeMultiplier", label: "Min Volume × Avg", type: "number", default: 1.8, min: 1.2, max: 4 },
    ...commonParams
  ],
  async onCandleClose() {}
}

/**
 * Spring: wick below range low, close back above range low (stop hunt / accumulation)
 * Upthrust: wick above range high, close back below range high (distribution trap)
 */
export const computeWyckoffSpringSignal: SignalFn = (candles, params) => {
  const rangePeriod = num(params, "rangePeriod", 48)
  const sweepPct = num(params, "sweepPct", 0.3) / 100
  const volPeriod = num(params, "volumePeriod", 20)
  const volMult = num(params, "volumeMultiplier", 1.8)

  if (candles.length < rangePeriod + volPeriod + 2) return null

  const idx = candles.length - 2
  const c = candles[idx]
  const slice = candles.slice(0, idx)
  const rangeHigh = highestHigh(slice, rangePeriod, 0)
  const rangeLow = lowestLow(slice, rangePeriod, 0)
  const volAvg = avgVolume(candles, volPeriod, idx)

  if (rangeHigh <= rangeLow || volAvg <= 0) return null
  if (c.volume < volAvg * volMult) return null

  const springSweep = c.low < rangeLow * (1 - sweepPct)
  const springRecover = c.close > rangeLow
  if (springSweep && springRecover) return "LONG"

  const upthrustSweep = c.high > rangeHigh * (1 + sweepPct)
  const upthrustReject = c.close < rangeHigh
  if (upthrustSweep && upthrustReject) return "SHORT"

  return null
}
