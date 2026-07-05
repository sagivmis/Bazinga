import { rsi } from "indicatorts"
import type { Strategy } from "../engine/Strategy"
import { num, type SignalFn } from "./signalTypes"

const scalpRisk = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 0.6, min: 0.2, max: 5 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 1.0, min: 0.3, max: 10 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 0, min: 0, max: 20 }
]

export const rsiScalperStrategy: Strategy = {
  id: "rsi-scalper",
  name: "RSI Scalper",
  description:
    "Fast mean-reversion on RSI extremes. Many trades per day on 15m–1h with tight SL/TP and zero cooldown.",
  defaultParams: {
    rsiPeriod: 7,
    oversold: 38,
    overbought: 62,
    stopLossPct: 0.6,
    takeProfitPct: 1.0,
    notionalUsd: 100,
    cooldownBars: 0
  },
  paramSchema: [
    { key: "rsiPeriod", label: "RSI Period", type: "number", default: 7, min: 3, max: 21 },
    { key: "oversold", label: "Oversold", type: "number", default: 38, min: 20, max: 45 },
    { key: "overbought", label: "Overbought", type: "number", default: 62, min: 55, max: 80 },
    ...scalpRisk
  ],
  async onCandleClose() {}
}

/** Enter long/short when RSI crosses back from extreme zones */
export const computeRsiScalperSignal: SignalFn = (candles, params) => {
  const period = num(params, "rsiPeriod", 7)
  const oversold = num(params, "oversold", 38)
  const overbought = num(params, "overbought", 62)

  if (candles.length < period + 5) return null

  const closes = candles.map((c) => c.close)
  const rsis = rsi(closes, { period })
  const idx = candles.length - 2
  const prev = idx - 1
  const r = rsis[idx]
  const rPrev = rsis[prev]
  if (r === undefined || rPrev === undefined || Number.isNaN(r)) return null

  if (rPrev <= oversold && r > oversold) return "LONG"
  if (rPrev >= overbought && r < overbought) return "SHORT"
  if (r <= oversold) return "LONG"
  if (r >= overbought) return "SHORT"
  return null
}
