import type { StoredMatch } from '../match/types'
import type { PlayerId } from '../players/types'
import { pairKey } from '../stats/types'
import type { PairHistory } from './types'

export const emptyHistory = (): PairHistory => ({ together: {}, against: {} })

/**
 * Distancia en partidos hacia atrás: 0 = una dupla ya sorteada hoy y todavía sin
 * jugar, 1 = el último partido jugado, y así. Ausente = nunca coincidieron.
 */
export function buildPairHistory(
  matches: StoredMatch[],
  pendingPairs: [PlayerId, PlayerId][] = [],
): PairHistory {
  const history = emptyHistory()

  // Lo ya sorteado hoy pesa más que cualquier partido del pasado.
  for (const [a, b] of pendingPairs) history.together[pairKey(a, b)] = 0

  const newestFirst = [...matches].sort((a, b) => b.playedAt.localeCompare(a.playedAt))

  newestFirst.forEach((match, index) => {
    const distance = index + 1
    const a = match.sides.A.players
    const b = match.sides.B.players

    for (const side of [a, b]) {
      if (side.length === 2) remember(history.together, side[0], side[1], distance)
    }
    for (const x of a) {
      for (const y of b) remember(history.against, x, y, distance)
    }
  })

  return history
}

function remember(
  bucket: Record<string, number>,
  a: PlayerId,
  b: PlayerId,
  distance: number,
): void {
  const key = pairKey(a, b)
  // Solo interesa la coincidencia más reciente.
  if (bucket[key] === undefined || distance < bucket[key]) bucket[key] = distance
}

/**
 * Penalización por repetir. 1 si coincidieron recién, tendiendo a 0 cuanto más
 * atrás fue, y exactamente 0 si nunca coincidieron.
 */
export function repeatCost(bucket: Record<string, number>, a: PlayerId, b: PlayerId): number {
  const distance = bucket[pairKey(a, b)]
  return distance === undefined ? 0 : 1 / (1 + distance)
}
