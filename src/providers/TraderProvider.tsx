import { createContext, useContext, useMemo } from "react"
import { ProviderProps } from "../types"

interface ITraderContext {}

const defaultGeneralContext: ITraderContext = {}

const TraderContext = createContext<ITraderContext>(defaultGeneralContext)
export const TraderProvider: React.FC<ProviderProps> = ({ children }) => {
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
