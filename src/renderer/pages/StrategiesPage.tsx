import { useEffect, useState } from "react"
import PlaceholderPage from "../components/PlaceholderPage"

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<{ id: string; name: string; description: string }[]>([])

  useEffect(() => {
    if (window.api) void window.api.strategies.list().then(setStrategies)
  }, [])

  if (!strategies.length) {
    return <PlaceholderPage title="Strategies" description="Loading strategies..." />
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Strategies</h1>
      <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
        {strategies.map((s) => (
          <div key={s.id} className="panel" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--accent-teal)" }}>{s.name}</h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
