import type { MatchStatus } from './types'

/** Qué significó el último punto, del más chico al más grande. */
export type ScoreEvent = 'punto' | 'game' | 'set' | 'partido'

/** Compara el estado antes y después de un punto y dice qué se cerró con él. */
export function scoreEvent(prev: MatchStatus, next: MatchStatus): ScoreEvent {
  if (next.finished) return 'partido'
  if (next.sets.length > prev.sets.length) return 'set'
  const games = (s: MatchStatus) => s.games.A + s.games.B
  return games(next) > games(prev) ? 'game' : 'punto'
}
