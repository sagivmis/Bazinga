import { create } from "zustand"
import type { OpenOrderView, TradeRecord } from "../../shared/types"

interface OrdersState {
  open: OpenOrderView[]
  trades: TradeRecord[]
  load: () => Promise<void>
  cancel: (symbol: string, orderId: number) => Promise<void>
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  open: [],
  trades: [],
  load: async () => {
    if (!window.api) return
    const [open, trades] = await Promise.all([
      window.api.orders.getOpen(),
      window.api.trades.list()
    ])
    set({ open, trades })
  },
  cancel: async (symbol, orderId) => {
    if (!window.api) return
    await window.api.orders.cancel({ symbol, orderId })
    await get().load()
  }
}))
