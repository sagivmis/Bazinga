import Store from "electron-store"
import type { AlgoSetup, AlgoSetupInput } from "../../shared/types"
import { setupFingerprint } from "../../shared/setupUtils"

const MAX_SETUPS = 80

type StoreSchema = {
  setups: AlgoSetup[]
}

export class SetupStore {
  private store = new Store<StoreSchema>({
    name: "bazinga-setups",
    defaults: { setups: [] }
  })

  list(): AlgoSetup[] {
    return this.store.get("setups") ?? []
  }

  listRecent(limit = 40): AlgoSetup[] {
    return [...this.list()].sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, limit)
  }

  listSaved(): AlgoSetup[] {
    return [...this.list()]
      .filter((s) => s.saved)
      .sort((a, b) => {
        const nameA = a.name ?? ""
        const nameB = b.name ?? ""
        if (nameA && nameB) return nameA.localeCompare(nameB)
        return b.lastUsedAt - a.lastUsedAt
      })
  }

  get(id: string): AlgoSetup | null {
    return this.list().find((s) => s.id === id) ?? null
  }

  private persist(setups: AlgoSetup[]) {
    this.store.set("setups", setups.slice(0, MAX_SETUPS))
  }

  private cloneInput(input: AlgoSetupInput): Omit<AlgoSetup, "id" | "createdAt" | "lastUsedAt"> {
    return {
      name: input.name,
      strategyId: input.strategyId,
      params: { ...input.params },
      symbols: input.symbols.map((s) => s.toUpperCase()),
      interval: input.interval,
      ensemble: input.ensemble?.map((m) => ({
        ...m,
        params: { ...(m.params ?? {}) }
      })),
      favorite: input.favorite ?? false,
      saved: input.saved ?? false,
      source: input.source
    }
  }

  /** Add or bump a setup in recent history (deduped by config fingerprint). */
  record(input: AlgoSetupInput): AlgoSetup {
    const fp = setupFingerprint(input)
    const setups = this.list()
    const idx = setups.findIndex((s) => setupFingerprint(s) === fp)
    const now = Date.now()

    if (idx >= 0) {
      const existing = { ...setups[idx] }
      existing.lastUsedAt = now
      existing.source = input.source
      if (input.saved) {
        existing.saved = true
        if (input.name) existing.name = input.name
      }
      setups.splice(idx, 1)
      setups.unshift(existing)
      this.persist(setups)
      return existing
    }

    const setup: AlgoSetup = {
      id: `setup-${now}-${Math.random().toString(36).slice(2, 9)}`,
      ...this.cloneInput(input),
      createdAt: now,
      lastUsedAt: now
    }
    setups.unshift(setup)
    this.persist(setups)
    return setup
  }

  /** Save a setup with a user-provided name (creates or updates existing match). */
  saveAs(input: AlgoSetupInput & { name: string }): AlgoSetup {
    const fp = setupFingerprint(input)
    const setups = this.list()
    const idx = setups.findIndex((s) => setupFingerprint(s) === fp)
    const now = Date.now()
    const name = input.name.trim()

    if (idx >= 0) {
      const existing = { ...setups[idx] }
      existing.saved = true
      existing.name = name
      existing.lastUsedAt = now
      existing.source = "saved"
      setups.splice(idx, 1)
      setups.unshift(existing)
      this.persist(setups)
      return existing
    }

    const setup: AlgoSetup = {
      id: `setup-${now}-${Math.random().toString(36).slice(2, 9)}`,
      ...this.cloneInput({ ...input, saved: true, source: "saved" }),
      name,
      saved: true,
      source: "saved",
      createdAt: now,
      lastUsedAt: now
    }
    setups.unshift(setup)
    this.persist(setups)
    return setup
  }

  touch(id: string): AlgoSetup | null {
    const setups = this.list()
    const idx = setups.findIndex((s) => s.id === id)
    if (idx < 0) return null
    const setup = { ...setups[idx], lastUsedAt: Date.now() }
    setups.splice(idx, 1)
    setups.unshift(setup)
    this.persist(setups)
    return setup
  }

  toggleFavorite(id: string): AlgoSetup | null {
    const setups = this.list()
    const idx = setups.findIndex((s) => s.id === id)
    if (idx < 0) return null
    setups[idx] = { ...setups[idx], favorite: !setups[idx].favorite }
    this.persist(setups)
    return setups[idx]
  }

  rename(id: string, name: string): AlgoSetup | null {
    const setups = this.list()
    const idx = setups.findIndex((s) => s.id === id)
    if (idx < 0) return null
    setups[idx] = { ...setups[idx], name: name.trim(), saved: true }
    this.persist(setups)
    return setups[idx]
  }

  remove(id: string): boolean {
    const setups = this.list()
    const next = setups.filter((s) => s.id !== id)
    if (next.length === setups.length) return false
    this.persist(next)
    return true
  }
}
