import type { Strategy } from "../engine/Strategy"
import { avgVolume, num, type SignalFn } from "./signalTypes"
import type { Candle } from "../../shared/types"

const commonParams = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 2, min: 0.5, max: 20 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 10, min: 3, max: 50 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 48, min: 0, max: 200 }
]

export const wyckoffBreakoutStrategy: Strategy = {
  id: "wyckoff-breakout",
  name: "Wyckoff Range Breakout",
  description:
    "After tight consolidation (accumulation/distribution), enter on markup/markdown breakout with confirming volume.",
  defaultParams: {
    rangePeriod: 60,
    maxRangePct: 4,
    volumePeriod: 20,
    volumeMultiplier: 2.2,
    stopLossPct: 2,
    takeProfitPct: 10,
    notionalUsd: 100,
    cooldownBars: 48
  },
  paramSchema: [
    { key: "rangePeriod", label: "Consolidation Bars", type: "number", default: 60, min: 30, max: 150 },
    { key: "maxRangePct", label: "Max Range Width %", type: "number", default: 4, min: 1, max: 15 },
    { key: "volumePeriod", label: "Volume Avg Period", type: "number", default: 20, min: 5, max: 60 },
    { key: "volumeMultiplier", label: "Breakout Volume × Avg", type: "number", default: 2.2, min: 1.5, max: 5 },
    ...commonParams
  ],
  async onCandleClose() {}
}

function rangeStats(candles: Candle[], period: number) {
  const slice = candles.slice(-period - 1, -1) // completed bars before signal bar
  if (slice.length < period) return null
  const high = Math.max(...slice.map((c) => c.high))
  const low = Math.min(...slice.map((c) => c.low))
  const mid = (high + low) / 2
  const widthPct = mid > 0 ? ((high - low) / mid) * 100 : 100
  return { high, low, widthPct }
}

export const computeWyckoffBreakoutSignal: SignalFn = (candles, params) => {
  const rangePeriod = num(params, "rangePeriod", 60)
  const maxRangePct = num(params, "maxRangePct", 4)
  const volPeriod = num(params, "volumePeriod", 20)
  const volMult = num(params, "volumeMultiplier", 2.2)

  if (candles.length < rangePeriod + volPeriod + 2) return null

  const idx = candles.length - 2
  const c = candles[idx]
  const stats = rangeStats(candles.slice(0, idx + 1), rangePeriod)
  if (!stats || stats.widthPct > maxRangePct) return null

  const volAvg = avgVolume(candles, volPeriod, idx)
  if (volAvg <= 0 || c.volume < volAvg * volMult) return null

  if (c.close > stats.high) return "LONG"
  if (c.close < stats.low) return "SHORT"
  return null
}
