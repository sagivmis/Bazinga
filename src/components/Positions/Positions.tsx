import React from "react"
import "./positions.css"
import { useBinanceContext } from "../../providers/BinanceProvider"
import { formatNISAsNumber } from "../../util"
import Position from "./Position/Position"
import { FuturesPosition } from "binance"

const defaultPosition: FuturesPosition = {
  entryPrice: 2500,
  isAutoAddMargin: "false",
  isolatedMargin: "1.23",
  isolatedWallet: "false",
  leverage: 10,
  liquidationPrice: 0.55,
  marginType: "cross",
  markPrice: 2948.46,
  maxNotionalValue: 55,
  notional: 2948.46,
  positionAmt: 1,
  positionSide: "LONG",
  symbol: "ETHUSDT",
  unRealizedProfit: 448.46,
  updateTime: new Date().getTime()
}

const Positions = () => {
  const { openPositions } = useBinanceContext()

  return (
    <div className='positions-container'>
      <div className='open-positions'>
        {[defaultPosition].map((position) => (
          <Position position={position} />
        ))}
      </div>
    </div>
  )
}

export default Positions
