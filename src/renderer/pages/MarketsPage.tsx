import { useEffect } from "react"
import { TextField, IconButton } from "@mui/material"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import { useWatchlistStore } from "../stores/watchlistStore"
import "./markets-page.css"
import { formatPct, formatUsd } from "../../shared/format"
import "./markets-page.css"

export default function MarketsPage() {
  const { tickers, symbols, search, setSearch, load, add, remove, selectSymbol } =
    useWatchlistStore()

  useEffect(() => {
    void load()
  }, [load])

  const filtered = tickers.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) &&
      !t.symbol.includes("_")
  )

  return (
    <div className="page-content markets-page">
      <h1 className="page-title">Markets</h1>
      <p className="page-desc">USDT-M perpetual futures — click a row to chart, star to watchlist.</p>

      <TextField
        placeholder="Search symbol..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
      />

      <div className="panel markets-table-wrap">
        <table className="markets-table">
          <thead>
            <tr>
              <th />
              <th>Symbol</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Volume (USDT)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((t) => {
              const watched = symbols.includes(t.symbol)
              return (
                <tr key={t.symbol} onClick={() => selectSymbol(t.symbol)} className="market-row">
                  <td onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => void (watched ? remove(t.symbol) : add(t.symbol))}
                      sx={{ color: watched ? "var(--accent-teal)" : "var(--text-muted)" }}
                    >
                      {watched ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                  </td>
                  <td className="symbol-cell">{t.symbol.replace("USDT", "/USDT")}</td>
                  <td>${formatUsd(t.price, t.price > 100 ? 2 : 4)}</td>
                  <td className={t.changePct >= 0 ? "positive" : "negative"}>
                    {formatPct(t.changePct)}
                  </td>
                  <td className="muted">{formatUsd(t.volume, 0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
