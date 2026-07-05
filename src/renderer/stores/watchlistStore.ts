import { create } from "zustand"
import type { MarketTicker } from "../../shared/types"
import { useMarketStore } from "./marketStore"

interface WatchlistState {
  symbols: string[]
  tickers: MarketTicker[]
  search: string
  setSearch: (s: string) => void
  load: () => Promise<void>
  add: (symbol: string) => Promise<void>
  remove: (symbol: string) => Promise<void>
  selectSymbol: (symbol: string) => void
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: [],
  tickers: [],
  search: "",
  setSearch: (search) => set({ search }),
  load: async () => {
    if (!window.api) return
    const [settings, tickers] = await Promise.all([
      window.api.settings.get(),
      window.api.market.getTickers()
    ])
    set({ symbols: settings.watchlist, tickers })
    settings.watchlist.forEach((symbol) => {
      void window.api.market.subscribeSymbol({ symbol, interval: settings.defaultInterval })
    })
  },
  add: async (symbol) => {
    if (!window.api) return
    const settings = await window.api.settings.get()
    if (settings.watchlist.includes(symbol)) return
    const watchlist = [...settings.watchlist, symbol]
    await window.api.settings.set({ watchlist })
    set({ symbols: watchlist })
    void window.api.market.subscribeSymbol({ symbol, interval: settings.defaultInterval })
  },
  remove: async (symbol) => {
    if (!window.api) return
    const settings = await window.api.settings.get()
    const watchlist = settings.watchlist.filter((s) => s !== symbol)
    await window.api.settings.set({ watchlist })
    set({ symbols: watchlist })
  },
  selectSymbol: (symbol) => {
    useMarketStore.getState().setSymbol(symbol)
  }
}))
