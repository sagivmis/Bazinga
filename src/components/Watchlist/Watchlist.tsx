import { useCallback, useEffect, useState } from "react"
import Select from "react-select"
import "./watchlist.css"
import { useBinance } from "../../providers/BinanceProvider"
import WatchlistItem from "./WatchlistItem"
import { useGeneralContext } from "../../providers/GeneralProvider"

const Watchlist = () => {
  const { getAllContracts } = useBinance()
  const { handleAddNewWatchlistItems, handleAddTempWatchlist, watchlist } =
    useGeneralContext()

  const [data, setData] = useState<{ value: string; label: string }[]>([])

  const handleFetchContractsOptions = useCallback(async () => {
    const contracts = (await getAllContracts()).filter((symbol) =>
      symbol.includes("USDT")
    )
    const filtered = contracts.filter(
      (contract) =>
        !(watchlist.findIndex((item) => item.symbol === contract) >= 0)
    )
    setData(
      filtered.map((contract) => {
        return { value: contract, label: contract.toLocaleUpperCase() }
      })
    )
  }, [getAllContracts, watchlist])

  useEffect(() => {
    handleFetchContractsOptions()
  }, [handleFetchContractsOptions])

  return (
    <div className='watchlist'>
      <Select
        placeholder='Type to search...'
        options={data}
        defaultValue={null}
        isMulti
        onChange={handleAddTempWatchlist}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddNewWatchlistItems()
          }
        }}
      />
      <div className='watchlist-items'>
        {watchlist.map((item) => (
          <WatchlistItem item={item} />
        ))}
      </div>
    </div>
  )
}

export default Watchlist
