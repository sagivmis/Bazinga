import type { Strategy } from "../engine/Strategy"
import { DEFAULT_LEVERAGE } from "../../shared/leverageUtils"

export const leverageParamSchema = [
  {
    key: "leverageMode",
    label: "Leverage Mode",
    type: "string" as const,
    default: "fixed"
  },
  {
    key: "leverage",
    label: "Leverage",
    type: "number" as const,
    default: DEFAULT_LEVERAGE,
    min: 1,
    max: 125
  },
  {
    key: "leverageMin",
    label: "Leverage Min",
    type: "number" as const,
    default: 5,
    min: 1,
    max: 125
  },
  {
    key: "leverageMax",
    label: "Leverage Max",
    type: "number" as const,
    default: 20,
    min: 1,
    max: 125
  }
]

export const defaultLeverageParams = {
  leverageMode: "fixed",
  leverage: DEFAULT_LEVERAGE,
  leverageMin: 5,
  leverageMax: 20
}

export function withLeverageParams(strategy: Strategy): Strategy {
  const paramSchema = strategy.paramSchema.map((p) =>
    p.key === "notionalUsd" ? { ...p, label: "Margin USD" } : p
  )
  return {
    ...strategy,
    defaultParams: { ...strategy.defaultParams, ...defaultLeverageParams },
    paramSchema: [...paramSchema, ...leverageParamSchema]
  }
}
