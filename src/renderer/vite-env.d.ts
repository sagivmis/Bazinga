import type {
  AppSettings,
  AlgoSetup,
  AlgoSetupInput,
  AppWorkspace,
  BacktestRequest,
  BacktestResult,
  OrderIntent,
  StrategyParams
} from "../shared/types"
import type { KlineInterval } from "binance"

export interface BazingaApi {
  settings: {
    get: () => Promise<AppSettings>
    set: (partial: Partial<AppSettings>) => Promise<AppSettings>
  }
  secrets: {
    has: () => Promise<{ apiKey: boolean; apiSecret: boolean }>
    set: (keys: { apiKey: string; apiSecret: string }) => Promise<boolean>
    clear: () => Promise<void>
  }
  connection: {
    ping: () => Promise<number>
    status: () => Promise<import("../shared/types").ConnectionStatus>
  }
  market: {
    getContracts: () => Promise<string[]>
    getTickers: () => Promise<import("../shared/types").MarketTicker[]>
    getKlines: (args: { symbol: string; interval: KlineInterval; limit?: number }) => Promise<import("../shared/types").Candle[]>
    getOrderBook: (args: { symbol: string; limit?: number }) => Promise<import("../shared/types").OrderBookSnapshot>
    subscribeSymbol: (args: { symbol: string; interval: KlineInterval }) => Promise<void>
    unsubscribeSymbol: (symbol: string) => Promise<void>
  }
  account: {
    getSummary: () => Promise<import("../shared/types").AccountSummary>
    getPositions: () => Promise<import("../shared/types").PositionView[]>
  }
  orders: {
    submit: (order: OrderIntent) => Promise<unknown>
    cancel: (args: { symbol: string; orderId: number }) => Promise<unknown>
    getOpen: () => Promise<unknown[]>
  }
  strategies: {
    list: () => Promise<{ id: string; name: string; description: string; params: unknown[] }[]>
  }
  engine: {
    getStatus: () => Promise<import("../shared/types").EngineStatus>
    arm: (args: {
      strategyId: string
      params: StrategyParams
      symbols: string[]
      interval?: KlineInterval
      ensemble?: import("../shared/types").EnsembleMemberConfig[]
    }) => Promise<import("../shared/types").EngineStatus>
    disarm: () => Promise<import("../shared/types").EngineStatus>
    setStrategy: (strategyId: string) => Promise<void>
  }
  backtest: {
    run: (req: BacktestRequest) => Promise<BacktestResult>
    sweep: (req: import("../shared/backtestSweepTypes").BacktestSweepRequest) => Promise<import("../shared/types").BacktestSweepResult>
    list: () => Promise<BacktestResult[]>
    listSweeps: () => Promise<import("../shared/types").BacktestSweepResult[]>
    getLatest: () => Promise<BacktestResult | null>
    getLatestSweep: () => Promise<import("../shared/types").BacktestSweepResult | null>
    ensembleMultiSweep: (
      req: import("../shared/backtestSweepTypes").EnsembleMultiSweepRequest
    ) => Promise<import("../shared/types").EnsembleMultiSweepResult>
    getLatestEnsembleMultiSweep: () => Promise<import("../shared/types").EnsembleMultiSweepResult | null>
    strategyParamMultiSweep: (
      req: import("../shared/backtestSweepTypes").StrategyParamMultiSweepRequest
    ) => Promise<import("../shared/types").StrategyParamMultiSweepResult>
    getLatestStrategyParamMultiSweep: () => Promise<import("../shared/types").StrategyParamMultiSweepResult | null>
  }
  heatmap: {
    setBootstrap: (config: import("../shared/backtestSweepTypes").HeatmapLabBootstrap) => Promise<void>
    getBootstrap: () => Promise<import("../shared/backtestSweepTypes").HeatmapLabBootstrap | null>
    openLab: () => Promise<void>
    apply: (payload: import("../shared/backtestSweepTypes").HeatmapApplyPayload) => Promise<void>
  }
  setups: {
    list: () => Promise<{ recent: AlgoSetup[]; saved: AlgoSetup[] }>
    record: (input: AlgoSetupInput) => Promise<AlgoSetup>
    save: (args: AlgoSetupInput & { name: string }) => Promise<AlgoSetup>
    touch: (id: string) => Promise<AlgoSetup | null>
    toggleFavorite: (id: string) => Promise<AlgoSetup | null>
    remove: (id: string) => Promise<boolean>
  }
  workspace: {
    get: () => Promise<AppWorkspace>
    patch: (partial: Partial<AppWorkspace>) => Promise<AppWorkspace>
  }
  on: (channel: string, listener: (_: unknown, data: unknown) => void) => () => void
}

declare global {
  interface Window {
    api: BazingaApi
  }
}

export {}
