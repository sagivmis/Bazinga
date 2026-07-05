import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TextField } from "@mui/material"
import {
  filterSymbols,
  normalizeSymbol,
  QUICK_SYMBOLS,
  symbolBase
} from "../../../shared/symbolUtils"
import "./symbol-field.css"

interface SymbolFieldProps {
  value: string
  onChange: (symbol: string) => void
  label?: string
  className?: string
  showQuickPicks?: boolean
}

/** Symbol input with local edit buffer (no cursor jump) + contract autocomplete. */
export function SymbolField({
  value,
  onChange,
  label = "Symbol",
  className,
  showQuickPicks = true
}: SymbolFieldProps) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)
  const [contracts, setContracts] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.api?.market?.getContracts) {
      void window.api.market.getContracts().then(setContracts).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!focused) setDraft(value)
  }, [value, focused])

  const commit = useCallback(
    (raw: string) => {
      const next = normalizeSymbol(raw)
      if (next) {
        onChange(next)
        setDraft(next)
      } else {
        setDraft(value)
      }
    },
    [onChange, value]
  )

  const suggestions = useMemo(
    () => filterSymbols(contracts, focused ? draft : value),
    [contracts, draft, value, focused]
  )

  const pick = (symbol: string) => {
    const next = normalizeSymbol(symbol)
    setDraft(next)
    onChange(next)
    setFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className={`symbol-field ${className ?? ""}`}>
      <TextField
        inputRef={inputRef}
        label={label}
        size="small"
        className="compact-field symbol-field-input"
        value={focused ? draft : value}
        onChange={(e) => {
          setDraft(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
        }}
        onFocus={() => {
          setFocused(true)
          setDraft(value)
        }}
        onBlur={() => {
          setFocused(false)
          commit(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(draft)
            inputRef.current?.blur()
          }
          if (e.key === "Escape") {
            setDraft(value)
            inputRef.current?.blur()
          }
        }}
        placeholder="BTCUSDT"
        autoComplete="off"
        spellCheck={false}
      />

      {focused && suggestions.length > 0 && (
        <ul className="symbol-suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {symbolBase(s)}
                <span className="quote">USDT</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showQuickPicks && (
        <div className="symbol-quick-picks">
          {QUICK_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className={value === s ? "active" : ""}
              onClick={() => pick(s)}
            >
              {symbolBase(s)}
              <span className="quote">USDT</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SymbolField
