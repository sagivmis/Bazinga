import { useEffect } from "react"
import { Button } from "@mui/material"
import { useOrdersStore } from "../stores/ordersStore"
import { formatUsd } from "../../shared/format"
import "./orders-page.css"

export default function OrdersPage() {
  const { open, load, cancel } = useOrdersStore()

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 5000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="page-content">
      <h1 className="page-title">Orders</h1>
      <p className="page-desc">Open orders on Binance Testnet.</p>

      <div className="panel orders-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {open.length === 0 ? (
              <tr><td colSpan={7} className="empty">No open orders</td></tr>
            ) : (
              open.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.symbol}</td>
                  <td className={o.side === "BUY" ? "positive" : "negative"}>{o.side}</td>
                  <td>{o.type}</td>
                  <td>${formatUsd(o.price)}</td>
                  <td>{o.quantity}</td>
                  <td>{o.status}</td>
                  <td>
                    <Button size="small" color="error" onClick={() => void cancel(o.symbol, o.orderId)}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
