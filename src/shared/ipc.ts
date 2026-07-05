/** IPC channel names shared between main, preload, and renderer */

export const IPC = {
  // Settings & secrets
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SECRETS_HAS: "secrets:has",
  SECRETS_SET: "secrets:set",
  SECRETS_CLEAR: "secrets:clear",

  // Connection
  CONNECTION_STATUS: "connection:status",
  CONNECTION_PING: "connection:ping",

  // Market data
  MD_SUBSCRIBE_SYMBOL: "md:subscribeSymbol",
  MD_UNSUBSCRIBE_SYMBOL: "md:unsubscribeSymbol",
  MD_GET_KLINES: "md:getKlines",
  MD_GET_ORDERBOOK: "md:getOrderBook",
  MD_GET_CONTRACTS: "md:getContracts",
  MD_GET_TICKERS: "md:getTickers",

  // Account
  ACCOUNT_GET_SUMMARY: "account:getSummary",
  ACCOUNT_GET_POSITIONS: "account:getPositions",

  // Orders
  ORDERS_SUBMIT: "orders:submit",
  ORDERS_CANCEL: "orders:cancel",
  ORDERS_GET_OPEN: "orders:getOpen",
  ORDERS_GET_HISTORY: "orders:getHistory",

  TRADES_LIST: "trades:list",

  // Engine
  ENGINE_GET_STATUS: "engine:getStatus",
  ENGINE_ARM: "engine:arm",
  ENGINE_DISARM: "engine:disarm",
  ENGINE_SET_STRATEGY: "engine:setStrategy",

  // Strategies
  STRATEGIES_LIST: "strategies:list",

  // Backtest
  BACKTEST_RUN: "backtest:run",
  BACKTEST_SWEEP: "backtest:sweep",
  BACKTEST_LIST: "backtest:list",
  BACKTEST_SWEEP_LIST: "backtest:sweepList",
  BACKTEST_GET_LATEST: "backtest:getLatest",
  BACKTEST_GET_LATEST_SWEEP: "backtest:getLatestSweep",
  BACKTEST_ENSEMBLE_MULTI_SWEEP: "backtest:ensembleMultiSweep",
  BACKTEST_GET_LATEST_ENSEMBLE_MULTI_SWEEP: "backtest:getLatestEnsembleMultiSweep",

  HEATMAP_OPEN_LAB: "heatmap:openLab",
  HEATMAP_SET_BOOTSTRAP: "heatmap:setBootstrap",
  HEATMAP_GET_BOOTSTRAP: "heatmap:getBootstrap",
  HEATMAP_APPLY: "heatmap:apply",

  // Push events (main -> renderer)
  EVENT_PRICE: "event:price",
  EVENT_KLINE: "event:kline",
  EVENT_ORDERBOOK: "event:orderbook",
  EVENT_ACCOUNT: "event:account",
  EVENT_POSITIONS: "event:positions",
  EVENT_ENGINE: "event:engine",
  EVENT_CONNECTION: "event:connection",
  EVENT_BACKTEST: "event:backtest",
  EVENT_BACKTEST_SWEEP: "event:backtestSweep",
  EVENT_BACKTEST_SWEEP_PROGRESS: "event:backtestSweepProgress",
  EVENT_ENSEMBLE_MULTI_SWEEP: "event:ensembleMultiSweep",
  EVENT_ENSEMBLE_MULTI_SWEEP_PROGRESS: "event:ensembleMultiSweepProgress",
  EVENT_HEATMAP_APPLY: "event:heatmapApply"
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
