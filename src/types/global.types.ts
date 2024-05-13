import { ReactNode } from "react"

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
