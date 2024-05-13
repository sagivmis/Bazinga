import React, { useMemo } from "react"
import "./watchlist-item.css"
import { WatchlistItemType } from "../../../types"
import { Unstable_Popup as Popup } from "@mui/base/Unstable_Popup"
import { Popper, Tooltip } from "@mui/material"
import { useBinanceContext } from "../../../providers/BinanceProvider"
import { getDecimal } from "../../../util"

interface IWatchlistItem {
  item: WatchlistItemType
}
const WatchlistItem = (props: IWatchlistItem) => {
  const { item } = props
  const { markPrices } = useBinanceContext()
  const symbolPrice = markPrices[item.symbol]

  const symbolDecimal = useMemo(() => {
    if (symbolPrice) return Math.max(getDecimal(symbolPrice) / 2, 2)
    else return 0
  }, [symbolPrice])

  return (
    <div className='watchlist-item-container'>
      <Tooltip title='Symbol'>
        <span className='symbol'>{item.symbol}</span>
      </Tooltip>
      <span className='symbol'>
        {(symbolPrice && symbolPrice.toFixed(symbolDecimal)) || "N/A"}
      </span>
    </div>
  )
}

export default WatchlistItem
