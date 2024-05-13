import { useCallback, useEffect, useState } from "react"
import { useBinanceContext } from "../../providers/BinanceProvider"
import Watchlist from "../Watchlist"
import "./bali-bot.css"

function BaliBot() {
  return (
    <div className='bali-bot-app'>
      <div className='top-container'>
        <Watchlist />
        <div className='stats-container'></div>
      </div>
      <div className='bottom-container'>
        <div className='trades-container'></div>
        <div className='user-control-container'></div>
      </div>
    </div>
  )
}

export default BaliBot
