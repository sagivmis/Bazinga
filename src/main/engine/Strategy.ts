import type { OrderIntent, StrategyParams } from "../../shared/types"
import type { PositionView } from "../../shared/types"

export interface StrategyContext {
  symbol: string
  candle: import("../../shared/types").Candle
  price: number
  position: PositionView | null
  params: StrategyParams
  submitOrder: (order: OrderIntent) => Promise<unknown>
}

export interface Strategy {
  id: string
  name: string
  description: string
  defaultParams: StrategyParams
  paramSchema: {
    key: string
    label: string
    type: "number" | "string" | "boolean"
    default: number | string | boolean
    min?: number
    max?: number
  }[]
  onCandleClose(ctx: StrategyContext): Promise<void>
}

export interface BacktestContext {
  symbol: string
  candles: import("../../shared/types").Candle[]
  params: StrategyParams
}
