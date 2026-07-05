import { NavLink } from "react-router-dom"
import DashboardIcon from "@mui/icons-material/Dashboard"
import ShowChartIcon from "@mui/icons-material/ShowChart"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import BuildIcon from "@mui/icons-material/Build"
import PsychologyIcon from "@mui/icons-material/Psychology"
import HistoryEduIcon from "@mui/icons-material/HistoryEdu"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import TimelineIcon from "@mui/icons-material/Timeline"
import AnalyticsIcon from "@mui/icons-material/Analytics"
import SettingsIcon from "@mui/icons-material/Settings"
import PauseCircleIcon from "@mui/icons-material/PauseCircle"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import { useEngineStore } from "../stores/engineStore"
import { useConnectionStore } from "../stores/connectionStore"
import "./sidebar.css"

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/markets", label: "Markets", icon: ShowChartIcon },
  { to: "/portfolio", label: "Portfolio", icon: AccountBalanceWalletIcon },
  { to: "/algo-builder", label: "Algo Builder", icon: BuildIcon },
  { to: "/strategies", label: "Strategies", icon: PsychologyIcon },
  { to: "/backtest", label: "Backtest", icon: HistoryEduIcon },
  { to: "/orders", label: "Orders", icon: ReceiptLongIcon },
  { to: "/positions", label: "Positions", icon: TrendingUpIcon },
  { to: "/history", label: "History", icon: TimelineIcon },
  { to: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon }
]

export default function Sidebar() {
  const { armed, toggleEngine, error } = useEngineStore()
  const { connected, latencyMs } = useConnectionStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">◆</span>
        <span className="brand-name">BAZINGA</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon fontSize="small" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="algo-engine-widget panel">
        <p className="panel-title">Algo Engine</p>
        <div className="engine-wave">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="wave-bar"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 15 + (armed ? 10 : 0)}px`,
                opacity: armed ? 1 : 0.4
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className={`engine-toggle ${armed ? "armed" : ""}`}
          onClick={() => void toggleEngine()}
        >
          {armed ? <PauseCircleIcon /> : <PlayCircleIcon />}
          {armed ? "PAUSE" : "RUN"}
        </button>
        {error && (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--accent-red, #f44336)" }}>
            {error}
          </p>
        )}
      </div>

      <div className="sidebar-status">
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        <span>{connected ? "CONNECTED" : "DISCONNECTED"}</span>
        <span className="latency">{latencyMs}ms</span>
      </div>
    </aside>
  )
}
