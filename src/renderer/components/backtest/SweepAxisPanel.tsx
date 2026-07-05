import { Button, Checkbox, FormControlLabel } from "@mui/material"
import type { ParamSweepAxis } from "../../../shared/backtestSweepTypes"
import { countParamSweepRuns } from "../../../shared/paramSweepUtils"
import "./sweep-axis-panel.css"

interface SweepAxisPanelProps {
  axes: ParamSweepAxis[]
  onChange: (axes: ParamSweepAxis[]) => void
  isEnsemble?: boolean
}

export default function SweepAxisPanel({ axes, onChange, isEnsemble }: SweepAxisPanelProps) {
  const update = (key: string, patch: Partial<ParamSweepAxis>) => {
    onChange(axes.map((a) => (a.key === key ? { ...a, ...patch } : a)))
  }

  const setAll = (enabled: boolean) => {
    onChange(axes.map((a) => ({ ...a, enabled })))
  }

  const enabledCount = axes.filter((a) => a.enabled).length
  const totalRuns = countParamSweepRuns(axes)

  return (
    <div className="sweep-axis-panel">
      <div className="sweep-axis-toolbar">
        <Button size="small" variant="outlined" onClick={() => setAll(true)}>
          Enable all
        </Button>
        <Button size="small" variant="outlined" onClick={() => setAll(false)}>
          Disable all
        </Button>
        <span className="sweep-axis-summary">
          {enabledCount}/{axes.length} active · {totalRuns.toLocaleString()} runs
        </span>
      </div>

      <div className="sweep-axis-grid">
        {axes.map((axis) => {
          const stepDelta = axis.steps <= 1 ? 0 : (axis.max - axis.min) / (axis.steps - 1)
          return (
            <div
              key={axis.key}
              className={`sweep-axis-card${axis.enabled ? " enabled" : ""}`}
            >
              <div className="sweep-axis-card-head">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={axis.enabled}
                      onChange={(e) => update(axis.key, { enabled: e.target.checked })}
                    />
                  }
                  label={<span className="sweep-axis-title">{axis.label}</span>}
                />
                {!isEnsemble && (
                  <span className="sweep-axis-key">{axis.key}</span>
                )}
              </div>

              <div className="sweep-axis-fields">
                <label>
                  <span>Min</span>
                  <input
                    type="number"
                    value={axis.min}
                    disabled={!axis.enabled}
                    onChange={(e) => update(axis.key, { min: parseFloat(e.target.value) || 0 })}
                  />
                </label>
                <label>
                  <span>Max</span>
                  <input
                    type="number"
                    value={axis.max}
                    disabled={!axis.enabled}
                    onChange={(e) => update(axis.key, { max: parseFloat(e.target.value) || 0 })}
                  />
                </label>
                <label>
                  <span>Steps</span>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={axis.steps}
                    disabled={!axis.enabled}
                    onChange={(e) =>
                      update(axis.key, { steps: Math.max(2, parseInt(e.target.value) || 2) })
                    }
                  />
                </label>
              </div>

              <div className="sweep-axis-footer">
                <span className="step-delta">Δ {stepDelta.toFixed(2)}</span>
                <div className="step-presets">
                  {[4, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!axis.enabled}
                      onClick={() => update(axis.key, { steps: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
