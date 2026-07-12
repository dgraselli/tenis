import type { CurrentGame, MatchRules, SetResult, Side } from './types'

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

/** "6-4", o "7-6 (7-5)" si el set se definió en tie-break. */
export function formatSet(set: SetResult, from: Side = 'A'): string {
  const to: Side = from === 'A' ? 'B' : 'A'
  const games = `${set.games[from]}-${set.games[to]}`
  if (!set.tiebreak) return games
  return `${games} (${set.tiebreak[from]}-${set.tiebreak[to]})`
}

/**
 * "6-4", o "6-4 3-6 7-5" si fue a más de un set. Acepta tanto el estado vivo
 * como el resultado guardado: a los dos les alcanza con tener los sets.
 */
export function formatFinalScore(score: { sets: SetResult[] }, from: Side = 'A'): string {
  return score.sets.map((set) => formatSet(set, from)).join(' ')
}

/** "Set a 6 games", "Al mejor de 3 sets a 6 games, sin tie-break"... */
export function describeRules(rules: MatchRules): string {
  const sets = rules.setsToWin > 1 ? `Al mejor de ${rules.setsToWin * 2 - 1} sets a` : 'Set a'
  const base = `${sets} ${rules.gamesToWinSet} games`
  if (rules.tiebreakAt === null) return `${base}, sin tie-break`
  if (rules.tiebreakAt === rules.gamesToWinSet) return base
  return `${base}, tie-break en ${rules.tiebreakAt}-${rules.tiebreakAt}`
}
