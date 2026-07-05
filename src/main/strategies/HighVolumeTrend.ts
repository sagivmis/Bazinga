import { ema } from "indicatorts"
import type { Strategy } from "../engine/Strategy"
import { avgVolume, num, type SignalFn } from "./signalTypes"

const commonParams = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 2, min: 0.5, max: 20 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 7, min: 2, max: 50 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 30, min: 0, max: 200 }
]

export const highVolumeTrendStrategy: Strategy = {
  id: "high-volume-trend",
  name: "High Volume Trend Pullback",
  description:
    "Trade with the EMA trend after a low-volume pullback, entering on a high-volume reversal candle. Designed for quality over quantity.",
  defaultParams: {
    trendEmaPeriod: 100,
    pullbackLookback: 5,
    volumePeriod: 20,
    entryVolumeMultiplier: 2.0,
    pullbackVolumeMax: 0.7,
    stopLossPct: 2,
    takeProfitPct: 7,
    notionalUsd: 100,
    cooldownBars: 30
  },
  paramSchema: [
    { key: "trendEmaPeriod", label: "Trend EMA", type: "number", default: 100, min: 50, max: 300 },
    { key: "pullbackLookback", label: "Pullback Bars", type: "number", default: 5, min: 2, max: 20 },
    { key: "volumePeriod", label: "Volume Avg Period", type: "number", default: 20, min: 5, max: 60 },
    { key: "entryVolumeMultiplier", label: "Entry Volume × Avg", type: "number", default: 2.0, min: 1.3, max: 4 },
    { key: "pullbackVolumeMax", label: "Max Pullback Vol Ratio", type: "number", default: 0.7, min: 0.3, max: 1 },
    ...commonParams
  ],
  async onCandleClose() {}
}

export const computeHighVolumeTrendSignal: SignalFn = (candles, params) => {
  const emaPeriod = num(params, "trendEmaPeriod", 100)
  const pullbackBars = num(params, "pullbackLookback", 5)
  const volPeriod = num(params, "volumePeriod", 20)
  const entryMult = num(params, "entryVolumeMultiplier", 2)
  const pullbackMax = num(params, "pullbackVolumeMax", 0.7)

  if (candles.length < emaPeriod + pullbackBars + volPeriod + 2) return null

  const idx = candles.length - 2
  const c = candles[idx]
  const closes = candles.slice(0, idx + 1).map((x) => x.close)
  const emas = ema(closes, { period: emaPeriod })
  const trendEma = emas[emas.length - 1]
  const volAvg = avgVolume(candles, volPeriod, idx)

  if (volAvg <= 0) return null

  const uptrend = c.close > trendEma
  const downtrend = c.close < trendEma

  // Pullback: prior bars mostly on weak volume and against trend
  const prior = candles.slice(idx - pullbackBars, idx)
  const weakVolume = prior.every((bar) => bar.volume <= volAvg * pullbackMax)

  const strongEntry = c.volume >= volAvg * entryMult
  const bullishCandle = c.close > c.open
  const bearishCandle = c.close < c.open

  if (uptrend && weakVolume && strongEntry && bullishCandle) return "LONG"
  if (downtrend && weakVolume && strongEntry && bearishCandle) return "SHORT"
  return null
}
