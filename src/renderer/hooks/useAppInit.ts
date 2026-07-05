import { useEffect } from "react"
import { IPC } from "../../shared/ipc"
import { useConnectionStore } from "../stores/connectionStore"
import { useAccountStore } from "../stores/accountStore"
import { useMarketStore } from "../stores/marketStore"
import { useEngineStore } from "../stores/engineStore"
import { useBacktestStore } from "../stores/backtestStore"
import { useLeverageStore } from "../stores/leverageStore"

/** Wire IPC push events and polling on app mount */
export function useAppInit() {
  useEffect(() => {
    const cleanups = [
      useConnectionStore.getState().init(),
      useAccountStore.getState().init(),
      useMarketStore.getState().init()
    ]
    void useEngineStore.getState().init()
    void useLeverageStore.getState().init()

    const engineUnsub = window.api?.on(IPC.EVENT_ENGINE, (_, data) => {
      const status = data as import("../../shared/types").EngineStatus
      useEngineStore.setState({
        armed: status.armed,
        strategyId: status.strategyId,
        runningSymbols: status.runningSymbols
      })
    })

    const backtestCleanup = useBacktestStore.getState().init()

    // Subscribe header tickers
    if (window.api) {
      ;["BTCUSDT", "ETHUSDT", "SOLUSDT"].forEach((symbol) => {
        void window.api.market.subscribeSymbol({
          symbol,
          interval: "15m"
        })
      })
    }

    return () => {
      cleanups.forEach((fn) => fn?.())
      engineUnsub?.()
      backtestCleanup?.()
    }
  }, [])
}
