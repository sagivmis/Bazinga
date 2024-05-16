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
import { Prices, ProviderProps } from "../types"
import {
  BasicSymbolParam,
  CancelAllOpenOrdersResult,
  CancelFuturesOrderResult,
  FuturesAccountBalance,
  FuturesOrderBook,
  FuturesPosition,
  FuturesSymbolOrderBookTicker,
  Kline,
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

const api_key =
  "iob6RmsJ82KbcVoQyCa1tWQIIRsplmkU0afLUNYAuPKEPNXiPcyUCR2vb1A4gvdt"
const secret_key =
  "kyQBGvrDpluL5CbfwxsgPiSpet7ffgxYotVPUr2eCLl6Qdc3cMzvNDNSIfzaBF8v"

interface IBinanceContext {
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
}
const defaultBinanceContext: IBinanceContext = {
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

export const BinanceProvider: React.FC<ProviderProps> = ({ children }) => {
  const { watchlist } = useGeneralContext()
  const [pnl, setPnl] = useState(0)
  const [prices, setPrices] = useState<Prices>({})
  const [isLiveFeed, setIsLiveFeed] = useState(true)
  const [futuresUsdtBalance, setFuturesUsdtBalance] =
    useState<numberInString>(0)
  const [websocket_url] = useState(live_websocket_url)
  const [openPositions, setOpenPositions] = useState<FuturesPosition[]>([])
  //#region CLIENTS

  const mainClient = useMemo(
    () => new MainClient({ api_key, api_secret: secret_key }),
    []
  )
  const usdmClient = useMemo(
    () =>
      new USDMClient({
        // baseUrl: testnet_url,
        api_key,
        api_secret: secret_key
      }),
    []
  )

  const ws = useMemo(
    () =>
      new WebsocketClient({
        wsUrl: websocket_url,
        api_key,
        api_secret: secret_key,
        beautify: true
      }),
    [websocket_url]
  )
  //#endregion

  //#region METHODS
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

  const getKlines = useCallback(
    async (params: KlinesParams) => {
      const response = await usdmClient.getKlines(params)

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
    ws.on("open", () => {
      console.log(
        `Connection to WebsocketClient initiated @${moment(new Date()).format(
          "D MMM, YYYY, h:mm:ss a"
        )}`
      )
    })

    ws.on("reconnecting", (data) => {
      console.log(`Reconnecting to ${data.wsKey} `)
    })

    ws.on("reconnected", (data) => {
      console.log(`Reconnected to ${data.wsKey}`)
    })

    ws.on("formattedMessage", (data) => {
      console.log("formattedMessage: ", data)
      // data.event.

      //@ts-expect-error FIX PACKAGE TYPE
      if (data.eventType == "markPriceUpdate") {
        setPrices((prevPrices) => {
          //@ts-expect-error FIX PACKAGE TYPE
          return { ...prevPrices, [data.symbol]: data.markPrice }
        })
      }
    })

    ws.on("reply", (data) => {
      console.log("log reply: ", JSON.stringify(data, null, 2))
    })

    ws.on("error", (data) => {
      console.log("ws saw error ", data?.wsKey)
    })
  }, [ws])

  useEffect(() => {
    watchlist.forEach((pair) => {
      ws.subscribeMarkPrice(pair.symbol, "usdm")
    })
  }, [watchlist, ws])

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
    console.log(newPnl)
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
