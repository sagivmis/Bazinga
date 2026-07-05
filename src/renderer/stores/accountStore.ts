import { create } from "zustand"
import type { AccountSummary, PositionView } from "../../shared/types"
import { IPC } from "../../shared/ipc"

interface AccountState {
  summary: AccountSummary | null
  positions: PositionView[]
  /** % equity change since first fetch this session */
  dayChangePct: number
  refresh: () => Promise<void>
  init: () => () => void
}

const emptySummary: AccountSummary = {
  balance: 0,
  unrealizedPnl: 0,
  equity: 0,
  availableMargin: 0,
  marginUsagePct: 0
}

let sessionStartEquity: number | null = null

export const useAccountStore = create<AccountState>((set) => ({
  summary: null,
  positions: [],
  dayChangePct: 0,
  refresh: async () => {
    if (!window.api) return
    try {
      const [summary, positions] = await Promise.all([
        window.api.account.getSummary(),
        window.api.account.getPositions()
      ])
      if (sessionStartEquity === null && summary.equity > 0) {
        sessionStartEquity = summary.equity
      }
      const dayChangePct =
        sessionStartEquity && sessionStartEquity > 0
          ? ((summary.equity - sessionStartEquity) / sessionStartEquity) * 100
          : 0
      set({ summary, positions, dayChangePct })
    } catch (err) {
      console.warn("[accountStore] refresh failed — API keys may be missing:", err)
      set({ summary: emptySummary, positions: [], dayChangePct: 0 })
    }
  },
  init: () => {
    if (!window.api) return () => {}
    const interval = setInterval(() => void useAccountStore.getState().refresh(), 5000)
    void useAccountStore.getState().refresh()
    const unsub = window.api.on(IPC.EVENT_POSITIONS, (_, data) => {
      set({ positions: data as PositionView[] })
    })
    return () => {
      clearInterval(interval)
      unsub()
    }
  }
}))
