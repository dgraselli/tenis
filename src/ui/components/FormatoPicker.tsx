import { describeRules } from '../../domain/scoring/format'
import { PRESETS, rulesForGames, validateRules } from '../../domain/scoring/types'
import type { MatchRules } from '../../domain/scoring/types'
import { Opcion } from './Vacio'

/** Presets, largo de set a medida y tie-break. Lo usan el sorteo y el partido manual. */
export function FormatoPicker({
  rules,
  onChange,
}: {
  rules: MatchRules
  onChange: (rules: MatchRules) => void
}) {
  const errors = validateRules(rules)

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Opcion
            key={preset.label}
            activa={rules.gamesToWinSet === preset.rules.gamesToWinSet}
            onClick={() => onChange(preset.rules)}
          >
            {preset.label}
          </Opcion>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-3 text-sm text-slate-400">
        Otro largo de set:
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={rules.gamesToWinSet}
          onChange={(e) => onChange(rulesForGames(Number(e.target.value)))}
          className="tabular w-20 rounded-lg bg-slate-800 px-3 py-2 text-center text-slate-100"
        />
        games
      </label>

      <label className="mt-3 flex items-center gap-3 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={rules.tiebreakAt !== null}
          onChange={(e) =>
            onChange({ ...rules, tiebreakAt: e.target.checked ? rules.gamesToWinSet : null })
          }
          className="size-5 accent-emerald-500"
        />
        Con tie-break
      </label>

      <p className="mt-2 text-sm text-slate-500">{describeRules(rules)}</p>
      {errors.map((e) => (
        <p key={e} className="mt-1 text-sm text-rose-400">
          {e}
        </p>
      ))}
    </div>
  )
}
