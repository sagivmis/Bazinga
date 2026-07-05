import type { Strategy } from "../engine/Strategy"
import { ENSEMBLE_STRATEGY_ID } from "./ensembleSignal"

const commonParams = [
  { key: "stopLossPct", label: "Stop Loss %", type: "number" as const, default: 2, min: 0.5, max: 20 },
  { key: "takeProfitPct", label: "Take Profit %", type: "number" as const, default: 8, min: 2, max: 50 },
  { key: "notionalUsd", label: "Notional USD", type: "number" as const, default: 100, min: 10, max: 10000 },
  { key: "cooldownBars", label: "Cooldown Bars", type: "number" as const, default: 36, min: 0, max: 200 }
]

export const strategyEnsembleMeta: Strategy = {
  id: ENSEMBLE_STRATEGY_ID,
  name: "Weighted Ensemble",
  description:
    "Combine multiple strategies with weights. Each strategy votes LONG/SHORT; weighted score must exceed the threshold to trade.",
  defaultParams: {
    ensembleThreshold: 50,
    stopLossPct: 2,
    takeProfitPct: 8,
    notionalUsd: 100,
    cooldownBars: 36
  },
  paramSchema: [
    {
      key: "ensembleThreshold",
      label: "Signal Threshold %",
      type: "number",
      default: 50,
      min: 30,
      max: 90
    },
    ...commonParams
  ],
  async onCandleClose() {}
}
