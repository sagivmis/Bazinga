import Store from "electron-store"
import type { AppWorkspace } from "../../shared/types"
import { defaultWorkspace, mergeWorkspace } from "../../shared/workspaceUtils"

type StoreSchema = {
  workspace: AppWorkspace
}

export class WorkspaceStore {
  private store = new Store<StoreSchema>({
    name: "bazinga-workspace",
    defaults: { workspace: defaultWorkspace() }
  })

  get(): AppWorkspace {
    const saved = this.store.get("workspace")
    return mergeWorkspace(defaultWorkspace(), saved ?? {})
  }

  patch(partial: Partial<AppWorkspace>): AppWorkspace {
    const next = mergeWorkspace(this.get(), partial)
    this.store.set("workspace", next)
    return next
  }

  reset(): AppWorkspace {
    const fresh = defaultWorkspace()
    this.store.set("workspace", fresh)
    return fresh
  }
}
