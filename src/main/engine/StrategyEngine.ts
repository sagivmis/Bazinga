import type { Strategy } from "./Strategy"
import type { StrategyParams, EngineStatus, Candle, EnsembleMemberConfig } from "../../shared/types"
import type { BinanceService } from "../services/BinanceService"
import type { SettingsService } from "../services/SettingsService"
import type { ResultsStore } from "../services/ResultsStore"
import { getStrategy, getStrategySignal, ENSEMBLE_STRATEGY_ID } from "../strategies/registry"
import { computeEnsembleSignal } from "../strategies/ensembleSignal"
import { num } from "../strategies/signalTypes"
import {
  quantityFromMargin,
  resolveStrategyLeverage
} from "../../shared/leverageUtils"

export class StrategyEngine {
  private armed = false
  private strategyId: string | null = null
  private params: StrategyParams = {}
  private symbols: string[] = []
  private strategy: Strategy | null = null
  private ensemble: EnsembleMemberConfig[] = []
  private candleHistory: Record<string, Candle[]> = {}
  private barsSinceTrade: Record<string, number> = {}

  constructor(
    private binance: BinanceService,
    private settings: SettingsService,
    private results: ResultsStore
  ) {}

  getStatus(): EngineStatus {
    return {
      armed: this.armed,
      strategyId: this.strategyId,
      runningSymbols: this.symbols
    }
  }

  setStrategy(strategyId: string) {
    this.strategyId = strategyId
    this.strategy = getStrategy(strategyId)
  }

  async arm(
    strategyId: string,
    params: StrategyParams,
    symbols: string[],
    ensemble?: EnsembleMemberConfig[]
  ) {
    this.strategyId = strategyId
    this.params = params
    this.symbols = symbols
    this.ensemble = ensemble ?? []
    this.strategy = getStrategy(strategyId)
    this.armed = true
    this.candleHistory = {}
    this.barsSinceTrade = {}

    const interval = this.settings.get().defaultInterval
    for (const symbol of symbols) {
      this.binance.subscribeSymbol(symbol, interval)
      const candles = await this.binance.getKlines(symbol, interval, 200)
      this.candleHistory[symbol] = candles
    }
    return this.getStatus()
  }

  disarm() {
    this.armed = false
    return this.getStatus()
  }

  private logStrategyTrade(
    symbol: string,
    side: "BUY" | "SELL",
    quantity: number,
    price: number
  ) {
    this.results.logTrade({
      id: `s-${Date.now()}`,
      time: Date.now(),
      symbol,
      side,
      quantity,
      price,
      source: "strategy",
      note: this.strategyId ?? undefined
    })
  }

  async onCandleClose(symbol: string, candle: Candle) {
    if (!this.armed || !this.strategy || !this.symbols.includes(symbol)) return

    const history = this.candleHistory[symbol] ?? []
    const existing = history.findIndex((c) => c.timestamp === candle.timestamp)
    if (existing >= 0) history[existing] = candle
    else history.push(candle)
    if (history.length > 500) history.shift()
    this.candleHistory[symbol] = history

    const cooldownBars = num(this.params, "cooldownBars", 0)
    this.barsSinceTrade[symbol] = (this.barsSinceTrade[symbol] ?? cooldownBars) + 1
    if (this.barsSinceTrade[symbol] < cooldownBars) return

    const signal =
      this.strategyId === ENSEMBLE_STRATEGY_ID
        ? computeEnsembleSignal(history, this.ensemble, this.params)
        : this.strategyId
          ? getStrategySignal(this.strategyId, history, this.params)
          : null
    if (!signal) return

    const positions = await this.binance.getPositions()
    const position = positions.find((p) => p.symbol === symbol) ?? null
    const price = this.binance.getMarkPrice(symbol) ?? candle.close
    const margin = num(this.params, "notionalUsd", 100)
    const leverage = resolveStrategyLeverage(this.params)

    if (position) {
      const isSame =
        (signal === "LONG" && position.side === "LONG") ||
        (signal === "SHORT" && position.side === "SHORT")
      if (isSame) return

      const closeSide = position.side === "LONG" ? "SELL" : "BUY"
      await this.binance.submitOrder({
        symbol,
        side: closeSide,
        type: "MARKET",
        quantity: position.size
      })
      this.logStrategyTrade(symbol, closeSide, position.size, price)
      this.barsSinceTrade[symbol] = 0
    }

    const openSide = signal === "LONG" ? "BUY" : "SELL"
    try {
      await this.binance.setSymbolLeverage(symbol, leverage)
    } catch (err) {
      console.error("[StrategyEngine] setLeverage failed:", err)
    }
    const qty = quantityFromMargin(margin, leverage, price)
    await this.binance.submitOrder({
      symbol,
      side: openSide,
      type: "MARKET",
      quantity: qty,
      leverage
    })
    this.logStrategyTrade(symbol, openSide, qty, price)
    this.barsSinceTrade[symbol] = 0
  }
}
