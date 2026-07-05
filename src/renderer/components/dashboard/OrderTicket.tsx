import { useEffect, useState } from "react"
import { TextField, Tab, Tabs } from "@mui/material"
import { useMarketStore } from "../../stores/marketStore"
import { useAccountStore } from "../../stores/accountStore"
import { useLeverageStore } from "../../stores/leverageStore"
import { OrderLeverageControl } from "../forms/LeverageParamsSection"
import { clampLeverage, quantityFromMargin } from "../../../shared/leverageUtils"
import "./order-ticket.css"

type Side = "BUY" | "SELL"
type OrderType = "LIMIT" | "MARKET" | "STOP"

export default function OrderTicket() {
  const symbol = useMarketStore((s) => s.symbol)
  const prices = useMarketStore((s) => s.prices)
  const summary = useAccountStore((s) => s.summary)
  const price = prices[symbol] ?? 0

  const leverage = useLeverageStore(
    (s) => s.bySymbol[symbol.toUpperCase()] ?? s.defaultLeverage
  )
  const setLeverage = useLeverageStore((s) => s.setLeverage)

  const [side, setSide] = useState<Side>("BUY")
  const [orderType, setOrderType] = useState<OrderType>("LIMIT")
  const [limitPrice, setLimitPrice] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void useLeverageStore.getState().init()
  }, [])

  const effectivePrice = orderType === "MARKET" ? price : parseFloat(limitPrice) || price
  const qty = parseFloat(amount) || 0
  const notional = effectivePrice * qty
  const marginEst = leverage > 0 ? notional / leverage : notional

  const setPct = (pct: number) => {
    const avail = summary?.availableMargin ?? 0
    const margin = (avail * pct) / 100
    if (effectivePrice > 0) {
      setAmount(quantityFromMargin(margin, leverage, effectivePrice).toFixed(4))
    }
  }

  const submit = async () => {
    if (!window.api || qty <= 0) return
    setSubmitting(true)
    try {
      await window.api.orders.submit({
        symbol,
        side,
        type: orderType,
        quantity: qty,
        price: orderType === "LIMIT" ? parseFloat(limitPrice) : undefined,
        leverage: clampLeverage(leverage)
      })
      setAmount("")
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="order-ticket panel">
      <p className="panel-title">Order Entry</p>

      <div className="side-toggle">
        <button
          type="button"
          className={`side-btn buy ${side === "BUY" ? "active" : ""}`}
          onClick={() => setSide("BUY")}
        >
          BUY
        </button>
        <button
          type="button"
          className={`side-btn sell ${side === "SELL" ? "active" : ""}`}
          onClick={() => setSide("SELL")}
        >
          SELL
        </button>
      </div>

      <Tabs
        value={orderType}
        onChange={(_, v) => setOrderType(v)}
        variant="fullWidth"
        sx={{ minHeight: 32, mb: 1, "& .MuiTab-root": { minHeight: 32, fontSize: 11 } }}
      >
        <Tab label="Limit" value="LIMIT" />
        <Tab label="Market" value="MARKET" />
        <Tab label="Stop" value="STOP" />
      </Tabs>

      <OrderLeverageControl
        symbol={symbol}
        leverage={leverage}
        onChange={(n) => setLeverage(symbol, n)}
      />

      {orderType !== "MARKET" && (
        <TextField
          label="Price"
          size="small"
          fullWidth
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder={price.toString()}
          sx={{ mb: 1 }}
        />
      )}

      <TextField
        label="Amount"
        size="small"
        fullWidth
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        sx={{ mb: 1 }}
      />

      <div className="pct-buttons">
        {[25, 50, 75, 100].map((p) => (
          <button key={p} type="button" onClick={() => setPct(p)}>
            {p}%
          </button>
        ))}
      </div>

      <div className="order-meta">
        <span>Notional</span>
        <span>${notional.toFixed(2)}</span>
      </div>
      <div className="order-meta">
        <span>Est. margin</span>
        <span>${marginEst.toFixed(2)}</span>
      </div>
      <div className="order-meta">
        <span>Leverage</span>
        <span>{leverage}x</span>
      </div>
      <div className="order-meta">
        <span>Available</span>
        <span>${(summary?.availableMargin ?? 0).toFixed(2)}</span>
      </div>
      <p className="order-leverage-hint">
        Leverage is local to this session — change default in Settings.
      </p>

      <button
        type="button"
        className={`place-order ${side === "BUY" ? "btn-buy" : "btn-sell"}`}
        onClick={() => void submit()}
        disabled={submitting || qty <= 0}
      >
        PLACE {side} ORDER
      </button>
    </div>
  )
}
