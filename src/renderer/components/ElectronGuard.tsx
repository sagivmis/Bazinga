import { Alert } from "@mui/material"

export default function ElectronGuard({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined" && !window.api) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <strong>Not running inside Electron.</strong> Close this browser tab and use the{" "}
        <strong>Bazinga — Algo Trading</strong> desktop window instead. Settings, API keys, and
        market data only work in the Electron app launched via <code>npm run dev</code>.
      </Alert>
    )
  }
  return <>{children}</>
}
