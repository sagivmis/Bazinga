import React, { useCallback, useEffect, useState } from "react"
import AsyncSelect from "react-select/async"
import Select from "react-select"
import "./watchlist.css"
import { SingleValue } from "react-select"
import { useBinanceContext } from "../../providers/BinanceProvider"
import { Contract, WatchlistItemType } from "../../types"
import WatchlistItem from "./WatchlistItem"

const Watchlist = () => {
  const { getAllContracts } = useBinanceContext()
  const [data, setData] = useState<{ value: string; label: string }[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItemType[]>([])
  const [tempWatchlist, setTempWatchlist] = useState<WatchlistItemType[]>([])

  const handleFetchContractsOptions = useCallback(async () => {
    const contracts = await getAllContracts()
    setData(
      contracts.map((contract) => {
        return { value: contract, label: contract.toLocaleUpperCase() }
      })
    )
  }, [getAllContracts])

  useEffect(() => {
    handleFetchContractsOptions()
  }, [handleFetchContractsOptions])

  const fetchOptions = async (inputValue: string) => {
    const response = data.filter((i) =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    )

    return response
  }

  const handleAddNewWatchlistItems = () => {
    const contracts = watchlist.map((item) => item.symbol)
    const additionContracts = tempWatchlist.filter((item) => {
      if (!contracts.includes(item.symbol)) {
        return true
      }
    })
    setWatchlist((prevWatchlist) => [...prevWatchlist, ...additionContracts])
  }

  // SET CONNECTION THROUGH WS AND THEN GET THE PRICES OF THE ADDED CONTRACTS
  // AND SHOW THEM (DO NOT GET ALL THE PRICES FOR ALL THE CONTRACTS SINCE THERES A
  // LIMIT OF 200 CONNECTIONS)
  return (
    <div className='watchlist'>
      <Select
        placeholder='Type to search...'
        options={data}
        defaultValue={null}
        isMulti
        onChange={(values) => {
          if (Array.isArray(values)) {
            setTempWatchlist(
              values.map((value) => {
                return { symbol: value.value }
              })
            )
          }
        }}
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
