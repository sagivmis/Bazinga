import { useEffect } from "react"
import { useOrdersStore } from "../stores/ordersStore"
import { useBacktestStore } from "../stores/backtestStore"
import { formatUsd } from "../../shared/format"
import "./orders-page.css"

export default function HistoryPage() {
  const { trades, load } = useOrdersStore()
  const { history: backtests } = useBacktestStore()

  useEffect(() => {
    void load()
    void useBacktestStore.getState().load()
  }, [load])

  const backtestTrades = backtests.flatMap((bt) =>
    bt.trades.map((t) => ({
      id: `${bt.id}-${t.time}`,
      time: t.time,
      symbol: bt.symbol,
      side: t.side,
      price: t.exitPrice,
      quantity: 0,
      pnl: t.pnl,
      source: "backtest" as const,
      note: bt.strategyId
    }))
  )

  const all = [...trades, ...backtestTrades].sort((a, b) => b.time - a.time).slice(0, 100)

  return (
    <div className="page-content">
      <h1 className="page-title">History</h1>
      <p className="page-desc">Manual, strategy, and backtest trade log.</p>

      <div className="panel history-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Price</th>
              <th>Qty</th>
              <th>P&amp;L</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 ? (
              <tr><td colSpan={7} className="empty">No trades yet</td></tr>
            ) : (
              all.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.time).toLocaleString()}</td>
                  <td>{t.symbol.replace("USDT", "")}</td>
                  <td className={t.side === "BUY" || t.side === "LONG" ? "positive" : "negative"}>{t.side}</td>
                  <td>${formatUsd(t.price)}</td>
                  <td>{t.quantity || "—"}</td>
                  <td className={(t.pnl ?? 0) >= 0 ? "positive" : "negative"}>
                    {t.pnl != null ? formatUsd(t.pnl) : "—"}
                  </td>
                  <td><span className="source-badge">{t.source}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
