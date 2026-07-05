import { safeStorage } from "electron"
import type { SettingsService } from "./services/SettingsService"

const FALLBACK_PREFIX = "plain:"

let settingsService: SettingsService | null = null

export function initSecrets(service: SettingsService) {
  settingsService = service
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export function storeSecret(key: string, value: string): boolean {
  if (!settingsService) return false

  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value)
      settingsService.setSecret(key, encrypted.toString("base64"))
    } else {
      settingsService.setSecret(key, FALLBACK_PREFIX + Buffer.from(value).toString("base64"))
    }
    return true
  } catch (err) {
    console.error("[secrets] store failed:", err)
    return false
  }
}

export function readSecret(key: string): string | null {
  if (!settingsService) return null
  const stored = settingsService.getSecret(key)
  if (!stored) return null

  if (stored.startsWith(FALLBACK_PREFIX)) {
    try {
      return Buffer.from(stored.slice(FALLBACK_PREFIX.length), "base64").toString("utf8")
    } catch {
      return null
    }
  }

  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored, "base64"))
  } catch (err) {
    console.error("[secrets] decrypt failed:", err)
    return null
  }
}

export function clearSecret(key: string) {
  settingsService?.clearSecret(key)
}

export function hasStoredSecrets(): { apiKey: boolean; apiSecret: boolean } {
  if (!settingsService) return { apiKey: false, apiSecret: false }
  const raw = settingsService.hasSecrets()
  return {
    apiKey: raw.apiKey && !!readSecret("apiKey"),
    apiSecret: raw.apiSecret && !!readSecret("apiSecret")
  }
}
