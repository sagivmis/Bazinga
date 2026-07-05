import type { Strategy } from "../engine/Strategy"
import type { Candle, StrategyParams } from "../../shared/types"
import { avgVolume, highestHigh, lowestLow, num, type SignalFn } from "./signalTypes"

const commonParams = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 2, min: 0.5, max: 20 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 6, min: 1, max: 50 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 24, min: 0, max: 200 }
]

export const volumeBreakoutStrategy: Strategy = {
  id: "volume-breakout",
  name: "Volume Breakout",
  description:
    "Donchian channel breakout confirmed by volume spike. Fewer trades via long lookback and high volume threshold.",
  defaultParams: {
    channelPeriod: 55,
    volumePeriod: 20,
    volumeMultiplier: 2.0,
    stopLossPct: 2,
    takeProfitPct: 6,
    notionalUsd: 100,
    cooldownBars: 24
  },
  paramSchema: [
    { key: "channelPeriod", label: "Channel Period", type: "number", default: 55, min: 20, max: 200 },
    { key: "volumePeriod", label: "Volume Avg Period", type: "number", default: 20, min: 5, max: 100 },
    { key: "volumeMultiplier", label: "Min Volume × Avg", type: "number", default: 2.0, min: 1.2, max: 5 },
    ...commonParams
  ],
  async onCandleClose() {}
}

/** Break above N-bar high (or below N-bar low) on elevated volume */
export const computeVolumeBreakoutSignal: SignalFn = (candles, params) => {
  const channel = num(params, "channelPeriod", 55)
  const volPeriod = num(params, "volumePeriod", 20)
  const volMult = num(params, "volumeMultiplier", 2)

  if (candles.length < channel + volPeriod + 2) return null

  const idx = candles.length - 2 // last completed candle
  const c = candles[idx]
  const prevHigh = highestHigh(candles.slice(0, idx + 1), channel, 1)
  const prevLow = lowestLow(candles.slice(0, idx + 1), channel, 1)
  const volAvg = avgVolume(candles, volPeriod, idx)

  if (volAvg <= 0) return null
  const highVol = c.volume >= volAvg * volMult

  if (c.close > prevHigh && highVol) return "LONG"
  if (c.close < prevLow && highVol) return "SHORT"
  return null
}
