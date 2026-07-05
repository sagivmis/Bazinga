import { create } from "zustand"
import type { AppWorkspace, EngineConfig } from "../../shared/types"
import { engineStateToDraft } from "../../shared/workspaceUtils"

interface WorkspaceState {
  workspace: AppWorkspace | null
  loaded: boolean
  init: () => Promise<AppWorkspace | null>
  patch: (partial: Partial<AppWorkspace>) => Promise<void>
  setLocal: (workspace: AppWorkspace) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  loaded: false,

  init: async () => {
    if (!window.api?.workspace) {
      set({ loaded: true })
      return null
    }
    const workspace = await window.api.workspace.get()
    set({ workspace, loaded: true })
    return workspace
  },

  patch: async (partial) => {
    if (!window.api?.workspace) return
    const workspace = await window.api.workspace.patch(partial)
    set({ workspace })
  },

  setLocal: (workspace) => set({ workspace })
}))

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingPatch: Partial<AppWorkspace> = {}

/** Debounced workspace write — safe to call on every keystroke/change. */
export function debouncedWorkspacePatch(partial: Partial<AppWorkspace>, delayMs = 450) {
  pendingPatch = { ...pendingPatch, ...partial }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const toSend = { ...pendingPatch }
    pendingPatch = {}
    debounceTimer = null
    void useWorkspaceStore.getState().patch(toSend)
  }, delayMs)
}

export function persistEngineDraftFromStore(state: {
  strategyId: string | null
  params: EngineConfig["params"]
  symbols: string[]
  interval: EngineConfig["interval"]
  ensemble: EngineConfig["ensemble"]
}) {
  if (!state.strategyId) return
  debouncedWorkspacePatch({
    engineDraft: engineStateToDraft({
      strategyId: state.strategyId,
      params: state.params,
      symbols: state.symbols,
      interval: state.interval,
      ensemble: state.ensemble
    })
  })
}

export function persistBacktestDraft(draft: NonNullable<AppWorkspace["backtest"]>) {
  debouncedWorkspacePatch({ backtest: draft })
}

export function persistAlgoBuilderDraft(draft: Partial<AppWorkspace["algoBuilder"]>) {
  debouncedWorkspacePatch({ algoBuilder: draft })
}
