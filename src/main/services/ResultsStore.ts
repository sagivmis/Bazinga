import Store from "electron-store"
import type {
  BacktestResult,
  BacktestSweepResult,
  EnsembleMultiSweepResult,
  TradeRecord
} from "../../shared/types"

interface StoreSchema {
  backtests: BacktestResult[]
  sweeps: BacktestSweepResult[]
  ensembleMultiSweeps: EnsembleMultiSweepResult[]
  trades: TradeRecord[]
}

export class ResultsStore {
  private store = new Store<StoreSchema>({
    name: "bazinga-results",
    defaults: { backtests: [], sweeps: [], ensembleMultiSweeps: [], trades: [] }
  })

  saveBacktest(result: BacktestResult) {
    const list = this.store.get("backtests")
    this.store.set("backtests", [result, ...list].slice(0, 50))
  }

  listBacktests() {
    return this.store.get("backtests")
  }

  getLatestBacktest() {
    return this.store.get("backtests")[0] ?? null
  }

  saveSweep(result: BacktestSweepResult) {
    const list = this.store.get("sweeps") ?? []
    this.store.set("sweeps", [result, ...list].slice(0, 20))
  }

  listSweeps() {
    return this.store.get("sweeps") ?? []
  }

  getLatestSweep() {
    return (this.store.get("sweeps") ?? [])[0] ?? null
  }

  saveEnsembleMultiSweep(result: EnsembleMultiSweepResult) {
    const list = this.store.get("ensembleMultiSweeps") ?? []
    this.store.set("ensembleMultiSweeps", [result, ...list].slice(0, 10))
  }

  listEnsembleMultiSweeps() {
    return this.store.get("ensembleMultiSweeps") ?? []
  }

  getLatestEnsembleMultiSweep() {
    return (this.store.get("ensembleMultiSweeps") ?? [])[0] ?? null
  }

  logTrade(trade: TradeRecord) {
    const list = this.store.get("trades")
    this.store.set("trades", [trade, ...list].slice(0, 500))
  }

  listTrades() {
    return this.store.get("trades")
  }
}
