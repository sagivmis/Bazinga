# IPC Reference

All exchange access goes through `window.api` (preload → main). The renderer never holds API keys.

## Invoke channels

| Channel | Payload | Returns |
|---------|---------|---------|
| `settings:get` | — | `AppSettings` |
| `settings:set` | `Partial<AppSettings>` | `AppSettings` |
| `secrets:has` | — | `{ apiKey, apiSecret }` |
| `secrets:set` | `{ apiKey, apiSecret }` | `boolean` |
| `secrets:clear` | — | `void` |
| `connection:ping` | — | `number` (latency ms) |
| `connection:status` | — | `ConnectionStatus` |
| `md:getContracts` | — | `string[]` |
| `md:getTickers` | — | `MarketTicker[]` |
| `md:getKlines` | `{ symbol, interval, limit? }` | `Candle[]` |
| `md:getOrderBook` | `{ symbol, limit? }` | `OrderBookSnapshot` |
| `md:subscribeSymbol` | `{ symbol, interval }` | `void` |
| `md:unsubscribeSymbol` | `symbol` | `void` |
| `account:getSummary` | — | `AccountSummary` |
| `account:getPositions` | — | `PositionView[]` |
| `orders:submit` | `OrderIntent` | order result |
| `orders:cancel` | `{ symbol, orderId }` | cancel result |
| `orders:getOpen` | — | `OpenOrderView[]` |
| `trades:list` | — | `TradeRecord[]` |
| `strategies:list` | — | strategy definitions |
| `engine:getStatus` | — | `EngineStatus` |
| `engine:arm` | `{ strategyId, params, symbols }` | `EngineStatus` |
| `engine:disarm` | — | `EngineStatus` |
| `backtest:run` | `BacktestRequest` | `BacktestResult` |
| `backtest:list` | — | `BacktestResult[]` |
| `backtest:getLatest` | — | `BacktestResult \| null` |

## Push events (main → renderer)

Subscribe via `window.api.on(channel, (_, data) => ...)`.

| Channel | Payload |
|---------|---------|
| `event:price` | `{ symbol, price }` |
| `event:kline` | `{ symbol, candle }` |
| `event:connection` | `ConnectionStatus` |
| `event:engine` | `EngineStatus` |
| `event:backtest` | `BacktestResult` |

## Types

Shared types live in `src/shared/types.ts`. Channel names in `src/shared/ipc.ts`.
