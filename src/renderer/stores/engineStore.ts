import { create } from "zustand"
import type { EngineStatus, EnsembleMemberConfig, StrategyParams, AlgoSetup } from "../../shared/types"
import type { KlineInterval } from "binance"
import {
  ENSEMBLE_STRATEGY_ID,
  defaultEnsembleMembers
} from "../../shared/ensembleUtils"
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL } from "../../shared/constants"
import { recordSetupAsync } from "./setupLibraryStore"
import { isEngineDraftUsable } from "../../shared/workspaceUtils"
import { normalizeSymbol } from "../../shared/symbolUtils"

type StrategyMeta = {
  id: string
  name: string
  description: string
  params: { key: string; label: string; type: string; default: unknown }[]
  defaultParams?: StrategyParams
}

interface EngineState extends EngineStatus {
  params: StrategyParams
  symbols: string[]
  interval: KlineInterval
  ensemble: EnsembleMemberConfig[]
  error: string | null
  init: () => Promise<void>
  setStrategyCatalog: (strategies: StrategyMeta[]) => void
  setStrategyId: (id: string, defaults?: StrategyParams) => void
  setParams: (params: StrategyParams) => void
  setEnsemble: (ensemble: EnsembleMemberConfig[]) => void
  setSymbol: (symbol: string) => void
  setInterval: (interval: KlineInterval) => void
  loadSetup: (setup: AlgoSetup) => void
  saveConfig: () => Promise<void>
  armEngine: () => Promise<void>
  disarmEngine: () => Promise<void>
  toggleEngine: () => Promise<void>
}

let strategyCatalog: StrategyMeta[] = []

export const useEngineStore = create<EngineState>((set, get) => ({
  armed: false,
  strategyId: "wyckoff-spring",
  runningSymbols: [],
  params: {},
  symbols: [DEFAULT_SYMBOL],
  interval: DEFAULT_INTERVAL,
  ensemble: defaultEnsembleMembers(),
  error: null,

  init: async () => {
    if (!window.api) return
    try {
      const [status, settings, strategies, workspace] = await Promise.all([
        window.api.engine.getStatus(),
        window.api.settings.get(),
        window.api.strategies.list(),
        window.api.workspace?.get() ?? Promise.resolve(null)
      ])
      strategyCatalog = strategies as StrategyMeta[]

      const draft = workspace?.engineDraft
      const cfg = isEngineDraftUsable(draft) ? draft : settings.engineConfig
      const strategyId = cfg?.strategyId ?? status.strategyId ?? "wyckoff-spring"
      const strat = strategyCatalog.find((s) => s.id === strategyId)
      const params =
        cfg?.params && Object.keys(cfg.params).length > 0
          ? cfg.params
          : (strat?.defaultParams ?? {})
      const symbols = cfg?.symbols?.length ? cfg.symbols : [settings.defaultSymbol]
      const interval = cfg?.interval ?? settings.defaultInterval
      const ensemble =
        cfg?.ensemble?.length
          ? cfg.ensemble
          : strategyId === ENSEMBLE_STRATEGY_ID
            ? defaultEnsembleMembers()
            : get().ensemble

      set({
        armed: status.armed,
        strategyId,
        runningSymbols: status.runningSymbols,
        params,
        symbols,
        interval,
        ensemble,
        error: null
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load engine config" })
    }
  },

  setStrategyCatalog: (strategies) => {
    strategyCatalog = strategies
  },

  setStrategyId: (id, defaults) => {
    const strat = strategyCatalog.find((s) => s.id === id)
    const params = defaults ?? strat?.defaultParams
    set({
      strategyId: id,
      params: params ? { ...params } : get().params,
      ensemble:
        id === ENSEMBLE_STRATEGY_ID
          ? get().strategyId === ENSEMBLE_STRATEGY_ID
            ? get().ensemble
            : defaultEnsembleMembers()
          : get().ensemble,
      error: null
    })
  },

  setParams: (params) => set({ params: { ...get().params, ...params } }),

  setEnsemble: (ensemble) => set({ ensemble }),

  setSymbol: (symbol) => set({ symbols: [normalizeSymbol(symbol) || DEFAULT_SYMBOL] }),

  setInterval: (interval) => set({ interval }),

  loadSetup: (setup) => {
    set({
      strategyId: setup.strategyId,
      params: { ...setup.params },
      symbols: setup.symbols.length ? [...setup.symbols] : get().symbols,
      interval: setup.interval ?? get().interval,
      ensemble: setup.ensemble?.length
        ? setup.ensemble.map((m) => ({ ...m, params: { ...(m.params ?? {}) } }))
        : get().ensemble,
      error: null
    })
  },

  saveConfig: async () => {
    if (!window.api) {
      set({ error: "Not running in Electron — use the desktop app window." })
      return
    }
    const { strategyId, params, symbols, interval, ensemble } = get()
    if (!strategyId) return
    try {
      await window.api.settings.set({
        engineConfig: {
          strategyId,
          params,
          symbols,
          interval,
          ensemble: strategyId === ENSEMBLE_STRATEGY_ID ? ensemble : undefined
        }
      })
      set({ error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save config" })
    }
  },

  armEngine: async () => {
    if (!window.api) {
      set({ error: "Not running in Electron — use the desktop app window." })
      return
    }
    const { strategyId, params, symbols, interval, ensemble } = get()
    if (!strategyId) {
      set({ error: "Select a strategy first." })
      return
    }
    if (strategyId === ENSEMBLE_STRATEGY_ID) {
      const active = ensemble.filter((m) => m.enabled !== false && m.weight > 0)
      if (active.length < 1) {
        set({ error: "Ensemble needs at least one enabled strategy with weight > 0." })
        return
      }
    }
    try {
      await get().saveConfig()
      const status = await window.api.engine.arm({
        strategyId,
        params,
        symbols,
        interval,
        ensemble: strategyId === ENSEMBLE_STRATEGY_ID ? ensemble : undefined
      })
      set({ ...status, error: null })
      recordSetupAsync({
        strategyId,
        params,
        symbols,
        interval,
        ensemble: strategyId === ENSEMBLE_STRATEGY_ID ? ensemble : undefined,
        source: "armed"
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to arm engine" })
    }
  },

  disarmEngine: async () => {
    if (!window.api) {
      set({ error: "Not running in Electron — use the desktop app window." })
      return
    }
    try {
      const status = await window.api.engine.disarm()
      set({ ...status, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to disarm engine" })
    }
  },

  toggleEngine: async () => {
    const { armed } = get()
    if (armed) await get().disarmEngine()
    else await get().armEngine()
  }
}))
