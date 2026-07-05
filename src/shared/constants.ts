import type { KlineInterval } from "binance"

export const TESTNET_REST_URL = "https://demo-fapi.binance.com"
export const LIVE_REST_URL = "https://fapi.binance.com"
export const TESTNET_WS_URL = "wss://demo-fstream.binance.com"
export const LIVE_WS_URL = "wss://fstream.binance.com"

export const DEFAULT_SYMBOL = "BTCUSDT"
export const DEFAULT_INTERVAL: KlineInterval = "15m"

export const MS: Record<KlineInterval, number> = {
  "1s": 1_000,
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "6h": 21_600_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "3d": 259_200_000,
  "1w": 604_800_000,
  "1M": 2_592_000_000
}
