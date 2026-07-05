import { create } from "zustand"
import type { BacktestResult } from "../../shared/types"
import { IPC } from "../../shared/ipc"

interface BacktestState {
  latest: BacktestResult | null
  history: BacktestResult[]
  load: () => Promise<void>
  init: () => () => void
}

export const useBacktestStore = create<BacktestState>((set) => ({
  latest: null,
  history: [],
  load: async () => {
    if (!window.api) return
    const [latest, history] = await Promise.all([
      window.api.backtest.getLatest(),
      window.api.backtest.list()
    ])
    set({ latest, history })
  },
  init: () => {
    if (!window.api) return () => {}
    void useBacktestStore.getState().load()
    const unsub = window.api.on(IPC.EVENT_BACKTEST, (_, data) => {
      const result = data as BacktestResult
      set({ latest: result, history: [result, ...useBacktestStore.getState().history].slice(0, 50) })
    })
    return unsub
  }
}))
