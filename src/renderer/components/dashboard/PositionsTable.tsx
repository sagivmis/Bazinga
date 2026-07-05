import { useAccountStore } from "../../stores/accountStore"
import { formatPnl } from "../../../shared/format"
import "./positions-table.css"

export default function PositionsTable() {
  const positions = useAccountStore((s) => s.positions)

  return (
    <div className="positions-table panel">
      <p className="panel-title">Open Positions</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pair</th>
              <th>Side</th>
              <th>Size</th>
              <th>Entry</th>
              <th>Mark</th>
              <th>P&amp;L</th>
              <th>P&amp;L %</th>
              <th>SL</th>
              <th>TP</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">No open positions</td>
              </tr>
            ) : (
              positions.map((p) => {
                const pnlPct =
                  p.entryPrice > 0
                    ? ((p.markPrice - p.entryPrice) / p.entryPrice) *
                      100 *
                      (p.side === "LONG" ? 1 : -1) *
                      p.leverage
                    : 0
                return (
                  <tr key={p.symbol}>
                    <td className="pair">{p.symbol.replace("USDT", "")}</td>
                    <td className={p.side === "LONG" ? "positive" : "negative"}>{p.side}</td>
                    <td>{p.size.toFixed(4)}</td>
                    <td>{p.entryPrice.toFixed(2)}</td>
                    <td>{p.markPrice.toFixed(2)}</td>
                    <td className={p.unrealizedPnl >= 0 ? "positive" : "negative"}>
                      {formatPnl(p.unrealizedPnl)}
                    </td>
                    <td className={pnlPct >= 0 ? "positive" : "negative"}>
                      {formatPnl(pnlPct)}%
                    </td>
                    <td className="muted">—</td>
                    <td className="muted">—</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
