import { describeRules } from '../../domain/scoring/format'
import { PRESETS, rulesForGames, validateRules } from '../../domain/scoring/types'
import type { MatchRules } from '../../domain/scoring/types'
import { Opcion } from './Vacio'

const SETS = [
  { setsToWin: 1, label: '1 set' },
  { setsToWin: 2, label: 'Mejor de 3 sets' },
  { setsToWin: 3, label: 'Mejor de 5 sets' },
]

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
            // El preset define el set; cuántos sets se juegan se elige aparte.
            onClick={() => onChange({ ...preset.rules, setsToWin: rules.setsToWin })}
          >
            {preset.label}
          </Opcion>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SETS.map(({ setsToWin, label }) => (
          <Opcion
            key={setsToWin}
            activa={rules.setsToWin === setsToWin}
            onClick={() => onChange({ ...rules, setsToWin })}
          >
            {label}
          </Opcion>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-3 text-sm text-tinta-3">
        Otro largo de set:
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={rules.gamesToWinSet}
          onChange={(e) =>
            onChange({ ...rulesForGames(Number(e.target.value)), setsToWin: rules.setsToWin })
          }
          className="tabular w-20 rounded-lg bg-tarjeta px-3 py-2 text-center text-tinta"
        />
        games
      </label>

      <label className="mt-3 flex items-center gap-3 text-sm text-tinta-3">
        <input
          type="checkbox"
          checked={rules.tiebreakAt !== null}
          onChange={(e) =>
            onChange({ ...rules, tiebreakAt: e.target.checked ? rules.gamesToWinSet : null })
          }
          className="size-5 accent-acento"
        />
        Con tie-break
      </label>

      <p className="mt-2 text-sm text-tinta-4">{describeRules(rules)}</p>
      {errors.map((e) => (
        <p key={e} className="mt-1 text-sm text-peligro">
          {e}
        </p>
      ))}
    </div>
  )
}
