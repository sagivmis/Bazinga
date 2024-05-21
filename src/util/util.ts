import { KlineInterval, numberInString } from "binance"
import { MS } from "./consts"

export const getDecimal = (value: number) => {
  const splittedNum = value.toString().split(".")
  return (splittedNum[1] && splittedNum[1].length) || 0
}

export const formatNISAsNumber = (value: numberInString) =>
  parseFloat(value.toString())

export const formatNISAsString = (
  value: numberInString,
  decimals: number = 2
) => formatNISAsNumber(value).toFixed(decimals)

export const formatPnl = (value: numberInString) => {
  const val = parseFloat(formatNISAsString(value, 3))
  if (val < 0) return `(${Math.abs(val)})`
  else return `${val}`
}

export const formatPositionValue = (value: numberInString, decimals = 3) => {
  return formatNISAsString(value, decimals)
}

/**
 *
 * @param timestamp1 current timestamp
 * @param timestamp2 open timestamp
 * @param interval strategy interval
 * @returns boolean
 */
export const isComplete = (
  timestamp1: number,
  timestamp2: number,
  interval: KlineInterval
) => {
  return timestamp1 - timestamp2 >= MS[interval]
}

// export const isComplete2 = eventTime
