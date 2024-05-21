import { KlineInterval } from "binance"

export const live_websocket_url = "wss://fstream.binance.com"
export const test_websocket_url = "wss://stream.binancefuture.com/ws"
export const live_url = "https://fapi.binance.com"
export const testnet_url = "https://testnet.binancefuture.com"

export const MS: Record<KlineInterval, number> = {
  "1s": 1 * 1000,
  "1m": 60 * 1000,
  "3m": 180 * 1000,
  "5m": 300 * 1000,
  "15m": 900 * 1000,
  "30m": 1800 * 1000,
  "1h": 3600 * 1000,
  "2h": 7200 * 1000,
  "4h": 14400 * 1000,
  "6h": 21600 * 1000,
  "8h": 28800 * 1000,
  "12h": 43200 * 1000,
  "1d": 86400 * 1000,
  "3d": 259200 * 1000,
  "1w": 604800 * 1000,
  "1M": 2592000 * 1000
}
