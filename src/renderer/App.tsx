import { Routes, Route, Navigate } from "react-router-dom"
import AppShell from "./layout/AppShell"
import DashboardPage from "./pages/DashboardPage"
import MarketsPage from "./pages/MarketsPage"
import PortfolioPage from "./pages/PortfolioPage"
import AlgoBuilderPage from "./pages/AlgoBuilderPage"
import StrategiesPage from "./pages/StrategiesPage"
import BacktestPage from "./pages/BacktestPage"
import HeatmapLabPage from "./pages/HeatmapLabPage"
import OrdersPage from "./pages/OrdersPage"
import PositionsPage from "./pages/PositionsPage"
import HistoryPage from "./pages/HistoryPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import SettingsPage from "./pages/SettingsPage"

export default function App() {
  return (
    <Routes>
      <Route path="/heatmap-lab" element={<HeatmapLabPage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="markets" element={<MarketsPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="algo-builder" element={<AlgoBuilderPage />} />
        <Route path="strategies" element={<StrategiesPage />} />
        <Route path="backtest" element={<BacktestPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
