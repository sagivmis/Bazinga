export const formatUsd = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

export const formatPnl = (value: number, decimals = 2) => {
  const formatted = Math.abs(value).toFixed(decimals)
  return value < 0 ? `(${formatted})` : formatted
}

export const formatPct = (value: number, decimals = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`
