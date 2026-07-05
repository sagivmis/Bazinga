import { useAccountStore } from "../../stores/accountStore"
import { useEngineStore } from "../../stores/engineStore"
import { useBacktestStore } from "../../stores/backtestStore"
import { formatPct } from "../../../shared/format"
import "./kpi-cards.css"

export default function KpiCards() {
  const summary = useAccountStore((s) => s.summary)
  const positions = useAccountStore((s) => s.positions)
  const { armed, runningSymbols } = useEngineStore()
  const latestBacktest = useBacktestStore((s) => s.latest)
  const metrics = latestBacktest?.metrics
  const equityCurve = latestBacktest?.equityCurve ?? []

  const allocation = positions.length
    ? positions.map((p) => ({
        symbol: p.symbol.replace("USDT", ""),
        pct: (Math.abs(p.size * p.markPrice) / Math.max(summary?.equity ?? 1, 1)) * 100
      }))
    : [
        { symbol: "USDT", pct: 100 }
      ]

  return (
    <div className="kpi-row">
      <div className="kpi-card panel">
        <p className="panel-title">Portfolio Allocation</p>
        <div className="donut-wrap">
          <svg viewBox="0 0 36 36" className="donut">
            {allocation.reduce(
              (acc, slice, i) => {
                const offset = acc.offset
                const dash = slice.pct
                acc.elements.push(
                  <circle
                    key={slice.symbol}
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={["#00e5c3", "#ff4d8d", "#a78bfa", "#60a5fa"][i % 4]}
                    strokeWidth="3"
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={-offset}
                  />
                )
                acc.offset += dash
                return acc
              },
              { offset: 0, elements: [] as JSX.Element[] }
            ).elements}
          </svg>
          <div className="donut-legend">
            {allocation.map((a) => (
              <span key={a.symbol}>{a.symbol} {a.pct.toFixed(0)}%</span>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-card panel">
        <p className="panel-title">Performance</p>
        <div className="perf-chart">
          {equityCurve.length > 1
            ? equityCurve.slice(-30).map((point) => {
                const min = Math.min(...equityCurve.map((p) => p.equity))
                const max = Math.max(...equityCurve.map((p) => p.equity))
                const range = max - min || 1
                const h = ((point.equity - min) / range) * 60 + 30
                return (
                  <span
                    key={point.time}
                    style={{
                      height: `${h}%`,
                      background:
                        point.equity >= equityCurve[0].equity
                          ? "var(--accent-teal)"
                          : "var(--accent-pink)"
                    }}
                  />
                )
              })
            : Array.from({ length: 30 }).map((_, i) => (
                <span
                  key={i}
                  style={{ height: `${40 + Math.sin(i * 0.4) * 20}%`, background: "var(--border)" }}
                />
              ))}
        </div>
        <span className={`kpi-value ${metrics ? (metrics.totalReturn >= 0 ? "positive" : "negative") : (summary?.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"}`}>
          {metrics ? formatPct(metrics.totalReturn) : formatPct(((summary?.unrealizedPnl ?? 0) / Math.max(summary?.balance ?? 1, 1)) * 100)}
        </span>
      </div>

      <div className="kpi-card panel">
        <p className="panel-title">Risk Metrics</p>
        <div className="risk-list">
          <div><span>Sharpe Ratio</span><span>{metrics ? metrics.sharpeRatio.toFixed(2) : "—"}</span></div>
          <div><span>Max Drawdown</span><span>{metrics ? `${metrics.maxDrawdown.toFixed(1)}%` : "—"}</span></div>
          <div><span>Win Rate</span><span>{metrics ? `${metrics.winRate.toFixed(1)}%` : "—"}</span></div>
          <div><span>Profit Factor</span><span>{metrics ? metrics.profitFactor.toFixed(2) : "—"}</span></div>
        </div>
        {!metrics && <p className="kpi-hint">Run a backtest to populate metrics</p>}
      </div>

      <div className="kpi-card panel">
        <p className="panel-title">Algo Status</p>
        <div className="algo-status">
          <div className={`status-ring ${armed ? "running" : "paused"}`}>
            <span>{armed ? "RUN" : "OFF"}</span>
          </div>
          <div className="status-details">
            <div><span className="dot running" /> Running: {armed ? runningSymbols.length : 0}</div>
            <div><span className="dot paused" /> Paused: {armed ? 0 : 1}</div>
            <div><span className="dot error" /> Errors: 0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
