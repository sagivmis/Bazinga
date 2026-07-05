import { useState } from "react"
import {
  Alert,
  Button,
  IconButton,
  Slider,
  Stack,
  Switch,
  Typography
} from "@mui/material"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import AddIcon from "@mui/icons-material/Add"
import type { EnsembleMemberConfig, StrategyParams } from "../../shared/types"
import { ENSEMBLE_STRATEGY_ID } from "../../../shared/ensembleUtils"
import { schemaWithoutLeverage } from "../../../shared/leverageUtils"
import {
  CompactField,
  FormSection,
  StrategyParamsGrid
} from "../forms/CompactField"

type BaseStrategyMeta = {
  id: string
  name: string
  params: { key: string; label: string; type: string; default: unknown; min?: number; max?: number }[]
  defaultParams?: StrategyParams
}

interface EnsembleBuilderProps {
  members: EnsembleMemberConfig[]
  baseStrategies: BaseStrategyMeta[]
  onChange: (members: EnsembleMemberConfig[]) => void
}

export default function EnsembleBuilder({
  members,
  baseStrategies,
  onChange
}: EnsembleBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const totalWeight = members
    .filter((m) => m.enabled !== false)
    .reduce((s, m) => s + m.weight, 0)

  const addMember = () => {
    const used = new Set(members.map((m) => m.strategyId))
    const next = baseStrategies.find((s) => !used.has(s.id) && s.id !== ENSEMBLE_STRATEGY_ID)
    if (!next) return
    onChange([
      ...members,
      {
        strategyId: next.id,
        weight: 20,
        enabled: true,
        params: { ...(next.defaultParams ?? {}) }
      }
    ])
  }

  const removeMember = (strategyId: string) => {
    onChange(members.filter((m) => m.strategyId !== strategyId))
  }

  const updateMember = (strategyId: string, patch: Partial<EnsembleMemberConfig>) => {
    onChange(members.map((m) => (m.strategyId === strategyId ? { ...m, ...patch } : m)))
  }

  const updateMemberParam = (strategyId: string, key: string, value: number | string) => {
    onChange(
      members.map((m) =>
        m.strategyId === strategyId
          ? { ...m, params: { ...m.params, [key]: value } }
          : m
      )
    )
  }

  return (
    <FormSection
      title="Ensemble members"
      description={`Weighted voting — active total: ${totalWeight}. Hover param labels for full names.`}
    >
      {members.map((member) => {
        const meta = baseStrategies.find((s) => s.id === member.strategyId)
        const isOpen = expandedId === member.strategyId
        const subParams = schemaWithoutLeverage(
          meta?.params.filter(
            (p) =>
              p.type === "number" &&
              !["notionalUsd", "stopLossPct", "takeProfitPct", "cooldownBars"].includes(p.key)
          ) ?? []
        )

        return (
          <div
            key={member.strategyId}
            className="panel"
            style={{ padding: "10px 12px", marginBottom: 8 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <Switch
                size="small"
                checked={member.enabled !== false}
                onChange={(e) => updateMember(member.strategyId, { enabled: e.target.checked })}
              />
              <CompactField
                select
                label="Strategy"
                value={member.strategyId}
                onChange={(e) => {
                  const strat = baseStrategies.find((s) => s.id === e.target.value)
                  if (!strat) return
                  updateMember(member.strategyId, {
                    strategyId: strat.id,
                    params: { ...(strat.defaultParams ?? {}) }
                  })
                }}
                options={baseStrategies.map((s) => ({ value: s.id, label: s.name }))}
                sx={{ minWidth: 160, maxWidth: 220, flex: "1 1 160px" }}
              />
              <Typography
                variant="caption"
                sx={{ minWidth: 28, textAlign: "right", color: "var(--accent-teal)", fontWeight: 600 }}
              >
                {member.weight}
              </Typography>
              <Slider
                size="small"
                value={member.weight}
                min={0}
                max={100}
                step={5}
                onChange={(_, v) => updateMember(member.strategyId, { weight: v as number })}
                sx={{ width: 100, flex: "0 1 100px" }}
              />
              <IconButton
                size="small"
                onClick={() => setExpandedId(isOpen ? null : member.strategyId)}
                title="Sub-strategy params"
              >
                ⚙
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeMember(member.strategyId)}
                disabled={members.length <= 1}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>

            {isOpen && subParams && subParams.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <StrategyParamsGrid
                  fields={subParams.slice(0, 8)}
                  values={member.params}
                  onChange={(key, value) => updateMemberParam(member.strategyId, key, value)}
                />
              </div>
            )}
          </div>
        )
      })}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={addMember}
        disabled={members.length >= baseStrategies.length}
        sx={{ mt: 0.5 }}
      >
        Add strategy
      </Button>

      {totalWeight <= 0 && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          Enable at least one member with weight &gt; 0.
        </Alert>
      )}
    </FormSection>
  )
}
