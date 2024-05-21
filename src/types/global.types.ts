import { KlineInterval, numberInString } from "binance"
import { ReactNode } from "react"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).global = window

export type ProviderProps = {
  children: ReactNode
}

export interface Contract {
  symbol: string
  baseAsset: string
  quoteAsset: string
  priceDecimals: number
  quantityDecimals: number
  tickSize: number
  lotSize: number
}

export interface Trade {
  time: Date
  contract: Contract
  strategy: string
  side: string
  entryPrice: number
  status: string
  quantity: number
  entryId: string
}

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Balance {
  initialMargin: number
  maintenanceMargin: number
  marginBalance: number
  walletBalance: number
  unrealizedPnl: number
}

export type WatchlistItemType = {
  symbol: string
  bid?: number
  ask?: number
}

export type Price = { bid: number; ask: number }
export type PriceFloat = number
export type Prices = Record<string, PriceFloat>

export interface StreamKline {
  startTime: number
  endTime: number
  symbol: string
  interval: KlineInterval
  firstTradeId: number
  lastTradeId: number
  open: numberInString
  close: numberInString
  high: numberInString
  low: numberInString
  volume: numberInString
  trades: number
  final: boolean
  quoteVolume: numberInString
  volumeActive: numberInString
  quoteVolumeActive: numberInString
  ignored: numberInString
}

export type FormattedMessageEventType = "kline" | "markPriceUpdate"

export type FormattedMessageData = {
  eventType: FormattedMessageEventType
  kline?: StreamKline
  markPrice?: number
  eventTime: number
  symbol: string
  wsKey: string
  wsMarket: string
}
