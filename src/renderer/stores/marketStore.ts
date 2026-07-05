import { create } from "zustand"
import type { KlineInterval } from "binance"
import type { Candle, OrderBookSnapshot } from "../../shared/types"
import { IPC } from "../../shared/ipc"
import { DEFAULT_INTERVAL, DEFAULT_SYMBOL } from "../../shared/constants"

interface MarketState {
  symbol: string
  interval: KlineInterval
  prices: Record<string, number>
  changePct: Record<string, number>
  candles: Candle[]
  orderBook: OrderBookSnapshot | null
  setSymbol: (symbol: string) => void
  setInterval: (interval: KlineInterval) => void
  loadCandles: () => Promise<void>
  loadOrderBook: () => Promise<void>
  loadTickers: () => Promise<void>
  init: () => () => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbol: DEFAULT_SYMBOL,
  interval: DEFAULT_INTERVAL,
  prices: {},
  changePct: {},
  candles: [],
  orderBook: null,
  setSymbol: (symbol) => {
    set({ symbol })
    void get().loadCandles()
    void get().loadOrderBook()
    if (window.api) {
      void window.api.market.subscribeSymbol({ symbol, interval: get().interval })
    }
  },
  setInterval: (interval) => {
    set({ interval })
    void get().loadCandles()
    if (window.api) {
      void window.api.market.subscribeSymbol({ symbol: get().symbol, interval })
    }
  },
  loadCandles: async () => {
    if (!window.api) return
    const { symbol, interval } = get()
    const candles = await window.api.market.getKlines({ symbol, interval, limit: 500 })
    set({ candles })
  },
  loadOrderBook: async () => {
    if (!window.api) return
    try {
      const orderBook = await window.api.market.getOrderBook({ symbol: get().symbol, limit: 20 })
      set({ orderBook })
    } catch (err) {
      console.warn("[marketStore] order book failed:", err)
    }
  },
  loadTickers: async () => {
    if (!window.api) return
    try {
      const tickers = await window.api.market.getTickers()
      const prices: Record<string, number> = {}
      const changePct: Record<string, number> = {}
      for (const t of tickers) {
        prices[t.symbol] = t.price
        changePct[t.symbol] = t.changePct
      }
      set((state) => ({
        prices: { ...state.prices, ...prices },
        changePct: { ...state.changePct, ...changePct }
      }))
    } catch (err) {
      console.warn("[marketStore] tickers failed:", err)
    }
  },
  init: () => {
    if (!window.api) return () => {}
    const { symbol, interval } = get()
    void window.api.market.subscribeSymbol({ symbol, interval })
    void get().loadCandles()
    void get().loadOrderBook()
    void get().loadTickers()

    const tickerInterval = setInterval(() => void get().loadTickers(), 30_000)

    const unsubPrice = window.api.on(IPC.EVENT_PRICE, (_, data) => {
      const { symbol: s, price } = data as { symbol: string; price: number }
      set((state) => ({ prices: { ...state.prices, [s]: price } }))
    })

    const unsubKline = window.api.on(IPC.EVENT_KLINE, (_, data) => {
      const { symbol: s, candle } = data as { symbol: string; candle: Candle }
      if (s !== get().symbol) return
      set((state) => {
        const candles = [...state.candles]
        const idx = candles.findIndex((c) => c.timestamp === candle.timestamp)
        if (idx >= 0) candles[idx] = candle
        else candles.push(candle)
        return { candles }
      })
    })

    const bookInterval = setInterval(() => void get().loadOrderBook(), 3000)

    return () => {
      unsubPrice()
      unsubKline()
      clearInterval(bookInterval)
      clearInterval(tickerInterval)
    }
  }
}))
