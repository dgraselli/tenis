import { useStore } from '../../app/store'
import { usePlayers } from '../../app/usePlayers'
import type { StoredMatch } from '../../domain/match/types'
import { playerName } from '../../domain/players/types'
import { describeRules, formatFinalScore } from '../../domain/scoring/format'
import { formatDuration } from '../../lib/duration'
import type { Side } from '../../domain/scoring/types'
import { Vacio } from '../components/Vacio'

export function HistoryScreen() {
  const { db, update } = useStore()
  const { players } = usePlayers()

  if (db.matches.length === 0) {
    return <Vacio>Todavía no jugaron ningún partido. Cuando terminen uno, aparece acá.</Vacio>
  }

  const recientes = [...db.matches].sort((a, b) => b.playedAt.localeCompare(a.playedAt))

  // El ranking y las estadísticas se derivan de los partidos: al eliminar
  // uno deja de contar en todos lados, sin nada más que actualizar.
  const eliminar = (id: string) =>
    update((d) => ({ ...d, matches: d.matches.filter((m) => m.id !== id) }))

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {recientes.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          nameOf={(id) => playerName(players, id)}
          onDelete={() => {
            if (confirm('¿Eliminar este partido? Deja de contar para el ranking y las estadísticas.')) {
              eliminar(match.id)
            }
          }}
        />
      ))}
    </div>
  )
}

function MatchCard({
  match,
  nameOf,
  onDelete,
}: {
  match: StoredMatch
  nameOf: (id: string) => string
  onDelete: () => void
}) {
  const winner = match.result.winner
  const loser: Side = winner === 'A' ? 'B' : 'A'
  const side = (s: Side) => match.sides[s].players.map(nameOf).join(' / ')

  return (
    <article className="rounded-xl bg-tarjeta p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-tinta-4">
          {formatDate(match.playedAt)}
          {match.durationSeconds !== undefined && ` · ${formatDuration(match.durationSeconds)}`}
        </span>
        {/* Las reglas están congeladas en el partido: cada uno muestra su propio formato. */}
        <span className="text-xs text-tinta-4">{describeRules(match.rules)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-acento-vivo">{side(winner)}</p>
          <p className="truncate text-tinta-3">{side(loser)}</p>
        </div>
        <p className="tabular shrink-0 text-2xl font-bold text-tinta">
          {formatFinalScore(match.result, winner)}
        </p>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 rounded-lg px-3 text-sm text-peligro"
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
