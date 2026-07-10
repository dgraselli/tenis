import type { PlayerId } from '../players/types'

export interface PlayerStats {
  playerId: PlayerId
  played: number
  won: number
  lost: number
  /** won / played. 0 si nunca jugó. */
  winRate: number
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  rating: number
}

export interface PairStats {
  /** Normalizada: ids ordenados, para que (Ana,Bea) y (Bea,Ana) sean la misma. */
  players: [PlayerId, PlayerId]
  played: number
  won: number
  lost: number
  winRate: number
  gamesDiff: number
}

/** Clave estable de una dupla, independiente del orden. */
export function pairKey(a: PlayerId, b: PlayerId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function pairFromKey(key: string): [PlayerId, PlayerId] {
  const [a, b] = key.split('|')
  return [a, b]
}
