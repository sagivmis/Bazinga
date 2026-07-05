/** Normalize a futures symbol ticker for Binance USDT-M. */
export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export const QUICK_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT"
] as const

export function symbolBase(symbol: string): string {
  if (symbol.endsWith("USDT")) return symbol.slice(0, -4)
  if (symbol.endsWith("USDC")) return symbol.slice(0, -4)
  return symbol
}

export function filterSymbols(contracts: string[], query: string, limit = 12): string[] {
  const q = normalizeSymbol(query)
  if (!q) return contracts.slice(0, limit)
  const starts = contracts.filter((s) => s.startsWith(q))
  const contains = contracts.filter((s) => !s.startsWith(q) && s.includes(q))
  return [...starts, ...contains].slice(0, limit)
}
