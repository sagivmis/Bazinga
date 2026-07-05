import { create } from "zustand"
import { clampLeverage, DEFAULT_LEVERAGE } from "../../shared/leverageUtils"

/** Session-only leverage — never persisted to settings */
interface LeverageState {
  /** Per-symbol local leverage overrides */
  bySymbol: Record<string, number>
  defaultLeverage: number
  init: () => Promise<void>
  getLeverage: (symbol: string) => number
  setLeverage: (symbol: string, leverage: number) => void
  applyDefault: (defaultLeverage: number) => void
}

export const useLeverageStore = create<LeverageState>((set, get) => ({
  bySymbol: {},
  defaultLeverage: DEFAULT_LEVERAGE,

  init: async () => {
    if (!window.api) return
    const settings = await window.api.settings.get()
    const def = settings.defaultLeverage ?? DEFAULT_LEVERAGE
    set({ defaultLeverage: def })
  },

  getLeverage: (symbol) => {
    const key = symbol.toUpperCase()
    return get().bySymbol[key] ?? get().defaultLeverage
  },

  setLeverage: (symbol, leverage) => {
    const key = symbol.toUpperCase()
    set({
      bySymbol: { ...get().bySymbol, [key]: clampLeverage(leverage) }
    })
  },

  applyDefault: (defaultLeverage) => {
    set({ defaultLeverage: clampLeverage(defaultLeverage) })
  }
}))
