import { useStore } from '../../app/store'
import { usePlayers } from '../../app/usePlayers'
import type { StoredMatch } from '../../domain/match/types'
import { playerName } from '../../domain/players/types'
import { describeRules, formatFinalScore } from '../../domain/scoring/format'
import { formatDuration } from '../../lib/duration'
import type { Side } from '../../domain/scoring/types'
import { Vacio } from '../components/Vacio'

export function HistoryScreen() {
  const { db } = useStore()
  const { players } = usePlayers()

  if (db.matches.length === 0) {
    return <Vacio>Todavía no jugaron ningún partido. Cuando terminen uno, aparece acá.</Vacio>
  }

  const recientes = [...db.matches].sort((a, b) => b.playedAt.localeCompare(a.playedAt))

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {recientes.map((match) => (
        <MatchCard key={match.id} match={match} nameOf={(id) => playerName(players, id)} />
      ))}
    </div>
  )
}

function MatchCard({ match, nameOf }: { match: StoredMatch; nameOf: (id: string) => string }) {
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
