import React from "react"
import "./watchlist-item.css"
import { WatchlistItemType } from "../../../types"
import { Unstable_Popup as Popup } from "@mui/base/Unstable_Popup"
import { Popper, Tooltip } from "@mui/material"

interface IWatchlistItem {
  item: WatchlistItemType
}
const WatchlistItem = (props: IWatchlistItem) => {
  const { item } = props

  return (
    <div className='watchlist-item-container'>
      <Tooltip title='Symbol'>
        <span className='symbol'>{item.symbol}</span>
      </Tooltip>
      <Tooltip title='Bid'>
        <span className='symbol'>{item.bid || "N/A"}</span>
      </Tooltip>
      <Tooltip title='Ask'>
        <span className='symbol'>{item.ask || "N/A"}</span>
      </Tooltip>
    </div>
  )
}

export default WatchlistItem
