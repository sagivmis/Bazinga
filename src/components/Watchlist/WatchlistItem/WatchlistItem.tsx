import { useMemo } from "react"
import "./watchlist-item.css"
import { WatchlistItemType } from "../../../types"
import { useBinance } from "../../../providers/BinanceProvider"
import { getDecimal } from "../../../util"

interface IWatchlistItem {
  item: WatchlistItemType
}
const WatchlistItem = (props: IWatchlistItem) => {
  const { item } = props
  const { markPrices } = useBinance()
  const symbolPrice = markPrices[item.symbol]

  const symbolDecimal = useMemo(() => {
    if (symbolPrice) return Math.max(getDecimal(symbolPrice) / 2, 2)
    else return 0
  }, [symbolPrice])

  return (
    <div className='watchlist-item-container'>
      <span className='symbol'>{item.symbol}</span>
      <span className='symbol'>
        {(symbolPrice && symbolPrice.toFixed(symbolDecimal)) || "N/A"}
      </span>
    </div>
  )
}

export default WatchlistItem
