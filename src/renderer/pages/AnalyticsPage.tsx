import { useEffect } from "react"
import { useBacktestStore } from "../stores/backtestStore"
import { useOrdersStore } from "../stores/ordersStore"
import { useAccountStore } from "../stores/accountStore"
import { formatPct, formatUsd } from "../../shared/format"

export default function AnalyticsPage() {
  const { latest, history, load } = useBacktestStore()
  const { trades } = useOrdersStore()
  const summary = useAccountStore((s) => s.summary)

  useEffect(() => {
    void load()
    void useOrdersStore.getState().load()
  }, [load])

  const liveTrades = trades.filter((t) => t.source !== "backtest")
  const wins = liveTrades.filter((t) => (t.pnl ?? 0) > 0).length
  const liveWinRate = liveTrades.length ? (wins / liveTrades.length) * 100 : null

  const btMetrics = latest?.metrics

  return (
    <div className="page-content">
      <h1 className="page-title">Analytics</h1>
      <p className="page-desc">Performance summary from live activity and backtests.</p>

      <div className="portfolio-grid" style={{ marginBottom: 20 }}>
        <div className="panel portfolio-stat">
          <span className="stat-label">Account Equity</span>
          <span className="stat-value">${formatUsd(summary?.equity ?? 0)}</span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Live Trades</span>
          <span className="stat-value">{liveTrades.length}</span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Live Win Rate</span>
          <span className="stat-value">{liveWinRate != null ? `${liveWinRate.toFixed(1)}%` : "—"}</span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Backtests Run</span>
          <span className="stat-value">{history.length}</span>
        </div>
      </div>

      {btMetrics && (
        <div className="panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Latest Backtest — {latest?.symbol}</h3>
          <div className="portfolio-grid">
            <div><span className="stat-label">Return</span><br /><strong className={btMetrics.totalReturn >= 0 ? "positive" : "negative"}>{formatPct(btMetrics.totalReturn)}</strong></div>
            <div><span className="stat-label">Win Rate</span><br /><strong>{btMetrics.winRate.toFixed(1)}%</strong></div>
            <div><span className="stat-label">Sharpe</span><br /><strong>{btMetrics.sharpeRatio.toFixed(2)}</strong></div>
            <div><span className="stat-label">Max DD</span><br /><strong className="negative">{btMetrics.maxDrawdown.toFixed(1)}%</strong></div>
          </div>
        </div>
      )}

      {!btMetrics && (
        <div className="panel placeholder-card">Run a backtest to see strategy analytics.</div>
      )}
    </div>
  )
}
