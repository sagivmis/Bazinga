/* eslint-disable react-refresh/only-export-components */
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import { FormattedMessageData, Prices, ProviderProps } from "../types"
import {
  BasicSymbolParam,
  CancelAllOpenOrdersResult,
  CancelFuturesOrderResult,
  FuturesAccountBalance,
  FuturesOrderBook,
  FuturesPosition,
  FuturesSymbolOrderBookTicker,
  Kline,
  KlineInterval,
  KlinesParams,
  MainClient,
  MarkPrice,
  NewFuturesOrderParams,
  NewOrderError,
  NewOrderResult,
  OrderBookParams,
  SetLeverageResult,
  USDMClient,
  WebsocketClient,
  numberInString
} from "binance"
import moment from "moment"
import { useGeneralContext } from "./GeneralProvider"
import { formatNISAsNumber, live_websocket_url } from "../util"

interface IBinanceContext {
  wsClient: WebsocketClient
  mainClient: MainClient
  usdmClient: USDMClient
  openPositions: FuturesPosition[]
  isLiveFeed: boolean
  setIsLiveFeed: Dispatch<SetStateAction<boolean>>
  pnl: number
  markPrices: Prices
  setLeverage: (leverage: number, symbol: string) => Promise<SetLeverageResult>
  getPositions: () => Promise<FuturesPosition[]>
  getPosition: (symbol: string) => Promise<FuturesPosition[]>
  cancelAllOrdersFor: (symbol: string) => Promise<CancelAllOpenOrdersResult>
  cancelOrder: (
    symbol: string,
    orderId?: number
  ) => Promise<CancelFuturesOrderResult>
  createOrder: (
    params: NewFuturesOrderParams<number>
  ) => Promise<NewOrderResult>
  submitMultipleOrders: (
    params: NewFuturesOrderParams<string>[]
  ) => Promise<(NewOrderResult | NewOrderError)[]>
  getPrice: (
    params?: Partial<BasicSymbolParam>
  ) => Promise<FuturesSymbolOrderBookTicker | FuturesSymbolOrderBookTicker[]>
  getKlines: (params: KlinesParams) => Promise<Kline[]>
  getMarkPrice: (
    params?: Partial<BasicSymbolParam>
  ) => Promise<MarkPrice | MarkPrice[]>
  getOrderBook: (params: OrderBookParams) => Promise<FuturesOrderBook>
  getServerTime: () => Promise<number>
  ping: () => Promise<NonNullable<unknown>>
  getAllContracts: () => Promise<string[]>
  getBalances: () => Promise<FuturesAccountBalance[]>
  futuresUsdtBalance: numberInString
  subscribeKlines: (symbol: string, interval: KlineInterval) => void
}
const defaultBinanceContext: IBinanceContext = {
  subscribeKlines: () => {},
  wsClient: new WebsocketClient({}),
  mainClient: new MainClient(),
  usdmClient: new USDMClient(),
  openPositions: [],
  isLiveFeed: true,
  setIsLiveFeed: () => true,
  pnl: 0,
  markPrices: {},
  futuresUsdtBalance: 0,
  getBalances: async () => {
    return {} as FuturesAccountBalance[]
  },
  setLeverage: async () => {
    return { leverage: 0, maxNotionalValue: 0, symbol: "" }
  },
  cancelAllOrdersFor: async () => {
    return { code: 200, msg: "success" }
  },
  cancelOrder: async () => {
    return {} as CancelFuturesOrderResult
  },
  getPositions: async () => {
    return {} as FuturesPosition[]
  },
  getPosition: async () => {
    return {} as FuturesPosition[]
  },
  createOrder: async () => {
    return {} as NewOrderResult
  },
  submitMultipleOrders: async () => {
    return {} as NewOrderResult[]
  },
  getPrice: async () => {
    return {} as FuturesSymbolOrderBookTicker
  },
  getKlines: async () => {
    return {} as Kline[]
  },
  getMarkPrice: async () => {
    return {} as MarkPrice
  },
  getOrderBook: async () => {
    return {} as FuturesOrderBook
  },
  getServerTime: async () => {
    return 5
  },
  ping: async () => {
    return {}
  },
  getAllContracts: async () => [""]
}

const BinanceContext = createContext<IBinanceContext>(defaultBinanceContext)

const api_key = process.env.API_KEY
const api_secret = process.env.API_SECRET

export const BinanceProvider: React.FC<ProviderProps> = ({ children }) => {
  const { watchlist, market } = useGeneralContext()
  const [pnl, setPnl] = useState(0)
  const [prices, setPrices] = useState<Prices>({})
  const [isLiveFeed, setIsLiveFeed] = useState(true)
  const [futuresUsdtBalance, setFuturesUsdtBalance] =
    useState<numberInString>(0)
  const [websocket_url] = useState(live_websocket_url)
  const [openPositions, setOpenPositions] = useState<FuturesPosition[]>([])
  //#region CLIENTS

  const mainClient = useMemo(() => new MainClient({ api_key, api_secret }), [])

  const usdmClient = useMemo(
    () =>
      new USDMClient({
        // baseUrl: testnet_url,
        api_key,
        api_secret
      }),
    []
  )

  const wsClient = useMemo(
    () =>
      new WebsocketClient({
        wsUrl: websocket_url,
        api_key,
        api_secret,
        beautify: true
      }),
    [websocket_url]
  )

  //#endregion

  //#region FUTURES METHODS
  const subscribeKlines = useCallback(
    (symbol: string, interval: KlineInterval) => {
      wsClient.subscribeKlines(symbol, interval, market)
    },
    [market, wsClient]
  )

  const ping = useCallback(async () => {
    const response = await usdmClient.testConnectivity()
    return response
  }, [usdmClient])

  const getBalances = useCallback(async () => {
    const response = await usdmClient.getBalance()
    return response
  }, [usdmClient])

  const setLeverage = useCallback(
    async (leverage: number, symbol: string) => {
      const response = await usdmClient.setLeverage({
        leverage: leverage,
        symbol
      })
      return response
    },
    [usdmClient]
  )

  const getPositions = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await usdmClient.getPositions(params)
      return response
    },
    [usdmClient]
  )

  const getPosition = useCallback(
    async (symbol: string) => {
      const response = await usdmClient.getPositions({ symbol })
      return response
    },
    [usdmClient]
  )

  const cancelAllOrdersFor = useCallback(
    async (symbol: string) => {
      const response = await usdmClient.cancelAllOpenOrders({ symbol })
      return response
    },
    [usdmClient]
  )

  const cancelOrder = useCallback(
    async (symbol: string, orderId?: number) => {
      const response = await usdmClient.cancelOrder({ symbol, orderId })
      return response
    },
    [usdmClient]
  )

  /**
   * Provide only `side`, `type` and `symbol` for market default size position
   */
  const createOrder = useCallback(
    async (params: NewFuturesOrderParams<number>) => {
      const response = await usdmClient.submitNewOrder(params)
      return response
    },
    [usdmClient]
  )

  /**
   * Warning: max 5 orders at a time! This method does not throw, instead it returns individual errors in the response array if any orders were rejected.
   *
   * Known issue: `quantity` and `price` should be sent as strings
   */
  const submitMultipleOrders = useCallback(
    async (params: NewFuturesOrderParams<string>[]) => {
      const response = await usdmClient.submitMultipleOrders(params)
      return response
    },
    [usdmClient]
  )

  const getPrice = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await usdmClient.getSymbolOrderBookTicker(params)

      return response
    },
    [usdmClient]
  )

  /**
   * default limit is 1000
   */
  const getKlines = useCallback(
    async (params: KlinesParams) => {
      const response = await usdmClient.getKlines({ limit: 1000, ...params })
      // mainClient.getKlines(params)
      return response
    },
    [usdmClient]
  )

  const getMarkPrice = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await usdmClient.getMarkPrice(params)

      return response
    },
    [usdmClient]
  )
  const getOrderBook = useCallback(
    async (params: OrderBookParams) => {
      const response = await usdmClient.getOrderBook({ limit: 1000, ...params })

      return response
    },
    [usdmClient]
  )

  const getServerTime = useCallback(async () => {
    const response = await usdmClient.getServerTime()

    return response
  }, [usdmClient])

  const getAllContracts = useCallback(async () => {
    const response = (await getMarkPrice()) as MarkPrice[]
    const res = response.map((row) => row.symbol)
    return res
  }, [getMarkPrice])

  //#endregion

  useEffect(() => {
    wsClient.on("open", () => {
      console.log(
        `Connection to WebsocketClient initiated @${moment(new Date()).format(
          "D MMM, YYYY, h:mm:ss a"
        )}`
      )
    })

    wsClient.on("reconnecting", (data) => {
      console.log(`Reconnecting to ${data.wsKey} `)
    })

    wsClient.on("reconnected", (data) => {
      console.log(`Reconnected to ${data.wsKey}`)
    })

    //@ts-expect-error wrong package type
    wsClient.on("formattedMessage", (data: FormattedMessageData) => {
      // console.log("formattedMessage: ", data)
      if (data.eventType == "markPriceUpdate") {
        setPrices((prevPrices) => {
          if (data.markPrice) {
            return { ...prevPrices, [data.symbol]: data.markPrice }
          }
          return { ...prevPrices }
        })
      }
    })

    wsClient.on("reply", (data) => {
      console.log("log reply: ", JSON.stringify(data, null, 2))
    })

    wsClient.on("error", (data) => {
      console.log("ws saw error ", data?.wsKey)
    })
  }, [wsClient])

  useEffect(() => {
    if (isLiveFeed)
      watchlist.forEach((pair) => {
        wsClient.subscribeMarkPrice(pair.symbol, "usdm")
      })
    else {
      wsClient.closeAll()
    }
  }, [isLiveFeed, watchlist, wsClient])

  const handleFetchBalance = useCallback(async () => {
    const res = await getBalances()
    const usdt = res.find((balance) => balance.asset === "USDT")
    if (usdt) setFuturesUsdtBalance(usdt.balance)
  }, [getBalances])

  const handleFetchPnl = useCallback(async () => {
    const res = await usdmClient.getPositions()
    const newPnl = res.reduce(
      (acc, val) => acc + parseFloat(val.unRealizedProfit.toString()),
      0
    )
    setPnl(newPnl)
  }, [usdmClient])

  const handleFetchOpenPositions = useCallback(async () => {
    const res = await usdmClient.getPositions()
    const positions = res.filter(
      (pos) => formatNISAsNumber(pos.positionAmt) !== 0
    )
    setOpenPositions(positions)
  }, [usdmClient])

  useEffect(() => {
    handleFetchBalance()
    handleFetchPnl()
    handleFetchOpenPositions()
    let balanceInterval: NodeJS.Timeout | null = null
    let pnlInterval: NodeJS.Timeout | null = null
    let positionsInterval: NodeJS.Timeout | null = null
    if (isLiveFeed) {
      balanceInterval = setInterval(() => handleFetchBalance(), 5000)
      pnlInterval = setInterval(() => handleFetchPnl(), 5000)
      positionsInterval = setInterval(() => handleFetchOpenPositions(), 5000)
      positionsInterval = setInterval(() => handleFetchOpenPositions(), 5000)
    } else {
      if (balanceInterval) clearInterval(balanceInterval)
      if (pnlInterval) clearInterval(pnlInterval)
      if (positionsInterval) clearInterval(positionsInterval)
    }
    return () => {
      balanceInterval && clearInterval(balanceInterval)
      pnlInterval && clearInterval(pnlInterval)
      positionsInterval && clearInterval(positionsInterval)
    }
  }, [handleFetchBalance, handleFetchOpenPositions, handleFetchPnl, isLiveFeed])

  const providerMemo = useMemo<IBinanceContext>(
    () => ({
      wsClient,
      subscribeKlines,
      mainClient,
      openPositions,
      pnl,
      futuresUsdtBalance,
      usdmClient,
      getAllContracts,
      getServerTime,
      getBalances,
      cancelAllOrdersFor,
      cancelOrder,
      createOrder,
      getKlines,
      isLiveFeed,
      setIsLiveFeed,
      getMarkPrice,
      getOrderBook,
      getPosition,
      getPositions,
      getPrice,
      setLeverage,
      submitMultipleOrders,
      ping,
      markPrices: prices
    }),
    [
      wsClient,
      subscribeKlines,
      mainClient,
      openPositions,
      pnl,
      futuresUsdtBalance,
      usdmClient,
      getAllContracts,
      getServerTime,
      getBalances,
      cancelAllOrdersFor,
      cancelOrder,
      createOrder,
      getKlines,
      isLiveFeed,
      getMarkPrice,
      getOrderBook,
      getPosition,
      getPositions,
      getPrice,
      setLeverage,
      submitMultipleOrders,
      ping,
      prices
    ]
  )

  return (
    <BinanceContext.Provider value={providerMemo}>
      {children}
    </BinanceContext.Provider>
  )
}

export const useBinance = () => useContext(BinanceContext)
export default BinanceProvider
