import type { BacktestTrade, Candle, StrategyParams } from "../../shared/types"
import type { SignalFn } from "../strategies/signalTypes"
import { num } from "../strategies/signalTypes"
import { resolveStrategyLeverage } from "../../shared/leverageUtils"

/** Shared backtest simulator with SL/TP, cooldown, and opposite-signal exit */
export function simulateStrategyTrades(
  candles: Candle[],
  params: StrategyParams,
  signalFn: SignalFn,
  warmupBars = 100
): BacktestTrade[] {
  const trades: BacktestTrade[] = []
  const slPct = num(params, "stopLossPct", 2) / 100
  const tpPct = num(params, "takeProfitPct", 6) / 100
  const margin = num(params, "notionalUsd", 100)
  const leverage = resolveStrategyLeverage(params)
  const notional = margin * leverage
  const cooldownBars = num(params, "cooldownBars", 0)

  let position: { side: "LONG" | "SHORT"; entry: number; time: number } | null = null
  let barsSinceTrade = cooldownBars

  for (let i = warmupBars; i < candles.length; i++) {
    const c = candles[i]
    barsSinceTrade++

    if (position) {
      const pnlPct =
        position.side === "LONG"
          ? (c.close - position.entry) / position.entry
          : (position.entry - c.close) / position.entry

      if (pnlPct <= -slPct || pnlPct >= tpPct) {
        trades.push({
          time: c.timestamp,
          side: position.side,
          entryPrice: position.entry,
          exitPrice: c.close,
          pnl: notional * pnlPct
        })
        position = null
        barsSinceTrade = 0
      }
    }

    if (barsSinceTrade < cooldownBars) continue

    const signal = signalFn(candles.slice(0, i + 1), params)
    if (!signal) continue

    if (position && position.side !== signal) {
      const pnlPct =
        position.side === "LONG"
          ? (c.close - position.entry) / position.entry
          : (position.entry - c.close) / position.entry
      trades.push({
        time: c.timestamp,
        side: position.side,
        entryPrice: position.entry,
        exitPrice: c.close,
        pnl: notional * pnlPct
      })
      position = null
      barsSinceTrade = 0
    }

    if (!position) {
      position = { side: signal, entry: c.close, time: c.timestamp }
    }
  }

  // Close open position at end
  if (position && candles.length > 0) {
    const last = candles[candles.length - 1]
    const pnlPct =
      position.side === "LONG"
        ? (last.close - position.entry) / position.entry
        : (position.entry - last.close) / position.entry
    trades.push({
      time: last.timestamp,
      side: position.side,
      entryPrice: position.entry,
      exitPrice: last.close,
      pnl: notional * pnlPct
    })
  }

  return trades
}
