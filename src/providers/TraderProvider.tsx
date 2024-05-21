import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { FormattedMessageData, ProviderProps, StreamKline } from "../types"
import { Kline, numberInString } from "binance"
import { useBinance } from "./BinanceProvider"
import { useGeneralContext } from "./GeneralProvider"
import { ema, vwap, vwma } from "indicatorts"
import { MS, formatNISAsNumber } from "../util"

interface ITraderContext {}

const defaultGeneralContext: ITraderContext = {}

interface ParsedKline {
  timestamp: number
  date: string
  open: numberInString
  close: numberInString
  high: numberInString
  low: numberInString
  volume: numberInString
  ema: number
  vwap: number
  vwma: number
  complete: boolean
}

const TraderContext = createContext<ITraderContext>(defaultGeneralContext)

// * strategy : ****** if a symbol has an open position and recieves
// *                   signal of opposite direction - close it ******
// * LONG:
// * when ema crosses under vwma and (abs(close - vwma) / close) * 100 ) < 0.5
// * SHORT:
// * when vwma crosses under ema and (abs(close - vwma) / close) * 100 ) < 0.5
export const TraderProvider: React.FC<ProviderProps> = ({ children }) => {
  const data = useRef<Record<string, Kline[]>>({})
  const [strategyData, setStrategyData] = useState<
    Record<string, ParsedKline[]>
  >({})
  const { watchlist, market } = useGeneralContext()
  const {
    wsClient,
    getKlines,
    subscribeKlines,
    createOrder,
    openPositions,
    markPrices
  } = useBinance()

  const currentKline = useRef<Kline>()
  const currentEndTime = useRef<number>()
  const [shouldParseData, setShouldParseData] = useState<boolean>(false)
  const isFinal = useRef<Record<string, boolean>>({})

  const handlePrepareData = useCallback(() => {
    const parsed: Record<string, ParsedKline[]> = {}

    Object.keys(data.current).forEach((symbol) => {
      const closes = data.current[symbol].map((kline) =>
        formatNISAsNumber(kline[4])
      )
      const volumes = data.current[symbol].map((kline) =>
        formatNISAsNumber(kline[5])
      )

      const emas = ema(closes, { period: 100 })
      const vwaps = vwap(closes, volumes, { period: 20 })
      const vwmas = vwma(closes, volumes, { period: 20 })
      const parsedData: ParsedKline[] = data.current[symbol].map(
        (kline, index) => {
          return {
            timestamp: kline[0],
            date: new Date(kline[0]).toISOString(),
            open: kline[1],
            high: kline[2],
            low: kline[3],
            close: kline[4],
            volume: kline[5],
            ema: emas[index],
            vwap: vwaps[index],
            vwma: vwmas[index],
            complete: new Date().getTime() - kline[0] <= MS["1m"]
          }
        }
      )
      parsed[symbol] = parsedData
    })
    console.log("finished parsing data")

    setStrategyData(parsed)
  }, [data])

  useEffect(() => {
    watchlist.forEach(async (contract) => {
      const contractKlines = await getKlines({
        symbol: contract.symbol,
        interval: "1m",
        limit: 99
      })
      data.current = { ...data.current, [contract.symbol]: contractKlines }
    })
  }, [getKlines, watchlist])

  useEffect(() => {
    watchlist.forEach((contract) => {
      setTimeout(() => subscribeKlines(contract.symbol, "1m"), 0)
    })
  }, [subscribeKlines, watchlist])

  const parseMessageKline = (mKline: StreamKline) => {
    const kline: Kline = [
      mKline.startTime,
      mKline.open,
      mKline.high,
      mKline.low,
      mKline.close,
      mKline.volume,
      mKline.endTime,
      mKline.quoteVolume,
      mKline.trades,
      mKline.volumeActive,
      mKline.quoteVolumeActive,
      mKline.ignored
    ]

    return kline
  }

  const handleInsertNewKlineCandle = (
    symbol: string,
    kline: Kline,
    endTime: number
  ) => {
    if (data.current[symbol][data.current[symbol].length - 1][0] === kline[0])
      return

    console.log("*** DATA ***")
    console.log(data.current)

    const newData = data.current
    if (!newData[symbol]) newData[symbol] = []

    newData[symbol].push(kline)

    console.log("*** NEW DATA ***")
    console.log(newData)

    data.current = newData
    currentEndTime.current = endTime
  }

  const entryPrice = useRef<
    Record<string, { price: number; side: "long" | "short" }>
  >({})
  const cumProfits = useRef(0)
  const currentPrice = useRef<Record<string, number>>({})
  // const positionSide

  const reportTrade = useCallback(
    (side: "long" | "short", symbol: string, quantity: number) => {
      const first =
        side === "long" ? entryPrice.current[symbol].price : markPrices[symbol]
      const second =
        side === "long" ? markPrices[symbol] : entryPrice.current[symbol].price

      cumProfits.current += (first - second) * quantity

      console.log(`
    ********* FINISHED TRADE *********
        +/-:  ${(first - second) * quantity}
        cum.: ${cumProfits.current}
        side: ${side}
    `)
    },
    [markPrices]
  )

  const closePosition = useCallback((symbol: string) => {
    delete entryPrice.current[symbol]
  }, [])

  const newPosition = useCallback(
    (side: "long" | "short", symbol: string, quantity: number) => {
      const isPositionOpen = entryPrice.current[symbol]
      const isSameSide =
        isPositionOpen && side === entryPrice.current[symbol].side

      if (isPositionOpen) {
        if (!isSameSide) {
          reportTrade(side, symbol, quantity)
          closePosition(symbol)

          return
        }
      } else {
        console.log(`
        ********* INIT TRADE *********
            cum.: ${cumProfits.current}
        `)
        entryPrice.current[symbol] = { price: markPrices[symbol], side }
      }
    },
    [closePosition, markPrices, reportTrade]
  )

  const checkSignal = useCallback(() => {
    Object.keys(data.current).forEach((symbol) => {
      const len = strategyData[symbol] && strategyData[symbol].length
      if (strategyData[symbol] && !strategyData[symbol][len - 1].complete) {
        const lastCandle = strategyData[symbol][len - 2]
        const prevCandle = strategyData[symbol][len - 3]

        const crossoverVWMA =
          lastCandle.vwma > lastCandle.ema && prevCandle.vwma <= prevCandle.ema
        const crossunderVWMA =
          lastCandle.vwma < lastCandle.ema && prevCandle.vwma >= prevCandle.ema
        const close = formatNISAsNumber(lastCandle.close)
        const priceRangeThreshold = 0.5
        const priceThreshold =
          (Math.abs(close - lastCandle.vwma) / close) * 100 <
          priceRangeThreshold

        if (crossoverVWMA && priceThreshold) {
          // open long / close short
          console.log(`**** BUY ORDER ****`)
          const isSymbolPositionOpen = openPositions.every(
            (position) => position.symbol !== symbol
          )
          newPosition("long", symbol, 1000 / markPrices[symbol])
        } else if (crossunderVWMA && priceThreshold) {
          console.log(`**** SELL ORDER ****`)
          newPosition("short", symbol, 1000 / markPrices[symbol])
          //open short / close long
        }
      }
    })
  }, [markPrices, newPosition, openPositions, strategyData])

  useEffect(() => {
    //@ts-expect-error wrong package type
    wsClient.on("formattedMessage", (message: FormattedMessageData) => {
      if (message.eventType == "kline" && message.kline) {
        const symbol = message.symbol

        if (isFinal.current) {
          currentEndTime.current = message.kline.endTime
          isFinal.current[symbol] = false
        }

        const mKline = message.kline
        const endTime = message.kline.endTime
        const kline: Kline = parseMessageKline(mKline)

        if (message.kline.final && isFinal.current[symbol] === false) {
          console.log("******* FINAL *******")

          isFinal.current[symbol] = true
          handleInsertNewKlineCandle(symbol, kline, endTime)
          setShouldParseData(true)
        } else if (
          currentEndTime.current &&
          message.kline.endTime !== currentEndTime.current &&
          currentKline.current &&
          !isFinal.current[symbol]
        ) {
          console.log("******* RESTORE *******")

          handleInsertNewKlineCandle(symbol, currentKline.current, endTime)
          setShouldParseData(true)
        }

        currentKline.current = kline

        // setData()
      }
    })
  }, [checkSignal, data, wsClient])

  useEffect(() => {
    if (shouldParseData) {
      console.log("parsing new data")
      handlePrepareData()
      setShouldParseData(false)
    }
  }, [handlePrepareData, shouldParseData])

  useEffect(() => {
    console.log("strategy", strategyData)
    checkSignal()
  }, [checkSignal, strategyData])

  useEffect(() => {
    console.log("data", data.current)
  }, [data, strategyData])
  const providerMemo = useMemo<ITraderContext>(() => {
    return {}
  }, [])
  return (
    <TraderContext.Provider value={providerMemo}>
      {children}
    </TraderContext.Provider>
  )
}

export const useTrader = () => useContext(TraderContext)
export default TraderProvider
