/** Los dos lados de la cancha. En singles y dobles el motor es el mismo. */
export type Side = 'A' | 'B'

/** 0/15/30/40 representados como 0/1/2/3 para poder avanzar con enteros. */
export type GamePointIndex = 0 | 1 | 2 | 3

export interface GameScore {
  phase: 'game'
  points: Record<Side, GamePointIndex>
  /**
   * La ventaja no es un cuarto valor de GamePointIndex: vive acá para no
   * ensuciar la aritmética de 0 -> 15 -> 30 -> 40.
   * null = deuce, o todavía no hay deuce.
   */
  advantage: Side | null
}

export interface TiebreakScore {
  phase: 'tiebreak'
  /** Enteros sin techo: un tie-break puede terminar 9-7, 12-10... */
  points: Record<Side, number>
}

export type CurrentGame = GameScore | TiebreakScore

export interface MatchStatus {
  games: Record<Side, number>
  /** null solo cuando el partido terminó. */
  current: CurrentGame | null
  winner: Side | null
  finished: boolean
  /** Marcador final del tie-break, si lo hubo. Se conserva al cerrar el partido. */
  tiebreak?: Record<Side, number>
}

export interface MatchRules {
  /** Games para ganar el set. 6 normal, 4 corto, 8 pro-set. */
  gamesToWinSet: number
  /** Diferencia mínima de games para cerrar el set. */
  gamesMargin: number
  /** Games iguales que disparan el tie-break. null = sin tie-break. */
  tiebreakAt: number | null
  tiebreakTo: number
  tiebreakMargin: number
}

export const DEFAULT_RULES: MatchRules = {
  gamesToWinSet: 6,
  gamesMargin: 2,
  tiebreakAt: 6,
  tiebreakTo: 7,
  tiebreakMargin: 2,
}

/** Reglas para un set de X games, con tie-break en X-X. */
export function rulesForGames(gamesToWinSet: number): MatchRules {
  return { ...DEFAULT_RULES, gamesToWinSet, tiebreakAt: gamesToWinSet }
}

export interface RulePreset {
  label: string
  rules: MatchRules
}

export const PRESETS: RulePreset[] = [
  { label: 'Set corto (4 games)', rules: rulesForGames(4) },
  { label: 'Set normal (6 games)', rules: rulesForGames(6) },
  { label: 'Pro-set (8 games)', rules: rulesForGames(8) },
]

/**
 * Valida las reglas antes de crear el partido. El motor asume reglas válidas:
 * no vuelve a chequear en cada punto.
 */
export function validateRules(r: MatchRules): string[] {
  const errors: string[] = []
  if (!Number.isInteger(r.gamesToWinSet) || r.gamesToWinSet < 1) {
    errors.push('El set tiene que ser de al menos 1 game.')
  }
  if (!Number.isInteger(r.gamesMargin) || r.gamesMargin < 1) {
    errors.push('La diferencia de games tiene que ser de al menos 1.')
  }
  if (r.tiebreakAt !== null) {
    if (!Number.isInteger(r.tiebreakAt) || r.tiebreakAt < 1) {
      errors.push('El tie-break tiene que dispararse en un número de games válido.')
    } else if (r.tiebreakAt < r.gamesToWinSet - 1) {
      // Si se disparara antes, el set nunca llegaría a gamesToWinSet.
      errors.push('El tie-break no puede dispararse tan temprano: el set nunca llegaría a su largo.')
    }
    if (!Number.isInteger(r.tiebreakTo) || r.tiebreakTo < 1) {
      errors.push('El tie-break tiene que ser a al menos 1 punto.')
    }
    if (!Number.isInteger(r.tiebreakMargin) || r.tiebreakMargin < 1) {
      errors.push('La diferencia del tie-break tiene que ser de al menos 1.')
    }
  }
  return errors
}
