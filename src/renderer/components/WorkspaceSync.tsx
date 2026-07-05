import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { debouncedWorkspacePatch, persistEngineDraftFromStore, useWorkspaceStore } from "../stores/workspaceStore"
import { useEngineStore } from "../stores/engineStore"

/** Restore last route and auto-save navigation + engine draft changes. */
export default function WorkspaceSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const loaded = useWorkspaceStore((s) => s.loaded)
  const workspace = useWorkspaceStore((s) => s.workspace)
  const routeRestored = useRef(false)

  useEffect(() => {
    if (!loaded || routeRestored.current) return
    routeRestored.current = true
    const target = workspace?.lastRoute
    if (
      target &&
      target !== location.pathname &&
      target !== "/heatmap-lab" &&
      location.pathname !== "/heatmap-lab"
    ) {
      navigate(target, { replace: true })
    }
  }, [loaded, workspace?.lastRoute, location.pathname, navigate])

  useEffect(() => {
    if (!loaded) return
    debouncedWorkspacePatch({ lastRoute: location.pathname })
  }, [location.pathname, loaded])

  useEffect(() => {
    if (!loaded) return
    return useEngineStore.subscribe((state, prev) => {
      if (
        state.strategyId !== prev.strategyId ||
        state.params !== prev.params ||
        state.symbols !== prev.symbols ||
        state.interval !== prev.interval ||
        state.ensemble !== prev.ensemble
      ) {
        persistEngineDraftFromStore(state)
      }
    })
  }, [loaded])

  return null
}
