import { create } from "zustand"
import type { ConnectionStatus } from "../../shared/types"
import { IPC } from "../../shared/ipc"

interface ConnectionState extends ConnectionStatus {
  init: () => () => void
  refresh: () => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connected: false,
  latencyMs: 0,
  useTestnet: true,
  refresh: async () => {
    if (!window.api) return
    const status = await window.api.connection.status()
    set(status)
  },
  init: () => {
    if (!window.api) return () => {}
    void useConnectionStore.getState().refresh()
    void window.api.connection.ping()
    const interval = setInterval(() => void useConnectionStore.getState().refresh(), 15000)
    const unsub = window.api.on(IPC.EVENT_CONNECTION, (_, data) => {
      set(data as ConnectionStatus)
    })
    return () => {
      clearInterval(interval)
      unsub()
    }
  }
}))
