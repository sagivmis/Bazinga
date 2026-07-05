# Adding a Strategy

Strategies live in `src/main/strategies/` and implement the `Strategy` interface.

## Steps

1. Create `src/main/strategies/MyStrategy.ts`
2. Export pure signal logic (e.g. `computeMySignals(candles, params)`) for reuse in backtests
3. Register in `src/main/strategies/registry.ts`
4. Configure params via **Algo Builder** in the UI

## Example structure

```typescript
import type { Strategy } from "../engine/Strategy"
import type { Candle } from "../../shared/types"

export function computeMySignals(candles: Candle[], params: Record<string, number | string | boolean>) {
  // return "LONG" | "SHORT" | null
  return null
}

export const myStrategy: Strategy = {
  id: "my-strategy",
  name: "My Strategy",
  description: "...",
  defaultParams: { period: 20 },
  paramSchema: [
    { key: "period", label: "Period", type: "number", default: 20, min: 5, max: 200 }
  ],
  async onCandleClose() {
    // Live execution handled by StrategyEngine using computeMySignals
  }
}
```

## Live vs backtest

- **Live**: `StrategyEngine` maintains candle history, calls `compute*Signals`, submits orders via `BinanceService`
- **Backtest**: `BacktestRunner` replays historical klines through the same signal function

Keep signal logic pure and shared between both paths.

## Built-in strategies

| ID | Focus |
|---|---|
| `volume-breakout` | Donchian break + volume spike — fewer trades via long channel |
| `wyckoff-spring` | Spring / upthrust after liquidity sweep on high volume |
| `wyckoff-breakout` | Tight range consolidation then markup/markdown break |
| `high-volume-trend` | EMA trend + low-volume pullback + high-volume entry |
| `ema-vwma-cross` | Original crossover baseline |
| `strategy-ensemble` | **Weighted combination** of any strategies above |

### Weighted Ensemble

Select **Weighted Ensemble** in Algo Builder or Backtest. Add strategies, assign each a **weight** (0–100), and set **Signal Threshold %** — the weighted LONG/SHORT vote must exceed this % of total active weight to trade.

Default ensemble: Wyckoff Spring (40) + Volume Breakout (35) + High Volume Trend (25).

Heatmap axes include **Weight: StrategyName** for each member, plus threshold and cooldown.

Tune **Cooldown Bars**, **volume multiplier**, and **4h/1d** intervals in Backtest to optimize for fewer, higher-quality trades. Compare **Avg P&amp;L / Trade** alongside total return.

Use **Backtest → Parameter Heatmap → Run Parameter Sweep** to grid-search two params at once (e.g. volume multiplier vs cooldown). Candles are fetched once; simulations run locally. Click a cell to apply those params.

## Risk parameters

Recommended params to expose:

- `notionalUsd` — position size in USD
- `stopLossPct` / `takeProfitPct` — exit thresholds (backtest)
- `cooldownBars` — minimum bars between new entries (live + backtest)
