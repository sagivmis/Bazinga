import { useEffect } from "react"
import { useAccountStore } from "../stores/accountStore"
import "./portfolio-page.css"
import { formatUsd, formatPnl } from "../../shared/format"
import "./portfolio-page.css"

export default function PortfolioPage() {
  const { summary, positions, refresh } = useAccountStore()

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 5000)
    return () => clearInterval(id)
  }, [refresh])

  const totalNotional = positions.reduce((s, p) => s + p.size * p.markPrice, 0)

  return (
    <div className="page-content">
      <h1 className="page-title">Portfolio</h1>
      <p className="page-desc">Futures account breakdown.</p>

      <div className="portfolio-grid">
        <div className="panel portfolio-stat">
          <span className="stat-label">Equity</span>
          <span className="stat-value">${formatUsd(summary?.equity ?? 0)}</span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Balance</span>
          <span className="stat-value">${formatUsd(summary?.balance ?? 0)}</span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Unrealized P&amp;L</span>
          <span className={`stat-value ${(summary?.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"}`}>
            {formatPnl(summary?.unrealizedPnl ?? 0)} USDT
          </span>
        </div>
        <div className="panel portfolio-stat">
          <span className="stat-label">Margin Usage</span>
          <span className="stat-value">{(summary?.marginUsagePct ?? 0).toFixed(1)}%</span>
        </div>
      </div>

      <div className="panel portfolio-allocation" style={{ padding: 16, marginTop: 16 }}>
        <p className="panel-title">Asset Breakdown</p>
        {positions.length === 0 ? (
          <p className="muted">No open positions — 100% USDT cash.</p>
        ) : (
          <div className="allocation-bars">
            {positions.map((p) => {
              const notional = p.size * p.markPrice
              const pct = totalNotional > 0 ? (notional / totalNotional) * 100 : 0
              return (
                <div key={p.symbol} className="alloc-row">
                  <span>{p.symbol.replace("USDT", "")}</span>
                  <div className="alloc-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span>{pct.toFixed(1)}%</span>
                  <span className={p.unrealizedPnl >= 0 ? "positive" : "negative"}>
                    {formatPnl(p.unrealizedPnl)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
