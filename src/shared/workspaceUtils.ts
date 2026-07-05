import type { AppWorkspace, EngineConfig } from "./types"
import { DEFAULT_INTERVAL } from "./constants"

export const WORKSPACE_VERSION = 1

export function defaultWorkspace(): AppWorkspace {
  return {
    version: WORKSPACE_VERSION,
    lastRoute: "/algo-builder",
    engineDraft: undefined,
    backtest: undefined,
    algoBuilder: { heatmapDays: 90 },
    updatedAt: 0
  }
}

export function mergeWorkspace(
  current: AppWorkspace,
  patch: Partial<AppWorkspace>
): AppWorkspace {
  return {
    ...current,
    ...patch,
    version: WORKSPACE_VERSION,
    engineDraft:
      patch.engineDraft !== undefined ? patch.engineDraft : current.engineDraft,
    backtest:
      patch.backtest !== undefined
        ? patch.backtest
        : current.backtest,
    algoBuilder: patch.algoBuilder
      ? { ...current.algoBuilder, ...patch.algoBuilder }
      : current.algoBuilder,
    updatedAt: Date.now()
  }
}

export function engineStateToDraft(
  state: Pick<EngineConfig, "strategyId" | "params" | "symbols" | "interval" | "ensemble">
): EngineConfig {
  return {
    strategyId: state.strategyId,
    params: { ...state.params },
    symbols: [...state.symbols],
    interval: state.interval ?? DEFAULT_INTERVAL,
    ensemble: state.ensemble?.map((m) => ({
      ...m,
      params: { ...(m.params ?? {}) }
    }))
  }
}

export function isEngineDraftUsable(draft?: EngineConfig): draft is EngineConfig {
  return !!draft?.strategyId
}
