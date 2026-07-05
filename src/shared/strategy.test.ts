import { describe, it, expect } from "vitest"
import { computeEmaVwmaSignals } from "../main/strategies/EmaVwmaCross"
import type { Candle } from "../shared/types"

function makeCandles(count: number, basePrice = 100): Candle[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: i * 60000,
    open: basePrice + Math.sin(i * 0.1) * 2,
    high: basePrice + Math.sin(i * 0.1) * 2 + 1,
    low: basePrice + Math.sin(i * 0.1) * 2 - 1,
    close: basePrice + Math.sin(i * 0.1) * 2,
    volume: 1000 + i * 10
  }))
}

describe("computeEmaVwmaSignals", () => {
  it("returns null when insufficient data", () => {
    const candles = makeCandles(50)
    expect(computeEmaVwmaSignals(candles, { emaPeriod: 100, vwmaPeriod: 20 })).toBeNull()
  })

  it("returns signal or null for sufficient data", () => {
    const candles = makeCandles(150)
    const result = computeEmaVwmaSignals(candles, {
      emaPeriod: 100,
      vwmaPeriod: 20,
      bandPct: 5
    })
    expect(result === null || result === "LONG" || result === "SHORT").toBe(true)
  })
})
