import { create } from "zustand"
import type { AlgoSetup, AlgoSetupInput } from "../../shared/types"

interface SetupLibraryState {
  recent: AlgoSetup[]
  saved: AlgoSetup[]
  loading: boolean
  refresh: () => Promise<void>
  record: (input: AlgoSetupInput) => Promise<void>
  save: (input: AlgoSetupInput & { name: string }) => Promise<void>
  touch: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSetupLibraryStore = create<SetupLibraryState>((set, get) => ({
  recent: [],
  saved: [],
  loading: false,

  refresh: async () => {
    if (!window.api?.setups) return
    set({ loading: true })
    try {
      const data = await window.api.setups.list()
      set({ recent: data.recent, saved: data.saved, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  record: async (input) => {
    if (!window.api?.setups) return
    await window.api.setups.record(input)
    await get().refresh()
  },

  save: async (input) => {
    if (!window.api?.setups) return
    await window.api.setups.save(input)
    await get().refresh()
  },

  touch: async (id) => {
    if (!window.api?.setups) return
    await window.api.setups.touch(id)
    await get().refresh()
  },

  toggleFavorite: async (id) => {
    if (!window.api?.setups) return
    await window.api.setups.toggleFavorite(id)
    await get().refresh()
  },

  remove: async (id) => {
    if (!window.api?.setups) return
    await window.api.setups.remove(id)
    await get().refresh()
  }
}))

/** Record a setup without blocking the caller. */
export function recordSetupAsync(input: AlgoSetupInput) {
  void useSetupLibraryStore.getState().record(input)
}
