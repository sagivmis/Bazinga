import { useCallback, useEffect, useState } from "react"
import { useBinanceContext } from "../../providers/BinanceProvider"
import Watchlist from "../Watchlist"
import "./bali-bot.css"

function BaliBot() {
  return (
    <div className='bali-bot-app'>
      <div className='top-container'>
        {/* get all contracts and show in the list */}
        <Watchlist />
        <div className='stats-container'></div>
      </div>
      <div className='bottom-container'>
        {/* get all contracts and show in the list */}
        <div className='trades-container'></div>
      </div>
      {/* <div className="" */}
    </div>
  )
}

export default BaliBot
