import type { CurrentGame, MatchRules, Side } from './types'

const POINT_LABELS = ['0', '15', '30', '40'] as const

/** Lo que se muestra grande, debajo del marcador de games. */
export function formatPoint(current: CurrentGame, side: Side): string {
  if (current.phase === 'tiebreak') return String(current.points[side])

  if (current.advantage !== null) {
    return current.advantage === side ? 'Ad' : '40'
  }
  return POINT_LABELS[current.points[side]]
}

/** "Deuce", "Ventaja Ana", "Tie-break"... para el subtítulo de la pantalla. */
export function describeGame(current: CurrentGame | null, nameOf: (s: Side) => string): string {
  if (current === null) return 'Partido terminado'
  if (current.phase === 'tiebreak') return 'Tie-break'
  if (current.advantage !== null) return `Ventaja ${nameOf(current.advantage)}`
  if (current.points.A === 3 && current.points.B === 3) return 'Deuce'
  return ''
}

/**
 * "6-4", o "7-6 (7-5)" si hubo tie-break. Acepta tanto el estado vivo como el
 * resultado guardado: a los dos les alcanza con tener games y tie-break.
 */
export interface Scoreline {
  games: Record<Side, number>
  tiebreak?: Record<Side, number>
}

export function formatFinalScore(score: Scoreline, from: Side = 'A'): string {
  const to: Side = from === 'A' ? 'B' : 'A'
  const games = `${score.games[from]}-${score.games[to]}`
  if (!score.tiebreak) return games
  return `${games} (${score.tiebreak[from]}-${score.tiebreak[to]})`
}

/** "Set a 6 games", "Set a 4 games, sin tie-break". */
export function describeRules(rules: MatchRules): string {
  const base = `Set a ${rules.gamesToWinSet} games`
  if (rules.tiebreakAt === null) return `${base}, sin tie-break`
  if (rules.tiebreakAt === rules.gamesToWinSet) return base
  return `${base}, tie-break en ${rules.tiebreakAt}-${rules.tiebreakAt}`
}
