import { useEffect, useState } from "react"
import { Button, IconButton } from "@mui/material"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import CloseIcon from "@mui/icons-material/Close"
import type { AlgoSetup, AlgoSetupInput } from "../../../shared/types"
import {
  formatRelativeTime,
  setupDisplayName,
  sourceLabel
} from "../../../shared/setupUtils"
import { useSetupLibraryStore } from "../../stores/setupLibraryStore"
import { FormSection } from "../forms/CompactField"
import "./setup-library.css"

type Tab = "recent" | "saved"

interface SetupLibraryPanelProps {
  strategies: { id: string; name: string }[]
  getCurrentSetup: () => AlgoSetupInput
  onLoad: (setup: AlgoSetup) => void
}

function SetupCard({
  setup,
  strategyName,
  onLoad,
  onFavorite,
  onRemove
}: {
  setup: AlgoSetup
  strategyName: string
  onLoad: () => void
  onFavorite: () => void
  onRemove: () => void
}) {
  const title = setupDisplayName(setup, strategyName)
  const symbol = setup.symbols.join(", ")

  return (
    <div className={`setup-card${setup.favorite ? " favorite" : ""}`}>
      <button type="button" className="setup-card-main" onClick={onLoad}>
        <div className="setup-card-title">{title}</div>
        <div className="setup-card-meta">
          <span className="setup-source-badge">{sourceLabel(setup.source)}</span>
          <span>
            {strategyName} · {symbol} @ {setup.interval ?? "15m"}
          </span>
          <span>{formatRelativeTime(setup.lastUsedAt)}</span>
          {setup.saved && !setup.name && <span>Saved</span>}
        </div>
      </button>
      <div className="setup-card-actions">
        <IconButton
          type="button"
          className={`setup-icon-btn favorite-btn${setup.favorite ? " active" : ""}`}
          title={setup.favorite ? "Unfavorite" : "Favorite"}
          aria-label={setup.favorite ? "Unfavorite" : "Favorite"}
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onFavorite()
          }}
        >
          {setup.favorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
        </IconButton>
        <IconButton
          type="button"
          className="setup-icon-btn remove-btn"
          title="Remove from library"
          aria-label="Remove from library"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  )
}

export default function SetupLibraryPanel({
  strategies,
  getCurrentSetup,
  onLoad
}: SetupLibraryPanelProps) {
  const { recent, saved, loading, refresh, save, touch, toggleFavorite, remove } =
    useSetupLibraryStore()
  const [tab, setTab] = useState<Tab>("recent")
  const [saveName, setSaveName] = useState("")

  useEffect(() => {
    void refresh()
  }, [refresh])

  const strategyName = (id: string) => strategies.find((s) => s.id === id)?.name ?? id

  const handleLoad = async (setup: AlgoSetup) => {
    onLoad(setup)
    await touch(setup.id)
  }

  const handleSaveCurrent = async () => {
    const name = saveName.trim()
    if (!name) return
    const input = getCurrentSetup()
    await save({ ...input, name, source: "saved" })
    setSaveName("")
    setTab("saved")
  }

  const items = tab === "saved" ? saved : recent
  const showFavoritesFirst =
    tab === "recent"
      ? [...items].sort((a, b) => {
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
          return b.lastUsedAt - a.lastUsedAt
        })
      : items

  return (
    <div className="setup-library panel form-panel" style={{ maxWidth: 720 }}>
      <FormSection
        title="Setup library"
        description="Recent configs from backtests, heatmaps, and live runs — save favorites for one-click reload."
      >
        <div className="setup-save-row">
          <input
            type="text"
            placeholder="Name this setup…"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSaveCurrent()
            }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={!saveName.trim()}
            onClick={() => void handleSaveCurrent()}
          >
            Save current
          </Button>
        </div>

        <div className="setup-library-tabs">
          <button
            type="button"
            className={`setup-library-tab${tab === "recent" ? " active" : ""}`}
            onClick={() => setTab("recent")}
          >
            Recent ({recent.length})
          </button>
          <button
            type="button"
            className={`setup-library-tab${tab === "saved" ? " active" : ""}`}
            onClick={() => setTab("saved")}
          >
            Saved ({saved.length})
          </button>
        </div>

        {loading && items.length === 0 ? (
          <p className="setup-empty">Loading…</p>
        ) : showFavoritesFirst.length === 0 ? (
          <p className="setup-empty">
            {tab === "saved"
              ? "No saved setups yet — name and save the current config above."
              : "No history yet — run a backtest, apply a heatmap cell, or arm the engine."}
          </p>
        ) : (
          <div className="setup-list">
            {showFavoritesFirst.map((setup) => (
              <SetupCard
                key={setup.id}
                setup={setup}
                strategyName={strategyName(setup.strategyId)}
                onLoad={() => void handleLoad(setup)}
                onFavorite={() => void toggleFavorite(setup.id)}
                onRemove={() => void remove(setup.id)}
              />
            ))}
          </div>
        )}
      </FormSection>
    </div>
  )
}
