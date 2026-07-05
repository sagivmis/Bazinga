import { ema, vwma } from "indicatorts"
import type { Strategy } from "../engine/Strategy"
import type { Candle, OrderIntent } from "../../shared/types"

export const emaVwmaCrossStrategy: Strategy = {
  id: "ema-vwma-cross",
  name: "EMA / VWMA Crossover",
  description:
    "Long when VWMA crosses above EMA near price; short on crossunder. Includes SL/TP and position sizing.",
  defaultParams: {
    emaPeriod: 100,
    vwmaPeriod: 20,
    bandPct: 0.5,
    riskPct: 1,
    stopLossPct: 1.5,
    takeProfitPct: 3,
    notionalUsd: 100,
    cooldownBars: 12
  },
  paramSchema: [
    { key: "emaPeriod", label: "EMA Period", type: "number", default: 100, min: 5, max: 500 },
    { key: "vwmaPeriod", label: "VWMA Period", type: "number", default: 20, min: 5, max: 200 },
    { key: "bandPct", label: "Price Band %", type: "number", default: 0.5, min: 0.1, max: 5 },
    { key: "riskPct", label: "Risk % per trade", type: "number", default: 1, min: 0.1, max: 10 },
    { key: "stopLossPct", label: "Stop Loss %", type: "number", default: 1.5, min: 0.1, max: 20 },
    { key: "takeProfitPct", label: "Take Profit %", type: "number", default: 3, min: 0.1, max: 50 },
    { key: "notionalUsd", label: "Notional USD", type: "number", default: 100, min: 10, max: 10000 },
    { key: "cooldownBars", label: "Cooldown Bars", type: "number", default: 12, min: 0, max: 200 }
  ],

  async onCandleClose() {
    // Live execution is handled by StrategyEngine using computeEmaVwmaSignals
  }
}

/** Pure signal logic used by both live engine and backtest */
export function computeEmaVwmaSignals(
  candles: Candle[],
  params: Record<string, number | string | boolean>
) {
  const emaPeriod = Number(params.emaPeriod ?? 100)
  const vwmaPeriod = Number(params.vwmaPeriod ?? 20)
  const bandPct = Number(params.bandPct ?? 0.5)

  if (candles.length < Math.max(emaPeriod, vwmaPeriod) + 3) return null

  const closes = candles.map((c) => c.close)
  const volumes = candles.map((c) => c.volume)
  const emas = ema(closes, { period: emaPeriod })
  const vwmas = vwma(closes, volumes, { period: vwmaPeriod })

  const len = candles.length
  const last = len - 2
  const prev = len - 3
  if (last < 0 || prev < 0) return null

  const close = closes[last]
  const crossover = vwmas[last] > emas[last] && vwmas[prev] <= emas[prev]
  const crossunder = vwmas[last] < emas[last] && vwmas[prev] >= emas[prev]
  const nearBand = (Math.abs(close - vwmas[last]) / close) * 100 < bandPct

  if (crossover && nearBand) return "LONG" as const
  if (crossunder && nearBand) return "SHORT" as const
  return null
}

export function buildMarketOrder(
  symbol: string,
  side: "BUY" | "SELL",
  notionalUsd: number,
  price: number
): OrderIntent {
  return {
    symbol,
    side,
    type: "MARKET",
    quantity: parseFloat((notionalUsd / price).toFixed(4))
  }
}
