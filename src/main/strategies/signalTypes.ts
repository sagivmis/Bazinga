import type { Candle, StrategyParams } from "../../shared/types"

export type TradeSignal = "LONG" | "SHORT"

export type SignalFn = (candles: Candle[], params: StrategyParams) => TradeSignal | null

export const num = (params: StrategyParams, key: string, fallback: number) =>
  Number(params[key] ?? fallback)

export function avgVolume(candles: Candle[], period: number, endIdx?: number) {
  const end = endIdx ?? candles.length - 1
  const start = Math.max(0, end - period + 1)
  const slice = candles.slice(start, end + 1)
  if (!slice.length) return 0
  return slice.reduce((s, c) => s + c.volume, 0) / slice.length
}

export function highestHigh(candles: Candle[], period: number, excludeLast = 1) {
  const end = candles.length - excludeLast
  const start = Math.max(0, end - period)
  return Math.max(...candles.slice(start, end).map((c) => c.high), 0)
}

export function lowestLow(candles: Candle[], period: number, excludeLast = 1) {
  const end = candles.length - excludeLast
  const start = Math.max(0, end - period)
  const lows = candles.slice(start, end).map((c) => c.low)
  return lows.length ? Math.min(...lows) : 0
}
