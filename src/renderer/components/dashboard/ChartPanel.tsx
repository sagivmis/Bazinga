import { useEffect, useRef } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts"
import type { KlineInterval } from "binance"
import { useMarketStore } from "../../stores/marketStore"
import "./chart-panel.css"

const TIMEFRAMES: KlineInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"]

export default function ChartPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  const { symbol, interval, candles, setInterval, prices } = useMarketStore()
  const currentPrice = prices[symbol]

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#94a3b8"
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" }
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1e293b" },
      timeScale: { borderColor: "#1e293b", timeVisible: true }
    })

    const candlesSeries = chart.addCandlestickSeries({
      upColor: "#00e5c3",
      downColor: "#ff4d8d",
      borderUpColor: "#00e5c3",
      borderDownColor: "#ff4d8d",
      wickUpColor: "#00e5c3",
      wickDownColor: "#ff4d8d"
    })

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: ""
    })
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })

    chartRef.current = chart
    candleRef.current = candlesSeries
    volumeRef.current = volumeSeries

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !candles.length) return

    candleRef.current.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as import("lightweight-charts").UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }))
    )

    volumeRef.current.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as import("lightweight-charts").UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(0,229,195,0.4)" : "rgba(255,77,141,0.4)"
      }))
    )

    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return (
    <div className="chart-panel panel">
      <div className="chart-toolbar">
        <div className="chart-symbol">
          <span className="symbol-name">{symbol.replace("USDT", "/USDT")}</span>
          {currentPrice && (
            <span className="symbol-price positive">${currentPrice.toLocaleString()}</span>
          )}
        </div>
        <div className="timeframe-pills">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              className={`tf-pill ${interval === tf ? "active" : ""}`}
              onClick={() => setInterval(tf)}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="chart-container" />
    </div>
  )
}
