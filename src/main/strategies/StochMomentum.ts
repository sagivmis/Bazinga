import { stoch } from "indicatorts"
import type { Strategy } from "../engine/Strategy"
import { num, type SignalFn } from "./signalTypes"

const scalpRisk = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 0.7, min: 0.2, max: 5 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 1.1, min: 0.3, max: 10 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 0, min: 0, max: 20 }
]

export const stochMomentumStrategy: Strategy = {
  id: "stoch-momentum",
  name: "Stochastic Momentum",
  description:
    "Fast stochastic %K/%D crosses in overbought/oversold zones. Designed for many round-trips per session.",
  defaultParams: {
    kPeriod: 5,
    dPeriod: 3,
    oversold: 25,
    overbought: 75,
    stopLossPct: 0.7,
    takeProfitPct: 1.1,
    notionalUsd: 100,
    cooldownBars: 0
  },
  paramSchema: [
    { key: "kPeriod", label: "%K Period", type: "number", default: 5, min: 3, max: 14 },
    { key: "dPeriod", label: "%D Period", type: "number", default: 3, min: 2, max: 7 },
    { key: "oversold", label: "Oversold", type: "number", default: 25, min: 10, max: 35 },
    { key: "overbought", label: "Overbought", type: "number", default: 75, min: 65, max: 90 },
    ...scalpRisk
  ],
  async onCandleClose() {}
}

export const computeStochMomentumSignal: SignalFn = (candles, params) => {
  const kPeriod = num(params, "kPeriod", 5)
  const dPeriod = num(params, "dPeriod", 3)
  const oversold = num(params, "oversold", 25)
  const overbought = num(params, "overbought", 75)

  if (candles.length < kPeriod + dPeriod + 5) return null

  const highs = candles.map((c) => c.high)
  const lows = candles.map((c) => c.low)
  const closes = candles.map((c) => c.close)
  const { k, d } = stoch(highs, lows, closes, { kPeriod, dPeriod })

  const idx = candles.length - 2
  const prev = idx - 1
  const kNow = k[idx]
  const kPrev = k[prev]
  const dNow = d[idx]
  const dPrev = d[prev]
  if ([kNow, kPrev, dNow, dPrev].some((v) => v === undefined || Number.isNaN(v))) return null

  if (kPrev <= dPrev && kNow > dNow && kNow < oversold + 10) return "LONG"
  if (kPrev >= dPrev && kNow < dNow && kNow > overbought - 10) return "SHORT"
  if (kNow < oversold) return "LONG"
  if (kNow > overbought) return "SHORT"
  return null
}
