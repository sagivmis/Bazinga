import { useEffect, useState } from "react"
import { TextField, Button, Switch, FormControlLabel, Alert } from "@mui/material"
import type { AppSettings } from "../../shared/types"
import { useLeverageStore } from "../stores/leverageStore"
import LeverageSlider from "../components/forms/LeverageSlider"

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [hasSecrets, setHasSecrets] = useState({ apiKey: false, apiSecret: false })
  const [encryptionAvailable, setEncryptionAvailable] = useState(true)
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [electronReady] = useState(() => !!window.api)

  const refresh = async () => {
    if (!window.api) return
    const [s, secrets] = await Promise.all([
      window.api.settings.get(),
      window.api.secrets.has()
    ])
    setSettings(s)
    setHasSecrets({ apiKey: secrets.apiKey, apiSecret: secrets.apiSecret })
    setEncryptionAvailable(secrets.encryptionAvailable ?? true)
    if (secrets.apiKey && secrets.apiSecret && secrets.readable === false) {
      setSaveError("Keys are saved but could not be read. Please re-enter and save again.")
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const saveSettings = async (partial: Partial<AppSettings>) => {
    if (!window.api) return
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev))
    const next = await window.api.settings.set(partial)
    setSettings(next)
  }

  const saveKeys = async () => {
    if (!window.api) return
    setSaveError("")
    const ok = await window.api.secrets.set({ apiKey, apiSecret })
    if (ok) {
      await refresh()
      setApiKey("")
      setApiSecret("")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError("Failed to save keys. Check the Electron console for errors.")
    }
  }

  if (!electronReady) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Settings require the Electron desktop window — not a browser tab.
      </Alert>
    )
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Settings</h1>

      <Alert severity="info" sx={{ mb: 2, maxWidth: 640 }}>
        <strong>Testnet keys</strong> come from{" "}
        <a href="https://demo.binance.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent-teal)" }}>
          demo.binance.com
        </a>
        {" "}(log in with GitHub → Profile → API Management).
      </Alert>

      <div className="panel" style={{ padding: 20, maxWidth: 520, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Trading defaults</h3>
        <LeverageSlider
          label="Default leverage"
          value={settings?.defaultLeverage ?? 10}
          onChange={async (v) => {
            await saveSettings({ defaultLeverage: v })
            useLeverageStore.getState().applyDefault(v)
          }}
          helperText="Preferred leverage for new symbols. Order entry overrides are local only."
        />
      </div>

      <div className="panel" style={{ padding: 20, maxWidth: 520, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Network</h3>
        <FormControlLabel
          control={
            <Switch
              checked={settings?.useTestnet ?? true}
              onChange={(_, checked) => void saveSettings({ useTestnet: checked })}
            />
          }
          label="Use Binance Demo / Testnet (recommended)"
        />
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "8px 0 0" }}>
          OFF = live Binance futures (real money).
        </p>
      </div>

      <div className="panel" style={{ padding: 20, maxWidth: 520 }}>
        <h3 style={{ marginTop: 0 }}>API Credentials</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {hasSecrets.apiKey && hasSecrets.apiSecret
            ? "✓ Keys stored."
            : "No keys saved yet."}
          {!encryptionAvailable && " (Using fallback storage.)"}
        </p>
        <TextField
          label="API Key"
          size="small"
          fullWidth
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="API Secret"
          size="small"
          fullWidth
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={() => void saveKeys()} disabled={!apiKey || !apiSecret}>
          Save Keys
        </Button>
        {saved && <span style={{ marginLeft: 12, color: "var(--accent-teal)" }}>Saved!</span>}
        {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
      </div>
    </div>
  )
}
