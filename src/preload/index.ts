import { contextBridge, ipcRenderer } from "electron"
import { IPC } from "../shared/ipc"
import type {
  AppSettings,
  AlgoSetup,
  AlgoSetupInput,
  BacktestRequest,
  BacktestResult,
  BacktestSweepResult,
  EnsembleMultiSweepResult,
  StrategyParamMultiSweepResult,
  OrderIntent,
  StrategyParams
} from "../shared/types"
import type { BacktestSweepRequest, EnsembleMultiSweepRequest, HeatmapApplyPayload, HeatmapLabBootstrap, StrategyParamMultiSweepRequest } from "../shared/backtestSweepTypes"
import type { KlineInterval } from "binance"

const api = {
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
    set: (partial: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, partial)
  },
  secrets: {
    has: (): Promise<{ apiKey: boolean; apiSecret: boolean; readable?: boolean; encryptionAvailable?: boolean }> =>
      ipcRenderer.invoke(IPC.SECRETS_HAS),
    set: (keys: { apiKey: string; apiSecret: string }): Promise<boolean> =>
      ipcRenderer.invoke(IPC.SECRETS_SET, keys),
    clear: (): Promise<void> => ipcRenderer.invoke(IPC.SECRETS_CLEAR)
  },
  connection: {
    ping: (): Promise<number> => ipcRenderer.invoke(IPC.CONNECTION_PING),
    status: () => ipcRenderer.invoke(IPC.CONNECTION_STATUS)
  },
  market: {
    getContracts: (): Promise<string[]> => ipcRenderer.invoke(IPC.MD_GET_CONTRACTS),
    getTickers: () => ipcRenderer.invoke(IPC.MD_GET_TICKERS),
    getKlines: (args: { symbol: string; interval: KlineInterval; limit?: number }) =>
      ipcRenderer.invoke(IPC.MD_GET_KLINES, args),
    getOrderBook: (args: { symbol: string; limit?: number }) =>
      ipcRenderer.invoke(IPC.MD_GET_ORDERBOOK, args),
    subscribeSymbol: (args: { symbol: string; interval: KlineInterval }) =>
      ipcRenderer.invoke(IPC.MD_SUBSCRIBE_SYMBOL, args),
    unsubscribeSymbol: (symbol: string) =>
      ipcRenderer.invoke(IPC.MD_UNSUBSCRIBE_SYMBOL, symbol)
  },
  account: {
    getSummary: () => ipcRenderer.invoke(IPC.ACCOUNT_GET_SUMMARY),
    getPositions: () => ipcRenderer.invoke(IPC.ACCOUNT_GET_POSITIONS)
  },
  orders: {
    submit: (order: OrderIntent) => ipcRenderer.invoke(IPC.ORDERS_SUBMIT, order),
    cancel: (args: { symbol: string; orderId: number }) =>
      ipcRenderer.invoke(IPC.ORDERS_CANCEL, args),
    getOpen: () => ipcRenderer.invoke(IPC.ORDERS_GET_OPEN),
    getHistory: (args?: { symbol?: string; limit?: number }) =>
      ipcRenderer.invoke(IPC.ORDERS_GET_HISTORY, args)
  },
  trades: {
    list: () => ipcRenderer.invoke(IPC.TRADES_LIST)
  },
  strategies: {
    list: () => ipcRenderer.invoke(IPC.STRATEGIES_LIST)
  },
  engine: {
    getStatus: () => ipcRenderer.invoke(IPC.ENGINE_GET_STATUS),
    arm: (args: {
      strategyId: string
      params: StrategyParams
      symbols: string[]
      interval?: KlineInterval
      ensemble?: import("../shared/types").EnsembleMemberConfig[]
    }) => ipcRenderer.invoke(IPC.ENGINE_ARM, args),
    disarm: () => ipcRenderer.invoke(IPC.ENGINE_DISARM),
    setStrategy: (strategyId: string) =>
      ipcRenderer.invoke(IPC.ENGINE_SET_STRATEGY, strategyId)
  },
  backtest: {
    run: (req: BacktestRequest): Promise<BacktestResult> =>
      ipcRenderer.invoke(IPC.BACKTEST_RUN, req),
    sweep: (req: BacktestSweepRequest): Promise<BacktestSweepResult> =>
      ipcRenderer.invoke(IPC.BACKTEST_SWEEP, req),
    list: (): Promise<BacktestResult[]> => ipcRenderer.invoke(IPC.BACKTEST_LIST),
    listSweeps: (): Promise<BacktestSweepResult[]> =>
      ipcRenderer.invoke(IPC.BACKTEST_SWEEP_LIST),
    getLatest: (): Promise<BacktestResult | null> =>
      ipcRenderer.invoke(IPC.BACKTEST_GET_LATEST),
    getLatestSweep: (): Promise<BacktestSweepResult | null> =>
      ipcRenderer.invoke(IPC.BACKTEST_GET_LATEST_SWEEP),
    ensembleMultiSweep: (req: EnsembleMultiSweepRequest): Promise<EnsembleMultiSweepResult> =>
      ipcRenderer.invoke(IPC.BACKTEST_ENSEMBLE_MULTI_SWEEP, req),
    getLatestEnsembleMultiSweep: (): Promise<EnsembleMultiSweepResult | null> =>
      ipcRenderer.invoke(IPC.BACKTEST_GET_LATEST_ENSEMBLE_MULTI_SWEEP),
    strategyParamMultiSweep: (req: StrategyParamMultiSweepRequest): Promise<StrategyParamMultiSweepResult> =>
      ipcRenderer.invoke(IPC.BACKTEST_STRATEGY_PARAM_MULTI_SWEEP, req),
    getLatestStrategyParamMultiSweep: (): Promise<StrategyParamMultiSweepResult | null> =>
      ipcRenderer.invoke(IPC.BACKTEST_GET_LATEST_STRATEGY_PARAM_MULTI_SWEEP)
  },
  heatmap: {
    setBootstrap: (config: HeatmapLabBootstrap): Promise<void> =>
      ipcRenderer.invoke(IPC.HEATMAP_SET_BOOTSTRAP, config),
    getBootstrap: (): Promise<HeatmapLabBootstrap | null> =>
      ipcRenderer.invoke(IPC.HEATMAP_GET_BOOTSTRAP),
    openLab: (): Promise<void> => ipcRenderer.invoke(IPC.HEATMAP_OPEN_LAB),
    apply: (payload: HeatmapApplyPayload): Promise<void> =>
      ipcRenderer.invoke(IPC.HEATMAP_APPLY, payload)
  },
  setups: {
    list: (): Promise<{ recent: AlgoSetup[]; saved: AlgoSetup[] }> =>
      ipcRenderer.invoke(IPC.SETUPS_LIST),
    record: (input: AlgoSetupInput): Promise<AlgoSetup> =>
      ipcRenderer.invoke(IPC.SETUPS_RECORD, input),
    save: (args: AlgoSetupInput & { name: string }): Promise<AlgoSetup> =>
      ipcRenderer.invoke(IPC.SETUPS_SAVE, args),
    touch: (id: string): Promise<AlgoSetup | null> =>
      ipcRenderer.invoke(IPC.SETUPS_TOUCH, id),
    toggleFavorite: (id: string): Promise<AlgoSetup | null> =>
      ipcRenderer.invoke(IPC.SETUPS_TOGGLE_FAVORITE, id),
    remove: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.SETUPS_REMOVE, id)
  },
  workspace: {
    get: (): Promise<import("../shared/types").AppWorkspace> =>
      ipcRenderer.invoke(IPC.WORKSPACE_GET),
    patch: (partial: Partial<import("../shared/types").AppWorkspace>) =>
      ipcRenderer.invoke(IPC.WORKSPACE_PATCH, partial)
  },
  on: (channel: string, listener: (_: unknown, data: unknown) => void) => {
    const allowed = Object.values(IPC).filter((c) => c.startsWith("event:"))
    if (!allowed.includes(channel as (typeof allowed)[number])) return () => {}
    const wrapper = (_: unknown, data: unknown) => listener(_, data)
    ipcRenderer.on(channel, wrapper)
    return () => ipcRenderer.removeListener(channel, wrapper)
  }
}

contextBridge.exposeInMainWorld("api", api)

export type BazingaApi = typeof api
