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

interface IGeneralContext {
  watchlist: WatchlistItemType[]
  tempWatchlist: WatchlistItemType[]
  setWatchlist: Dispatch<SetStateAction<WatchlistItemType[]>>
  setTempWatchlist: Dispatch<SetStateAction<WatchlistItemType[]>>
  handleAddNewWatchlistItems: () => void
  handleAddTempWatchlist: (
    values: MultiValue<{
      value: string
      label: string
    } | null>
  ) => void
}

const defaultGeneralContext: IGeneralContext = {
  handleAddNewWatchlistItems: () => {},
  handleAddTempWatchlist: () => {},
  setTempWatchlist: () => [],
  setWatchlist: () => [],
  tempWatchlist: [],
  watchlist: []
}

const GeneralContext = createContext<IGeneralContext>(defaultGeneralContext)

export const GeneralProvider: React.FC<ProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItemType[]>([])
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

  const providerMemo = useMemo<IGeneralContext>(() => {
    return {
      handleAddNewWatchlistItems,
      handleAddTempWatchlist,
      setTempWatchlist,
      setWatchlist,
      tempWatchlist,
      watchlist
    }
  }, [handleAddNewWatchlistItems, tempWatchlist, watchlist])

  return (
    <GeneralContext.Provider value={providerMemo}>
      {children}
    </GeneralContext.Provider>
  )
}

export const useGeneralContext = () => useContext(GeneralContext)
export default GeneralProvider
