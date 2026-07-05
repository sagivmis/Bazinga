import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone"
import SettingsIcon from "@mui/icons-material/Settings"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import { useNavigate } from "react-router-dom"
import { useMarketStore } from "../stores/marketStore"
import { useAccountStore } from "../stores/accountStore"
import { formatUsd, formatPct } from "../../shared/format"
import "./header.css"

const TICKERS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]

export default function Header() {
  const navigate = useNavigate()
  const prices = useMarketStore((s) => s.prices)
  const changePct = useMarketStore((s) => s.changePct)
  const { summary, dayChangePct } = useAccountStore()

  return (
    <header className="app-header">
      <div className="header-tickers">
        <div className="ticker-card portfolio-card panel">
          <span className="ticker-label">TOTAL PORTFOLIO</span>
          <span className="ticker-value">${formatUsd(summary?.equity ?? 0)}</span>
          <span
            className={`ticker-change ${dayChangePct >= 0 ? "positive" : "negative"}`}
            title="Change since session start"
          >
            {formatPct(dayChangePct)}
          </span>
          <div className="mini-sparkline">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{ height: `${30 + Math.sin(i * 0.9) * 15 + 20}%` }} />
            ))}
          </div>
        </div>
        {TICKERS.map((symbol) => {
          const price = prices[symbol]
          const pct = changePct[symbol]
          const label = symbol.replace("USDT", "")
          const hasChange = pct !== undefined && !Number.isNaN(pct)
          return (
            <div key={symbol} className="ticker-card panel">
              <span className="ticker-label">{label}</span>
              <span className="ticker-value">
                {price ? `$${formatUsd(price, label === "BTC" ? 0 : 2)}` : "—"}
              </span>
              <span
                className={`ticker-change ${hasChange ? (pct >= 0 ? "positive" : "negative") : ""}`}
                title="24h change"
              >
                {hasChange ? formatPct(pct) : "—"}
              </span>
            </div>
          )
        })}
      </div>
      <div className="header-actions">
        <button type="button" className="icon-btn" aria-label="Notifications">
          <NotificationsNoneIcon fontSize="small" />
        </button>
        <button type="button" className="icon-btn" aria-label="Settings" onClick={() => navigate("/settings")}>
          <SettingsIcon fontSize="small" />
        </button>
        <button type="button" className="icon-btn" aria-label="Profile">
          <AccountCircleIcon fontSize="small" />
        </button>
      </div>
    </header>
  )
}
