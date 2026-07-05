import { useAccountStore } from "../stores/accountStore"
import { useConnectionStore } from "../stores/connectionStore"
import { formatUsd, formatPnl } from "../../shared/format"
import "./footer.css"

export default function Footer() {
  const summary = useAccountStore((s) => s.summary)
  const { connected, latencyMs, useTestnet } = useConnectionStore()

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        <span>{connected ? "Connected" : "Disconnected"}</span>
        <span className="footer-divider">|</span>
        <span>{latencyMs}ms</span>
        {useTestnet && <span className="testnet-badge">TESTNET</span>}
      </div>
      <div className="footer-stats">
        <span>Equity: <strong>${formatUsd(summary?.equity ?? 0)}</strong></span>
        <span>Available: <strong>${formatUsd(summary?.availableMargin ?? 0)}</strong></span>
        <span className="margin-bar-wrap">
          Margin
          <span className="margin-bar">
            <span style={{ width: `${Math.min(summary?.marginUsagePct ?? 0, 100)}%` }} />
          </span>
          {(summary?.marginUsagePct ?? 0).toFixed(1)}%
        </span>
        <span className={(summary?.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"}>
          Unrealized: {formatPnl(summary?.unrealizedPnl ?? 0)} USDT
        </span>
      </div>
    </footer>
  )
}
