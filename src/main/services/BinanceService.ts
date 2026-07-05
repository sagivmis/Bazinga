import {
  Kline,
  KlineInterval,
  MainClient,
  USDMClient,
  WebsocketClient
} from "binance"
import { IPC } from "../../shared/ipc"
import { LIVE_WS_URL, TESTNET_REST_URL, TESTNET_WS_URL } from "../../shared/constants"
import type {
  AccountSummary,
  Candle,
  ConnectionStatus,
  MarketTicker,
  OpenOrderView,
  OrderBookSnapshot,
  OrderIntent,
  PositionView
} from "../../shared/types"
import type { SettingsService } from "./SettingsService"
import { readSecret } from "../secrets"

type PushFn = (channel: string, payload: unknown) => void

export class BinanceService {
  private usdm: USDMClient | null = null
  private ws: WebsocketClient | null = null
  private connected = false
  private latencyMs = 0
  private subscribedSymbols = new Set<string>()
  private markPrices: Record<string, number> = {}
  private klineCloseListeners: Array<(symbol: string, candle: import("../../shared/types").Candle) => void> = []

  constructor(
    private settings: SettingsService,
    private push: PushFn
  ) {}

  private getCredentials() {
    const apiKey = readSecret("apiKey") ?? process.env.API_KEY
    const apiSecret = readSecret("apiSecret") ?? process.env.API_SECRET
    return { apiKey, apiSecret }
  }

  hasCredentials(): boolean {
    const { apiKey, apiSecret } = this.getCredentials()
    return Boolean(apiKey && apiSecret)
  }

  private buildClients() {
    const { apiKey, apiSecret } = this.getCredentials()
    const useTestnet = this.settings.get().useTestnet

    if (useTestnet) {
      // Binance deprecated testnet.binancefuture.com — demo trading uses demo-fapi
      this.usdm = new USDMClient(
        { api_key: apiKey, api_secret: apiSecret, baseUrl: TESTNET_REST_URL },
        undefined,
        false
      )
    } else {
      this.usdm = new USDMClient({ api_key: apiKey, api_secret: apiSecret }, undefined, false)
    }

    this.ws = new WebsocketClient({
      api_key: apiKey,
      api_secret: apiSecret,
      wsUrl: useTestnet ? TESTNET_WS_URL : LIVE_WS_URL,
      beautify: true
    })

    this.ws.on("open", () => {
      this.connected = true
      this.emitConnection()
    })

    this.ws.on("error", () => {
      this.connected = false
      this.emitConnection()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ws.on("formattedMessage", (data: any) => {
      if (data.eventType === "markPriceUpdate" && data.markPrice) {
        this.markPrices[data.symbol] = data.markPrice
        this.push(IPC.EVENT_PRICE, { symbol: data.symbol, price: data.markPrice })
      }
      if (data.eventType === "kline" && data.kline?.final) {
        const k = data.kline
        const candle: Candle = {
          timestamp: k.startTime,
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume)
        }
        this.push(IPC.EVENT_KLINE, { symbol: data.symbol, candle })
        this.klineCloseListeners.forEach((fn) => fn(data.symbol, candle))
      }
    })
  }

  onKlineClose(listener: (symbol: string, candle: import("../../shared/types").Candle) => void) {
    this.klineCloseListeners.push(listener)
  }

  async connect() {
    this.disconnect()
    this.buildClients()
    try {
      await this.usdm!.testConnectivity()
      this.connected = true
    } catch (err) {
      this.connected = false
      console.error("[BinanceService] connect failed:", err)
    }
    this.emitConnection()
  }

  reconnect() {
    return this.connect()
  }

  disconnect() {
    this.ws?.closeAll()
    this.ws = null
    this.usdm = null
    this.connected = false
    this.subscribedSymbols.clear()
  }

  private emitConnection() {
    this.push(IPC.EVENT_CONNECTION, this.getConnectionStatus())
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.connected,
      latencyMs: this.latencyMs,
      useTestnet: this.settings.get().useTestnet
    }
  }

  async ping(): Promise<number> {
    const start = Date.now()
    try {
      await this.usdm!.testConnectivity()
      this.connected = true
      this.latencyMs = Date.now() - start
    } catch (err) {
      this.connected = false
      this.latencyMs = 0
      console.error("[BinanceService] ping failed:", err)
    }
    this.emitConnection()
    return this.latencyMs
  }

  subscribeSymbol(symbol: string, _interval: KlineInterval) {
    if (!this.ws || this.subscribedSymbols.has(symbol)) return
    this.subscribedSymbols.add(symbol)
    this.ws.subscribeMarkPrice(symbol, "usdm")
    this.ws.subscribeKlines(symbol, _interval, "usdm")
  }

  unsubscribeSymbol(symbol: string) {
    this.subscribedSymbols.delete(symbol)
  }

  async getContracts(): Promise<string[]> {
    const tickers = await this.getTickers()
    return tickers.map((t) => t.symbol)
  }

  async getTickers(): Promise<MarketTicker[]> {
    const raw = (await this.usdm!.get24hrChangeStatistics()) as {
      symbol: string
      lastPrice: string
      priceChangePercent: string
      quoteVolume: string
    }[]
    return raw
      .filter((t) => t.symbol.endsWith("USDT"))
      .map((t) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        changePct: parseFloat(t.priceChangePercent),
        volume: parseFloat(t.quoteVolume)
      }))
      .sort((a, b) => b.volume - a.volume)
  }

  private parseKline(k: Kline): Candle {
    return {
      timestamp: k[0],
      open: parseFloat(k[1].toString()),
      high: parseFloat(k[2].toString()),
      low: parseFloat(k[3].toString()),
      close: parseFloat(k[4].toString()),
      volume: parseFloat(k[5].toString())
    }
  }

  async getKlines(symbol: string, interval: KlineInterval, limit = 500): Promise<Candle[]> {
    const raw = await this.usdm!.getKlines({ symbol, interval, limit })
    return raw.map((k) => this.parseKline(k))
  }

  async getOrderBook(symbol: string, limit = 20): Promise<OrderBookSnapshot> {
    const validLimits = [5, 10, 20, 50, 100, 500, 1000] as const
    type ValidLimit = (typeof validLimits)[number]
    const validLimit: ValidLimit = validLimits.includes(limit as ValidLimit)
      ? (limit as ValidLimit)
      : 20
    const book = await this.usdm!.getOrderBook({ symbol, limit: validLimit })
    return {
      symbol,
      bids: book.bids.map(([price, qty]) => ({
        price: parseFloat(price.toString()),
        quantity: parseFloat(qty.toString())
      })),
      asks: book.asks.map(([price, qty]) => ({
        price: parseFloat(price.toString()),
        quantity: parseFloat(qty.toString())
      }))
    }
  }

  async getAccountSummary(): Promise<AccountSummary> {
    const balances = await this.usdm!.getBalance()
    const usdt = balances.find((b) => b.asset === "USDT")
    const balance = usdt ? parseFloat(usdt.balance.toString()) : 0
    const positions = await this.getPositions()
    const unrealizedPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0)
    const equity = balance + unrealizedPnl
    const usedMargin = positions.reduce(
      (s, p) => s + (p.entryPrice * Math.abs(p.size)) / p.leverage,
      0
    )
    return {
      balance,
      unrealizedPnl,
      equity,
      availableMargin: Math.max(0, equity - usedMargin),
      marginUsagePct: equity > 0 ? (usedMargin / equity) * 100 : 0
    }
  }

  async getPositions(): Promise<PositionView[]> {
    const raw = await this.usdm!.getPositions()
    return raw
      .filter((p) => parseFloat(p.positionAmt.toString()) !== 0)
      .map((p) => ({
        symbol: p.symbol,
        side: parseFloat(p.positionAmt.toString()) > 0 ? "LONG" : "SHORT",
        size: Math.abs(parseFloat(p.positionAmt.toString())),
        entryPrice: parseFloat(p.entryPrice.toString()),
        markPrice: parseFloat(p.markPrice.toString()),
        unrealizedPnl: parseFloat(p.unRealizedProfit.toString()),
        leverage: parseFloat(p.leverage.toString())
      }))
  }

  async setSymbolLeverage(symbol: string, leverage: number) {
    if (!this.usdm || !this.hasCredentials()) return
    const lev = Math.max(1, Math.min(125, Math.round(leverage)))
    return this.usdm.setLeverage({ symbol, leverage: lev })
  }

  async submitOrder(order: OrderIntent) {
    if (order.leverage && order.leverage > 0) {
      try {
        await this.setSymbolLeverage(order.symbol, order.leverage)
      } catch (err) {
        console.error("[BinanceService] setLeverage failed:", err)
      }
    }
    const side = order.side
    const type = order.type
    const params: Record<string, unknown> = {
      symbol: order.symbol,
      side,
      type,
      quantity: order.quantity
    }
    if (order.price) params.price = order.price
    if (order.stopPrice) params.stopPrice = order.stopPrice
    if (type === "LIMIT") params.timeInForce = "GTC"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.usdm!.submitNewOrder(params as any)
  }

  async cancelOrder(symbol: string, orderId: number) {
    return this.usdm!.cancelOrder({ symbol, orderId })
  }

  async getOpenOrders(): Promise<OpenOrderView[]> {
    const raw = await this.usdm!.getAllOpenOrders()
    return raw.map((o) => ({
      orderId: o.orderId,
      symbol: o.symbol,
      side: o.side as "BUY" | "SELL",
      type: o.type,
      price: parseFloat(o.price?.toString() ?? "0"),
      quantity: parseFloat(o.origQty?.toString() ?? "0"),
      status: o.status,
      time: o.time ?? o.updateTime ?? Date.now()
    }))
  }

  async getOrderHistory(symbol = "BTCUSDT", limit = 50) {
    const raw = await this.usdm!.getAccountTrades({ symbol, limit })
    return raw.map((t) => ({
      id: String(t.id),
      time: t.time,
      symbol: t.symbol,
      side: t.buyer ? "BUY" : "SELL",
      quantity: parseFloat(t.qty.toString()),
      price: parseFloat(t.price.toString()),
      pnl: parseFloat(t.realizedPnl?.toString() ?? "0"),
      source: "manual" as const
    }))
  }

  emit(channel: string, payload: unknown) {
    this.push(channel, payload)
  }

  getMarkPrice(symbol: string) {
    return this.markPrices[symbol]
  }

  /** Public client for backtest kline fetches */
  getClient() {
    return this.usdm
  }
}
