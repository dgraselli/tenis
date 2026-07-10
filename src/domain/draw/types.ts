import type { MatchFormat } from '../match/types'
import type { PlayerId } from '../players/types'

export type DrawStrategy = 'azar' | 'sin-repetir' | 'nivelado'

export const STRATEGY_LABELS: Record<DrawStrategy, string> = {
  azar: 'Azar puro',
  'sin-repetir': 'Sin repetir duplas',
  nivelado: 'Nivelado',
}

export const STRATEGY_HINTS: Record<DrawStrategy, string> = {
  azar: 'Se mezcla y se reparte. Transparente, sin sorpresas.',
  'sin-repetir': 'Prioriza duplas que hace rato no juegan juntas, para que todas roten con todas.',
  nivelado: 'Junta a la mejor con la que menos ganó, para que los partidos sean parejos.',
}

export interface PresentPlayer {
  playerId: PlayerId
  rating: number
  /** Cuántas veces descansó hoy. Hace que el descanso rote. */
  restsToday: number
}

export interface DrawMatch {
  format: MatchFormat
  sideA: PlayerId[]
  sideB: PlayerId[]
}

export interface DrawResult {
  matches: DrawMatch[]
  /** 0 o 1 jugadora: solo descansa alguien cuando el número es impar. */
  resting: PlayerId[]
}

/** Hace cuántos partidos jugó junta / enfrentada cada dupla. Ausente = nunca. */
export interface PairHistory {
  together: Record<string, number>
  against: Record<string, number>
}

export interface DrawInput {
  present: PresentPlayer[]
  strategy: DrawStrategy
  history?: PairHistory
  /** Solo 'nivelado': cuánto se perturban los ratings antes de ordenar. */
  jitterPct?: number
  /** Inyectable para tests deterministas. */
  rng?: () => number
}
