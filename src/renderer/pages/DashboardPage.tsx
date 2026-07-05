import { useAppInit } from "../hooks/useAppInit"
import ChartPanel from "../components/dashboard/ChartPanel"
import OrderTicket from "../components/dashboard/OrderTicket"
import OrderBookPanel from "../components/dashboard/OrderBookPanel"
import KpiCards from "../components/dashboard/KpiCards"
import PositionsTable from "../components/dashboard/PositionsTable"
import "./dashboard-page.css"

export default function DashboardPage() {
  useAppInit()

  return (
    <div className="dashboard-page">
      <div className="dashboard-main">
        <ChartPanel />
        <KpiCards />
        <PositionsTable />
      </div>
      <aside className="dashboard-rail">
        <OrderTicket />
        <OrderBookPanel />
      </aside>
    </div>
  )
}
