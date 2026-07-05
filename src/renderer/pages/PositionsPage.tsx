import PositionsTable from "../components/dashboard/PositionsTable"
import { useAppInit } from "../hooks/useAppInit"

export default function PositionsPage() {
  useAppInit()
  return (
    <div className="page-content">
      <h1 className="page-title">Positions</h1>
      <PositionsTable />
    </div>
  )
}
