import type { KlineInterval } from "binance"

export type MarketType = "usdm" | "spot"

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface WatchlistItem {
  symbol: string
}

export interface PositionView {
  symbol: string
  side: "LONG" | "SHORT"
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
  stopLoss?: number
  takeProfit?: number
}

export interface AccountSummary {
  balance: number
  unrealizedPnl: number
  equity: number
  availableMargin: number
  marginUsagePct: number
}

export interface OrderBookLevel {
  price: number
  quantity: number
}

export interface OrderBookSnapshot {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface RecentTrade {
  id: number
  price: number
  quantity: number
  time: number
  isBuyerMaker: boolean
}

export interface OrderIntent {
  symbol: string
  side: "BUY" | "SELL"
  type: "LIMIT" | "MARKET" | "STOP"
  quantity: number
  price?: number
  stopPrice?: number
  /** Applied on exchange before order; not persisted in settings */
  leverage?: number
}

export interface StrategyParams {
  [key: string]: number | string | boolean
}

export interface StrategyDefinition {
  id: string
  name: string
  description: string
  params: {
    key: string
    label: string
    type: "number" | "string" | "boolean"
    default: number | string | boolean
    min?: number
    max?: number
  }[]
}

export interface EnsembleMemberConfig {
  strategyId: string
  weight: number
  enabled?: boolean
  params: StrategyParams
}

export interface BacktestRequest {
  strategyId: string
  symbol: string
  interval: KlineInterval
  startTime: number
  endTime: number
  params: StrategyParams
  initialBalance: number
  ensemble?: EnsembleMemberConfig[]
}

export interface BacktestTrade {
  time: number
  side: "LONG" | "SHORT"
  entryPrice: number
  exitPrice: number
  pnl: number
}

export interface BacktestResult {
  id: string
  strategyId: string
  symbol: string
  interval: KlineInterval
  params?: StrategyParams
  ensemble?: EnsembleMemberConfig[]
  trades: BacktestTrade[]
  equityCurve: { time: number; equity: number }[]
  metrics: {
    totalReturn: number
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
    profitFactor: number
    totalTrades: number
    avgPnlPerTrade: number
  }
}

export interface BacktestSweepCell {
  xValue: number
  yValue: number
  params: StrategyParams
  ensemble?: EnsembleMemberConfig[]
  metrics: BacktestResult["metrics"]
}

export interface BacktestSweepResult {
  id: string
  strategyId: string
  symbol: string
  interval: KlineInterval
  paramXKey: string
  paramYKey: string
  paramXLabel: string
  paramYLabel: string
  xValues: number[]
  yValues: number[]
  cells: BacktestSweepCell[]
  bestCell: BacktestSweepCell
  createdAt: number
  totalRuns: number
  source: "sweep" | "history"
}

export interface EnsembleMultiSweepCell {
  weights: Record<string, number>
  ensemble: EnsembleMemberConfig[]
  params: StrategyParams
  metrics: BacktestResult["metrics"]
}

export interface EnsembleMultiSweepResult {
  id: string
  strategyId: string
  symbol: string
  interval: KlineInterval
  weightAxes: import("./backtestSweepTypes").MemberWeightSweepAxis[]
  cells: EnsembleMultiSweepCell[]
  bestCell: EnsembleMultiSweepCell
  createdAt: number
  totalRuns: number
}

export interface EngineConfig {
  strategyId: string
  params: StrategyParams
  symbols: string[]
  ensemble?: EnsembleMemberConfig[]
}

export interface AppSettings {
  useTestnet: boolean
  theme: "dark"
  defaultSymbol: string
  defaultInterval: KlineInterval
  defaultLeverage: number
  watchlist: string[]
  engineConfig?: EngineConfig
}

export interface ConnectionStatus {
  connected: boolean
  latencyMs: number
  useTestnet: boolean
}

export interface EngineStatus {
  armed: boolean
  strategyId: string | null
  runningSymbols: string[]
}

export interface MarketTicker {
  symbol: string
  price: number
  changePct: number
  volume: number
}

export interface OpenOrderView {
  orderId: number
  symbol: string
  side: "BUY" | "SELL"
  type: string
  price: number
  quantity: number
  status: string
  time: number
}

export interface TradeRecord {
  id: string
  time: number
  symbol: string
  side: "BUY" | "SELL" | "LONG" | "SHORT"
  quantity: number
  price: number
  pnl?: number
  source: "manual" | "strategy" | "backtest"
  note?: string
}
