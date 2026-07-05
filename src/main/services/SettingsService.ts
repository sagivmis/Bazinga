import Store from "electron-store"
import type { AppSettings } from "../../shared/types"
import { DEFAULT_INTERVAL, DEFAULT_SYMBOL } from "../../shared/constants"
import { DEFAULT_LEVERAGE } from "../../shared/leverageUtils"

const defaults: AppSettings = {
  useTestnet: true,
  theme: "dark",
  defaultSymbol: DEFAULT_SYMBOL,
  defaultInterval: DEFAULT_INTERVAL,
  defaultLeverage: DEFAULT_LEVERAGE,
  watchlist: [DEFAULT_SYMBOL, "ETHUSDT", "SOLUSDT"]
}

export class SettingsService {
  private store = new Store<{ settings: AppSettings; secrets: Record<string, string> }>({
    name: "bazinga-settings",
    defaults: {
      settings: defaults,
      secrets: {}
    }
  })

  get(): AppSettings {
    const saved = this.store.get("settings") ?? defaults
    return {
      ...defaults,
      ...saved,
      watchlist: saved.watchlist ?? defaults.watchlist,
      defaultLeverage: saved.defaultLeverage ?? defaults.defaultLeverage
    }
  }

  set(partial: Partial<AppSettings>) {
    this.store.set("settings", { ...this.get(), ...partial })
  }

  setSecret(key: string, value: string) {
    const secrets = { ...(this.store.get("secrets") ?? {}), [key]: value }
    this.store.set("secrets", secrets)
  }

  getSecret(key: string): string | undefined {
    const secrets = this.store.get("secrets") ?? {}
    return secrets[key]
  }

  clearSecret(key: string) {
    const secrets = { ...(this.store.get("secrets") ?? {}) }
    delete secrets[key]
    this.store.set("secrets", secrets)
  }

  hasSecrets(): { apiKey: boolean; apiSecret: boolean } {
    const secrets = this.store.get("secrets") ?? {}
    return { apiKey: !!secrets.apiKey, apiSecret: !!secrets.apiSecret }
  }
}
