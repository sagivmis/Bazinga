import { FuturesPosition } from "binance"
import { useMemo } from "react"
import {
  formatNISAsNumber,
  formatPnl,
  formatPositionValue,
  getDecimal
} from "../../../util"
import "./position.css"
import { useBinance } from "../../../providers/BinanceProvider"
import { useGeneralContext } from "../../../providers/GeneralProvider"

interface IPosition {
  position: FuturesPosition
}

const Position = (props: IPosition) => {
  const { position } = props

  const margin = useMemo(
    () =>
      (formatNISAsNumber(position.entryPrice) /
        formatNISAsNumber(position.leverage)) *
      formatNISAsNumber(position.positionAmt),
    [position.entryPrice, position.leverage, position.positionAmt]
  )
  const { markPrices } = useBinance()
  const { handleAddNewWatchlistItem } = useGeneralContext()

  const symbolPrice = markPrices[position.symbol]
  const symbolDecimals = useMemo(() => {
    if (symbolPrice) return Math.max(getDecimal(symbolPrice) / 2, 3)
    else return 0
  }, [symbolPrice])

  const roi = useMemo(
    () =>
      (1 -
        formatNISAsNumber(position.entryPrice) /
          formatNISAsNumber(position.markPrice)) *
      formatNISAsNumber(position.leverage) *
      100,
    [position.entryPrice, position.leverage, position.markPrice]
  )

  const handleAddToWatchlist = () => {
    handleAddNewWatchlistItem(position.symbol)
  }

  return (
    <div className='position-row' onDoubleClick={handleAddToWatchlist}>
      <span className='position-symbol position-column'>{position.symbol}</span>
      <span className='position-entry-price position-column'>
        {formatPositionValue(position.entryPrice, symbolDecimals)}
      </span>
      <span className='position-quantity position-column'>
        {position.positionAmt}
      </span>
      <span className='position-leverage position-column'>
        {position.leverage}x
      </span>
      <span className='position-mark-price position-column'>
        {formatPositionValue(position.markPrice)}
      </span>
      <span className='position-pnl position-column'>
        {formatPnl(position.unRealizedProfit)}
      </span>
      <span className='position-roi position-column'>{formatPnl(roi)}%</span>
      <span className='position-margin position-column'>
        {formatPositionValue(margin)}
      </span>
    </div>
  )
}

export default Position
