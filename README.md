# Bazinga — Binance Algo Trading Dashboard

Electron desktop app for USDM futures algorithmic trading on **Binance Testnet**.

## Features

- Dark trading dashboard (chart, order ticket, order book, positions, KPI cards)
- Secure architecture: API keys in main process only (contextIsolation + safeStorage)
- Pluggable strategy engine with EMA/VWMA crossover
- Backtest runner with performance metrics
- Binance Testnet by default

## Quick start

```bash
npm install
npm run dev
```

1. Open **Settings** and enter your Binance Testnet API key + secret
2. Use the **Dashboard** for manual trading and market view
3. Configure strategy params in **Algo Builder**, then **RUN** the algo engine from the sidebar
4. Run **Backtest** to evaluate strategy before going live

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Electron with hot reload |
| `npm run build` | Build main + renderer for production |
| `npm start` | Launch Electron (after build) |

## Architecture

```
src/main/       Electron main — Binance API, strategy engine, backtest
src/preload/    contextBridge IPC API (window.api)
src/renderer/   React UI
src/shared/     Types, constants, IPC channel names
```

## Environment

Optional `.env` for development (fallback if keys not stored in Settings):

```
API_KEY=your_testnet_key
API_SECRET=your_testnet_secret
```

**Never commit real API keys.**

## Adding a strategy

1. Create `src/main/strategies/MyStrategy.ts` implementing the `Strategy` interface
2. Register it in `src/main/strategies/registry.ts`
3. Add signal logic usable by both `StrategyEngine` (live) and `BacktestRunner`
