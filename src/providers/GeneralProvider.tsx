import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react"
import { ProviderProps, WatchlistItemType } from "../types"
import { MultiValue } from "react-select"

type MarketType = "usdm" | "spot"
interface IGeneralContext {
  watchlist: WatchlistItemType[]
  tempWatchlist: WatchlistItemType[]
  market: MarketType
  setMarket: Dispatch<SetStateAction<MarketType>>
  setWatchlist: Dispatch<SetStateAction<WatchlistItemType[]>>
  setTempWatchlist: Dispatch<SetStateAction<WatchlistItemType[]>>
  handleAddNewWatchlistItems: () => void
  handleAddNewWatchlistItem: (symbol: string) => void
  handleAddTempWatchlist: (
    values: MultiValue<{
      value: string
      label: string
    } | null>
  ) => void
}

const defaultGeneralContext: IGeneralContext = {
  handleAddNewWatchlistItems: () => {},
  handleAddNewWatchlistItem: () => {},
  handleAddTempWatchlist: () => {},
  setTempWatchlist: () => [],
  setWatchlist: () => [],
  setMarket: () => "usdm",
  tempWatchlist: [],
  watchlist: [],
  market: "usdm"
}

const GeneralContext = createContext<IGeneralContext>(defaultGeneralContext)

export const GeneralProvider: React.FC<ProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItemType[]>([])
  const [market, setMarket] = useState<MarketType>("usdm")
  const [tempWatchlist, setTempWatchlist] = useState<WatchlistItemType[]>([])

  const handleAddNewWatchlistItems = useCallback(() => {
    const contracts = watchlist.map((item) => item.symbol)
    const additionContracts = tempWatchlist.filter((item) => {
      if (!contracts.includes(item.symbol)) {
        return true
      }
    })
    setWatchlist((prevWatchlist) => [...prevWatchlist, ...additionContracts])
    setTempWatchlist([])
  }, [tempWatchlist, watchlist])

  const handleAddTempWatchlist = (
    values: MultiValue<{
      value: string
      label: string
    } | null>
  ) => {
    if (Array.isArray(values)) {
      setTempWatchlist(
        values.map((value) => {
          return { symbol: value.value }
        })
      )
    }
  }

  const handleAddNewWatchlistItem = useCallback(
    (symbol: string) => {
      const contracts = watchlist.map((item) => item.symbol)
      if (contracts.includes(symbol)) return

      setWatchlist((prevWatchlist) => [...prevWatchlist, { symbol }])
    },
    [watchlist]
  )

  const providerMemo = useMemo<IGeneralContext>(() => {
    return {
      market,
      setMarket,
      handleAddNewWatchlistItem,
      handleAddNewWatchlistItems,
      handleAddTempWatchlist,
      setTempWatchlist,
      setWatchlist,
      tempWatchlist,
      watchlist
    }
  }, [
    market,
    setMarket,
    handleAddNewWatchlistItem,
    handleAddNewWatchlistItems,
    tempWatchlist,
    watchlist
  ])

  return (
    <GeneralContext.Provider value={providerMemo}>
      {children}
    </GeneralContext.Provider>
  )
}

export const useGeneralContext = () => useContext(GeneralContext)
export default GeneralProvider
