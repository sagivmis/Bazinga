import type { StrategyParams } from "./types"

export type LeverageMode = "fixed" | "range"

export const DEFAULT_LEVERAGE = 10
export const MIN_LEVERAGE = 1
export const MAX_LEVERAGE = 125

export function clampLeverage(value: number, min = MIN_LEVERAGE, max = MAX_LEVERAGE): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function getLeverageMode(params: StrategyParams): LeverageMode {
  const mode = String(params.leverageMode ?? "fixed")
  return mode === "range" ? "range" : "fixed"
}

/** Effective leverage from strategy params (respects fixed vs range bounds) */
export function resolveStrategyLeverage(params: StrategyParams): number {
  const mode = getLeverageMode(params)
  const leverage = Number(params.leverage ?? DEFAULT_LEVERAGE)

  if (mode === "range") {
    const min = Number(params.leverageMin ?? MIN_LEVERAGE)
    const max = Number(params.leverageMax ?? 20)
    const lo = Math.min(min, max)
    const hi = Math.max(min, max)
    return clampLeverage(leverage, lo, hi)
  }

  return clampLeverage(leverage)
}

export function isLeverageEditable(params: StrategyParams): boolean {
  return getLeverageMode(params) === "range"
}

export function leverageRange(params: StrategyParams): { min: number; max: number } {
  const min = clampLeverage(Number(params.leverageMin ?? MIN_LEVERAGE))
  const max = clampLeverage(Number(params.leverageMax ?? 20))
  return { min: Math.min(min, max), max: Math.max(min, max) }
}

/** Margin × leverage = position notional for sizing */
export function positionNotionalUsd(marginUsd: number, leverage: number): number {
  return marginUsd * clampLeverage(leverage)
}

export function quantityFromMargin(
  marginUsd: number,
  leverage: number,
  price: number
): number {
  if (price <= 0) return 0
  return parseFloat((positionNotionalUsd(marginUsd, leverage) / price).toFixed(4))
}

export const LEVERAGE_PARAM_KEYS = new Set([
  "leverageMode",
  "leverage",
  "leverageMin",
  "leverageMax"
])

export function schemaWithoutLeverage<T extends { key: string }>(schema: T[]): T[] {
  return schema.filter((f) => !LEVERAGE_PARAM_KEYS.has(f.key))
}
