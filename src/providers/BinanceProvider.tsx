/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react"
import { ProviderProps } from "../types"
import {
  BasicSymbolParam,
  CancelAllOpenOrdersResult,
  CancelFuturesOrderResult,
  CancelOrderParams,
  CancelOrdersTimeoutParams,
  FuturesOrderBook,
  FuturesPosition,
  FuturesSymbolOrderBookTicker,
  Kline,
  KlinesParams,
  MarkPrice,
  NewFuturesOrderParams,
  NewOrderError,
  NewOrderResult,
  OrderBookParams,
  SetLeverageResult,
  USDMClient,
  WebsocketClient
} from "binance"

const api_key =
  "876a0aa7f6e9c11b363a666902b0668407ee313f52396c22d85800b2c8b4f3f6"
const secret_key =
  "9473252093d4895607c2fde6a3efe81b81d966c3597c5ca61caf9d3288f271f1"

interface IBinanceContext {
  client: USDMClient
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
}
const defaultBinanceContext: IBinanceContext = {
  client: new USDMClient(),
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
  const [prices, setPrices] = useState([])

  const ws = useMemo(
    () => new WebsocketClient({ api_key, api_secret: secret_key }),
    []
  )

  // ws.

  const client = useMemo(
    () =>
      new USDMClient({
        api_key: api_key,
        api_secret: secret_key
      }),
    []
  )

  const ping = useCallback(async () => {
    const response = await client.testConnectivity()
    return response
  }, [client])

  const getBalances = useCallback(async () => {
    const response = await client.getBalance()
    return response
  }, [client])

  const setLeverage = useCallback(
    async (leverage: number, symbol: string) => {
      const response = await client.setLeverage({ leverage: leverage, symbol })
      return response
    },
    [client]
  )

  const getPositions = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await client.getPositions(params)
      return response
    },
    [client]
  )

  const getPosition = useCallback(
    async (symbol: string) => {
      const response = await client.getPositions({ symbol })
      return response
    },
    [client]
  )

  const cancelAllOrdersFor = useCallback(
    async (symbol: string) => {
      const response = await client.cancelAllOpenOrders({ symbol })
      return response
    },
    [client]
  )

  const cancelOrder = useCallback(
    async (symbol: string, orderId?: number) => {
      const response = await client.cancelOrder({ symbol, orderId })
      return response
    },
    [client]
  )

  /**
   * Provide only `side`, `type` and `symbol` for market default size position
   */
  const createOrder = useCallback(
    async (params: NewFuturesOrderParams<number>) => {
      const response = await client.submitNewOrder(params)
      return response
    },
    [client]
  )

  /**
   * Warning: max 5 orders at a time! This method does not throw, instead it returns individual errors in the response array if any orders were rejected.
   *
   * Known issue: `quantity` and `price` should be sent as strings
   */
  const submitMultipleOrders = useCallback(
    async (params: NewFuturesOrderParams<string>[]) => {
      const response = await client.submitMultipleOrders(params)
      return response
    },
    [client]
  )

  const getPrice = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await client.getSymbolOrderBookTicker(params)

      return response
    },
    [client]
  )

  const getKlines = useCallback(
    async (params: KlinesParams) => {
      const response = await client.getKlines(params)

      return response
    },
    [client]
  )
  const getMarkPrice = useCallback(
    async (params?: Partial<BasicSymbolParam>) => {
      const response = await client.getMarkPrice(params)

      return response
    },
    [client]
  )
  const getOrderBook = useCallback(
    async (params: OrderBookParams) => {
      const response = await client.getOrderBook({ limit: 1000, ...params })

      return response
    },
    [client]
  )

  const getServerTime = useCallback(async () => {
    const response = await client.getServerTime()

    return response
  }, [client])

  const getAllContracts = useCallback(async () => {
    const response = (await getMarkPrice()) as MarkPrice[]
    const res = response.map((row) => row.symbol)
    return res
  }, [getMarkPrice])

  const providerMemo: IBinanceContext = useMemo(
    () => ({
      client,
      getAllContracts,
      getServerTime,
      getBalances,
      cancelAllOrdersFor,
      cancelOrder,
      createOrder,
      getKlines,
      getMarkPrice,
      getOrderBook,
      getPosition,
      getPositions,
      getPrice,
      setLeverage,
      submitMultipleOrders,
      ping
    }),
    [
      cancelAllOrdersFor,
      cancelOrder,
      client,
      createOrder,
      getAllContracts,
      getBalances,
      getKlines,
      getMarkPrice,
      getOrderBook,
      getPosition,
      getPositions,
      getPrice,
      getServerTime,
      ping,
      setLeverage,
      submitMultipleOrders
    ]
  )

  return (
    <BinanceContext.Provider value={providerMemo}>
      {children}
    </BinanceContext.Provider>
  )
}

export const useBinanceContext = () => useContext(BinanceContext)
export default BinanceProvider
