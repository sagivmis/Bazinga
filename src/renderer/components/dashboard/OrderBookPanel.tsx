import { useState } from "react"
import { Tab, Tabs } from "@mui/material"
import { useMarketStore } from "../../stores/marketStore"
import "./order-book.css"

export default function OrderBookPanel() {
  const orderBook = useMarketStore((s) => s.orderBook)
  const [tab, setTab] = useState(0)

  const maxQty = Math.max(
    ...(orderBook?.asks.map((a) => a.quantity) ?? [1]),
    ...(orderBook?.bids.map((b) => b.quantity) ?? [1])
  )

  return (
    <div className="order-book-panel panel">
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ minHeight: 32, borderBottom: "1px solid var(--border)", "& .MuiTab-root": { minHeight: 32, fontSize: 10 } }}
      >
        <Tab label="Order Book" />
        <Tab label="Recent Trades" disabled />
      </Tabs>

      {tab === 0 && orderBook && (
        <div className="order-book">
          <div className="book-side asks">
            {[...orderBook.asks].reverse().slice(0, 8).map((level) => (
              <div key={`a-${level.price}`} className="book-row">
                <div
                  className="book-bar ask-bar"
                  style={{ width: `${(level.quantity / maxQty) * 100}%` }}
                />
                <span className="book-price negative">{level.price.toFixed(2)}</span>
                <span className="book-qty">{level.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <div className="book-mid">Spread</div>
          <div className="book-side bids">
            {orderBook.bids.slice(0, 8).map((level) => (
              <div key={`b-${level.price}`} className="book-row">
                <div
                  className="book-bar bid-bar"
                  style={{ width: `${(level.quantity / maxQty) * 100}%` }}
                />
                <span className="book-price positive">{level.price.toFixed(2)}</span>
                <span className="book-qty">{level.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
