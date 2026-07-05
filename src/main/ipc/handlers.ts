import { ipcMain, app } from "electron"
import type { KlineInterval } from "binance"
import { IPC } from "../../shared/ipc"
import type { BacktestSweepRequest, EnsembleMultiSweepRequest, HeatmapApplyPayload, HeatmapLabBootstrap, StrategyParamMultiSweepRequest } from "../../shared/backtestSweepTypes"
import type {
  AppSettings,
  AlgoSetupInput,
  AppWorkspace,
  BacktestRequest,
  OrderIntent,
  StrategyParams
} from "../../shared/types"
import { clearSecret, readSecret, storeSecret, hasStoredSecrets, isEncryptionAvailable } from "../secrets"
import type { BinanceService } from "../services/BinanceService"
import type { SettingsService } from "../services/SettingsService"
import { ResultsStore } from "../services/ResultsStore"
import { SetupStore } from "../services/SetupStore"
import { WorkspaceStore } from "../services/WorkspaceStore"
import { BacktestRunner } from "../engine/BacktestRunner"
import { StrategyEngine } from "../engine/StrategyEngine"
import { listStrategies } from "../strategies/registry"
import {
  getHeatmapBootstrap,
  openHeatmapLab,
  setHeatmapBootstrap
} from "../heatmapWindow"
import { broadcast } from "../broadcast"

const emptySummary = (): import("../../shared/types").AccountSummary => ({
  balance: 0,
  unrealizedPnl: 0,
  equity: 0,
  availableMargin: 0,
  marginUsagePct: 0
})

export function registerIpcHandlers(
  settings: SettingsService,
  binance: BinanceService
) {
  const results = new ResultsStore()
  const setups = new SetupStore()
  const workspace = new WorkspaceStore()
  const engine = new StrategyEngine(binance, settings, results)
  const backtest = new BacktestRunner(binance, results)

  binance.onKlineClose((symbol, candle) => {
    void engine.onCandleClose(symbol, candle)
  })

  ipcMain.handle(IPC.SETTINGS_GET, () => settings.get())
  ipcMain.handle(IPC.SETTINGS_SET, async (_e, partial: Partial<AppSettings>) => {
    settings.set(partial)
    await binance.reconnect()
    return settings.get()
  })

  ipcMain.handle(IPC.SECRETS_HAS, () => {
    const stored = settings.hasSecrets()
    const readable = hasStoredSecrets()
    return {
      apiKey: stored.apiKey,
      apiSecret: stored.apiSecret,
      readable: readable.apiKey && readable.apiSecret,
      encryptionAvailable: isEncryptionAvailable()
    }
  })
  ipcMain.handle(IPC.SECRETS_SET, async (_e, { apiKey, apiSecret }: { apiKey: string; apiSecret: string }) => {
    const ok = storeSecret("apiKey", apiKey) && storeSecret("apiSecret", apiSecret)
    if (ok) await binance.reconnect()
    return ok
  })
  ipcMain.handle(IPC.SECRETS_CLEAR, () => {
    clearSecret("apiKey")
    clearSecret("apiSecret")
    binance.reconnect()
  })

  ipcMain.handle(IPC.CONNECTION_PING, async () => binance.ping())
  ipcMain.handle(IPC.CONNECTION_STATUS, () => binance.getConnectionStatus())

  ipcMain.handle(IPC.MD_GET_CONTRACTS, () => binance.getContracts())
  ipcMain.handle(IPC.MD_GET_TICKERS, () => binance.getTickers())
  ipcMain.handle(
    IPC.MD_GET_KLINES,
    (_e, args: { symbol: string; interval: KlineInterval; limit?: number }) =>
      binance.getKlines(args.symbol, args.interval, args.limit)
  )
  ipcMain.handle(
    IPC.MD_GET_ORDERBOOK,
    (_e, args: { symbol: string; limit?: number }) =>
      binance.getOrderBook(args.symbol, args.limit)
  )
  ipcMain.handle(IPC.MD_SUBSCRIBE_SYMBOL, (_e, args: { symbol: string; interval: KlineInterval }) => {
    binance.subscribeSymbol(args.symbol, args.interval)
  })
  ipcMain.handle(IPC.MD_UNSUBSCRIBE_SYMBOL, (_e, symbol: string) => {
    binance.unsubscribeSymbol(symbol)
  })

  ipcMain.handle(IPC.ACCOUNT_GET_SUMMARY, async () => {
    if (!binance.hasCredentials()) return emptySummary()
    try {
      return await binance.getAccountSummary()
    } catch (err) {
      console.error("[account:getSummary]", err)
      return emptySummary()
    }
  })
  ipcMain.handle(IPC.ACCOUNT_GET_POSITIONS, async () => {
    if (!binance.hasCredentials()) return []
    try {
      return await binance.getPositions()
    } catch (err) {
      console.error("[account:getPositions]", err)
      return []
    }
  })

  ipcMain.handle(IPC.ORDERS_SUBMIT, async (_e, order: OrderIntent) => {
    const res = await binance.submitOrder(order)
    results.logTrade({
      id: `t-${Date.now()}`,
      time: Date.now(),
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? binance.getMarkPrice(order.symbol) ?? 0,
      source: "manual",
      note: order.type
    })
    return res
  })
  ipcMain.handle(IPC.ORDERS_CANCEL, (_e, args: { symbol: string; orderId: number }) =>
    binance.cancelOrder(args.symbol, args.orderId)
  )
  ipcMain.handle(IPC.ORDERS_GET_OPEN, () => binance.getOpenOrders())
  ipcMain.handle(IPC.ORDERS_GET_HISTORY, (_e, args?: { symbol?: string; limit?: number }) =>
    binance.getOrderHistory(args?.symbol, args?.limit)
  )

  ipcMain.handle(IPC.TRADES_LIST, () => results.listTrades())

  ipcMain.handle(IPC.STRATEGIES_LIST, () => listStrategies())

  ipcMain.handle(IPC.ENGINE_GET_STATUS, () => engine.getStatus())
  ipcMain.handle(
    IPC.ENGINE_ARM,
    async (
      _e,
      args: {
        strategyId: string
        params: StrategyParams
        symbols: string[]
        interval?: import("binance").KlineInterval
        ensemble?: import("../../shared/types").EnsembleMemberConfig[]
      }
    ) => {
      const status = await engine.arm(
        args.strategyId,
        args.params,
        args.symbols,
        args.ensemble,
        args.interval
      )
      binance.emit(IPC.EVENT_ENGINE, status)
      return status
    }
  )
  ipcMain.handle(IPC.ENGINE_DISARM, () => {
    const status = engine.disarm()
    binance.emit(IPC.EVENT_ENGINE, status)
    return status
  })
  ipcMain.handle(IPC.ENGINE_SET_STRATEGY, (_e, strategyId: string) => engine.setStrategy(strategyId))

  ipcMain.handle(IPC.BACKTEST_RUN, async (_e, req: BacktestRequest) => {
    const result = await backtest.run(req)
    binance.emit(IPC.EVENT_BACKTEST, result)
    return result
  })
  ipcMain.handle(IPC.BACKTEST_SWEEP, async (_e, req: BacktestSweepRequest) => {
    const result = await backtest.sweep(req, (done, total) => {
      binance.emit(IPC.EVENT_BACKTEST_SWEEP_PROGRESS, { done, total })
    })
    binance.emit(IPC.EVENT_BACKTEST_SWEEP, result)
    return result
  })
  ipcMain.handle(IPC.BACKTEST_LIST, () => backtest.listResults())
  ipcMain.handle(IPC.BACKTEST_SWEEP_LIST, () => backtest.listSweeps())
  ipcMain.handle(IPC.BACKTEST_GET_LATEST, () => backtest.getLatest())
  ipcMain.handle(IPC.BACKTEST_GET_LATEST_SWEEP, () => backtest.getLatestSweep())
  ipcMain.handle(IPC.BACKTEST_ENSEMBLE_MULTI_SWEEP, async (_e, req: EnsembleMultiSweepRequest) => {
    const result = await backtest.ensembleMultiSweep(req, (done, total) => {
      broadcast(IPC.EVENT_ENSEMBLE_MULTI_SWEEP_PROGRESS, { done, total })
    })
    broadcast(IPC.EVENT_ENSEMBLE_MULTI_SWEEP, result)
    return result
  })
  ipcMain.handle(
    IPC.BACKTEST_GET_LATEST_ENSEMBLE_MULTI_SWEEP,
    () => backtest.getLatestEnsembleMultiSweep()
  )
  ipcMain.handle(IPC.BACKTEST_STRATEGY_PARAM_MULTI_SWEEP, async (_e, req: StrategyParamMultiSweepRequest) => {
    const result = await backtest.strategyParamMultiSweep(req, (done, total) => {
      broadcast(IPC.EVENT_STRATEGY_PARAM_MULTI_SWEEP_PROGRESS, { done, total })
    })
    broadcast(IPC.EVENT_STRATEGY_PARAM_MULTI_SWEEP, result)
    return result
  })
  ipcMain.handle(
    IPC.BACKTEST_GET_LATEST_STRATEGY_PARAM_MULTI_SWEEP,
    () => backtest.getLatestStrategyParamMultiSweep()
  )

  ipcMain.handle(IPC.HEATMAP_SET_BOOTSTRAP, (_e, config: HeatmapLabBootstrap) => {
    setHeatmapBootstrap(config)
  })
  ipcMain.handle(IPC.HEATMAP_GET_BOOTSTRAP, () => getHeatmapBootstrap())
  ipcMain.handle(IPC.HEATMAP_OPEN_LAB, () => {
    openHeatmapLab(!app.isPackaged)
  })
  ipcMain.handle(IPC.HEATMAP_APPLY, (_e, payload: HeatmapApplyPayload) => {
    broadcast(IPC.EVENT_HEATMAP_APPLY, payload)
  })

  ipcMain.handle(IPC.SETUPS_LIST, () => ({
    recent: setups.listRecent(),
    saved: setups.listSaved()
  }))
  ipcMain.handle(IPC.SETUPS_RECORD, (_e, input: AlgoSetupInput) => setups.record(input))
  ipcMain.handle(
    IPC.SETUPS_SAVE,
    (_e, args: AlgoSetupInput & { name: string }) => setups.saveAs(args)
  )
  ipcMain.handle(IPC.SETUPS_TOUCH, (_e, id: string) => setups.touch(id))
  ipcMain.handle(IPC.SETUPS_TOGGLE_FAVORITE, (_e, id: string) => setups.toggleFavorite(id))
  ipcMain.handle(IPC.SETUPS_REMOVE, (_e, id: string) => setups.remove(id))

  ipcMain.handle(IPC.WORKSPACE_GET, () => workspace.get())
  ipcMain.handle(IPC.WORKSPACE_PATCH, (_e, partial: Partial<AppWorkspace>) =>
    workspace.patch(partial)
  )
}
