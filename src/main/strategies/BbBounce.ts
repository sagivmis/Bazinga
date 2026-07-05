import { bb } from "indicatorts"
import type { Strategy } from "../engine/Strategy"
import { num, type SignalFn } from "./signalTypes"

const scalpRisk = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 0.8, min: 0.2, max: 5 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 1.2, min: 0.3, max: 10 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 1, min: 0, max: 20 }
]

export const bbBounceStrategy: Strategy = {
  id: "bb-bounce",
  name: "Bollinger Bounce",
  description:
    "Mean-reversion when price pierces a band then closes back inside. High trade frequency in ranging markets.",
  defaultParams: {
    bbPeriod: 12,
    stopLossPct: 0.8,
    takeProfitPct: 1.2,
    notionalUsd: 100,
    cooldownBars: 1
  },
  paramSchema: [
    { key: "bbPeriod", label: "BB Period", type: "number", default: 12, min: 8, max: 30 },
    ...scalpRisk
  ],
  async onCandleClose() {}
}

/** Long on lower-band rejection; short on upper-band rejection */
export const computeBbBounceSignal: SignalFn = (candles, params) => {
  const period = num(params, "bbPeriod", 12)
  if (candles.length < period + 5) return null

  const closes = candles.map((c) => c.close)
  const bands = bb(closes, { period })
  const idx = candles.length - 2
  const prev = idx - 1

  const lowPrev = bands.lower[prev]
  const lowNow = bands.lower[idx]
  const upPrev = bands.upper[prev]
  const upNow = bands.upper[idx]
  if ([lowPrev, lowNow, upPrev, upNow].some((v) => v === undefined || Number.isNaN(v))) return null

  if (closes[prev] <= lowPrev && closes[idx] > lowNow) return "LONG"
  if (closes[prev] >= upPrev && closes[idx] < upNow) return "SHORT"
  return null
}
