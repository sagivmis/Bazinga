import type { KlineInterval } from "binance"
import type {
  BacktestRequest,
  BacktestResult,
  BacktestSweepCell,
  BacktestSweepResult,
  BacktestTrade,
  Candle,
  EnsembleMultiSweepCell,
  EnsembleMultiSweepResult,
  StrategyParams
} from "../../shared/types"
import type {
  BacktestSweepRequest,
  EnsembleMultiSweepRequest
} from "../../shared/backtestSweepTypes"
import {
  applyWeightCombination,
  buildWeightCombinations
} from "./ensembleSweep"
import {
  compositeScore,
  formatSweepValue,
  linspace
} from "../../shared/sweepUtils"
import type { BinanceService } from "../services/BinanceService"
import type { ResultsStore } from "../services/ResultsStore"
import { getSignalFn, ENSEMBLE_STRATEGY_ID } from "../strategies/registry"
import { createEnsembleSignalFn, applySweepToEnsemble, cloneEnsemble } from "../strategies/ensembleSignal"
import { isWeightParamKey } from "../../shared/ensembleUtils"
import { simulateStrategyTrades } from "./tradeSimulator"

export class BacktestRunner {
  constructor(
    private binance: BinanceService,
    private results: ResultsStore
  ) {}

  listResults() {
    return this.results.listBacktests()
  }

  getLatest() {
    return this.results.getLatestBacktest()
  }

  listSweeps() {
    return this.results.listSweeps()
  }

  getLatestSweep() {
    return this.results.getLatestSweep()
  }

  async run(req: BacktestRequest): Promise<BacktestResult> {
    const candles = await this.fetchCandles(req.symbol, req.interval, req.startTime, req.endTime)
    return this.runOnCandles(candles, req, true)
  }

  async sweep(
    req: BacktestSweepRequest,
    onProgress?: (done: number, total: number) => void
  ): Promise<BacktestSweepResult> {
    const candles = await this.fetchCandles(req.symbol, req.interval, req.startTime, req.endTime)
    const xValues = linspace(req.paramX.min, req.paramX.max, req.paramX.steps).map((v) =>
      formatSweepValue(req.paramX.key, v)
    )
    const yValues = linspace(req.paramY.min, req.paramY.max, req.paramY.steps).map((v) =>
      formatSweepValue(req.paramY.key, v)
    )

    const cells: BacktestSweepCell[] = []
    const total = xValues.length * yValues.length
    let done = 0

    for (const yValue of yValues) {
      for (const xValue of xValues) {
        let params: StrategyParams
        let ensemble = req.ensemble

        if (req.ensemble?.length) {
          const applied = applySweepToEnsemble(
            req.ensemble,
            req.baseParams,
            req.paramX.key,
            xValue,
            req.paramY.key,
            yValue
          )
          params = applied.params
          ensemble = applied.members
        } else {
          params = { ...req.baseParams }
          if (!isWeightParamKey(req.paramX.key)) params[req.paramX.key] = xValue
          if (!isWeightParamKey(req.paramY.key)) params[req.paramY.key] = yValue
        }

        const result = this.runOnCandles(
          candles,
          {
            strategyId: req.strategyId,
            symbol: req.symbol,
            interval: req.interval,
            startTime: req.startTime,
            endTime: req.endTime,
            params,
            initialBalance: req.initialBalance,
            ensemble
          },
          false
        )
        cells.push({
          xValue,
          yValue,
          params,
          ensemble: ensemble ? cloneEnsemble(ensemble) : undefined,
          metrics: result.metrics
        })
        done++
        onProgress?.(done, total)
      }
    }

    const bestCell = cells.reduce((best, cell) =>
      compositeScore(cell.metrics) > compositeScore(best.metrics) ? cell : best
    )

    const sweepResult: BacktestSweepResult = {
      id: `sw-${Date.now()}`,
      strategyId: req.strategyId,
      symbol: req.symbol,
      interval: req.interval,
      paramXKey: req.paramX.key,
      paramYKey: req.paramY.key,
      paramXLabel: req.paramX.label,
      paramYLabel: req.paramY.label,
      xValues,
      yValues,
      cells,
      bestCell,
      createdAt: Date.now(),
      totalRuns: cells.length,
      source: "sweep"
    }

    this.results.saveSweep(sweepResult)
    return sweepResult
  }

  listEnsembleMultiSweeps() {
    return this.results.listEnsembleMultiSweeps()
  }

  getLatestEnsembleMultiSweep() {
    return this.results.getLatestEnsembleMultiSweep()
  }

  async ensembleMultiSweep(
    req: EnsembleMultiSweepRequest,
    onProgress?: (done: number, total: number) => void
  ): Promise<EnsembleMultiSweepResult> {
    const candles = await this.fetchCandles(req.symbol, req.interval, req.startTime, req.endTime)
    const combinations = buildWeightCombinations(req.weightAxes)
    const cells: EnsembleMultiSweepCell[] = []
    const total = combinations.length

    for (let i = 0; i < combinations.length; i++) {
      const weights = combinations[i]
      const ensemble = applyWeightCombination(req.ensemble, weights)
      const result = this.runOnCandles(
        candles,
        {
          strategyId: ENSEMBLE_STRATEGY_ID,
          symbol: req.symbol,
          interval: req.interval,
          startTime: req.startTime,
          endTime: req.endTime,
          params: { ...req.baseParams },
          initialBalance: req.initialBalance,
          ensemble
        },
        false
      )
      cells.push({
        weights: { ...weights },
        ensemble: cloneEnsemble(ensemble),
        params: { ...req.baseParams },
        metrics: result.metrics
      })
      onProgress?.(i + 1, total)
    }

    const bestCell = cells.reduce((best, cell) =>
      compositeScore(cell.metrics) > compositeScore(best.metrics) ? cell : best
    )

    const sweepResult: EnsembleMultiSweepResult = {
      id: `msw-${Date.now()}`,
      strategyId: ENSEMBLE_STRATEGY_ID,
      symbol: req.symbol,
      interval: req.interval,
      weightAxes: req.weightAxes.filter((a) => a.enabled),
      cells,
      bestCell,
      createdAt: Date.now(),
      totalRuns: cells.length
    }

    this.results.saveEnsembleMultiSweep(sweepResult)
    return sweepResult
  }

  private runOnCandles(candles: Candle[], req: BacktestRequest, persist: boolean): BacktestResult {
    const trades = this.simulate(candles, req)
    const equityCurve = this.buildEquityCurve(trades, req.initialBalance)
    const metrics = this.computeMetrics(trades, equityCurve, req.initialBalance)

    const result: BacktestResult = {
      id: `bt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      strategyId: req.strategyId,
      symbol: req.symbol,
      interval: req.interval,
      params: { ...req.params },
      ensemble: req.ensemble ? cloneEnsemble(req.ensemble) : undefined,
      trades,
      equityCurve,
      metrics
    }

    if (persist) this.results.saveBacktest(result)
    return result
  }

  private async fetchCandles(
    symbol: string,
    interval: KlineInterval,
    startTime: number,
    endTime: number
  ): Promise<Candle[]> {
    const client = this.binance.getClient()
    if (!client) return []

    const all: Candle[] = []
    let cursor = startTime
    while (cursor < endTime) {
      const raw = await client.getKlines({
        symbol,
        interval,
        startTime: cursor,
        endTime,
        limit: 1000
      })
      if (!raw.length) break
      const batch = raw.map((k) => ({
        timestamp: k[0],
        open: parseFloat(k[1].toString()),
        high: parseFloat(k[2].toString()),
        low: parseFloat(k[3].toString()),
        close: parseFloat(k[4].toString()),
        volume: parseFloat(k[5].toString())
      }))
      all.push(...batch)
      cursor = batch[batch.length - 1].timestamp + 1
      if (raw.length < 1000) break
    }
    return all
  }

  private simulate(candles: Candle[], req: BacktestRequest): BacktestTrade[] {
    const signalFn =
      req.strategyId === ENSEMBLE_STRATEGY_ID && req.ensemble?.length
        ? createEnsembleSignalFn(req.ensemble)
        : getSignalFn(req.strategyId)
    return simulateStrategyTrades(candles, req.params, signalFn, 100)
  }

  private buildEquityCurve(trades: BacktestTrade[], initial: number) {
    let equity = initial
    const curve: { time: number; equity: number }[] = [{ time: 0, equity }]
    for (const t of trades) {
      equity += t.pnl
      curve.push({ time: t.time, equity })
    }
    return curve
  }

  private computeMetrics(
    trades: BacktestTrade[],
    equityCurve: { time: number; equity: number }[],
    initial: number
  ) {
    const wins = trades.filter((t) => t.pnl > 0)
    const losses = trades.filter((t) => t.pnl <= 0)
    const totalReturn = ((equityCurve.at(-1)?.equity ?? initial) - initial) / initial * 100
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0
    const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

    let peak = initial
    let maxDrawdown = 0
    for (const point of equityCurve) {
      peak = Math.max(peak, point.equity)
      const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0
      maxDrawdown = Math.max(maxDrawdown, dd)
    }

    const returns = trades.map((t) => t.pnl / initial)
    const avg = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
    const variance = returns.length
      ? returns.reduce((s, r) => s + (r - avg) ** 2, 0) / returns.length
      : 0
    const sharpeRatio = variance > 0 ? (avg / Math.sqrt(variance)) * Math.sqrt(252) : 0

    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)

    return {
      totalReturn,
      winRate,
      sharpeRatio,
      maxDrawdown,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      totalTrades: trades.length,
      avgPnlPerTrade: trades.length ? totalPnl / trades.length : 0
    }
  }
}
