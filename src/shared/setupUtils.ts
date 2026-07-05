import type { AlgoSetup, AlgoSetupInput, EnsembleMemberConfig, StrategyParams } from "./types"

function sortRecord(obj: StrategyParams): StrategyParams {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  ) as StrategyParams
}

function normalizeEnsemble(ensemble?: EnsembleMemberConfig[]) {
  if (!ensemble?.length) return undefined
  return [...ensemble]
    .map((m) => ({
      strategyId: m.strategyId,
      weight: m.weight,
      enabled: m.enabled !== false,
      params: sortRecord(m.params ?? {})
    }))
    .sort((a, b) => a.strategyId.localeCompare(b.strategyId))
}

/** Stable key for deduplicating identical setups in history. */
export function setupFingerprint(
  setup: Pick<AlgoSetupInput, "strategyId" | "params" | "symbols" | "interval" | "ensemble">
): string {
  const payload = {
    strategyId: setup.strategyId,
    params: sortRecord(setup.params),
    symbols: setup.symbols.map((s) => s.toUpperCase()).sort(),
    interval: setup.interval ?? "15m",
    ensemble: normalizeEnsemble(setup.ensemble)
  }
  return JSON.stringify(payload)
}

export function autoSetupName(
  strategyName: string,
  symbol: string,
  interval?: string
): string {
  return `${strategyName} · ${symbol} @ ${interval ?? "15m"}`
}

export function setupDisplayName(
  setup: AlgoSetup,
  strategyName: string
): string {
  if (setup.name?.trim()) return setup.name.trim()
  const symbol = setup.symbols[0] ?? "?"
  return autoSetupName(strategyName, symbol, setup.interval)
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

export function sourceLabel(source: AlgoSetup["source"]): string {
  switch (source) {
    case "armed":
      return "Live"
    case "backtest":
      return "Backtest"
    case "heatmap":
      return "Heatmap"
    case "saved":
      return "Saved"
    default:
      return source
  }
}

export function cloneSetupInput(input: AlgoSetupInput): AlgoSetupInput {
  return {
    ...input,
    params: { ...input.params },
    symbols: [...input.symbols],
    ensemble: input.ensemble?.map((m) => ({
      ...m,
      params: { ...(m.params ?? {}) }
    }))
  }
}
