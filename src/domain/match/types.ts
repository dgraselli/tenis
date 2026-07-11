import type { LiveMatch } from '../scoring/liveMatch'
import type { MatchRules, Side } from '../scoring/types'
import type { PlayerId } from '../players/types'
import { elapsedSeconds } from '../../lib/duration'

export type MatchFormat = 'singles' | 'doubles'

/** Un lado tiene 1 jugadora en singles y 2 en dobles. */
export interface MatchSide {
  players: [PlayerId] | [PlayerId, PlayerId]
}

export interface MatchResult {
  games: Record<Side, number>
  tiebreak?: Record<Side, number>
  winner: Side
}

export interface StoredMatch {
  id: string
  format: MatchFormat
  /**
   * Reglas congeladas al momento de jugar. Sin esto, cambiar el formato por
   * default reinterpretaría retroactivamente los partidos viejos.
   */
  rules: MatchRules
  sides: Record<Side, MatchSide>
  result: MatchResult
  playedAt: string
  /** Tiempo de juego. Los partidos anteriores a este campo no lo tienen. */
  durationSeconds?: number
  pointLog?: Side[]
}

/** Partido en curso: se guarda para poder retomarlo si se cierra la app. */
export interface ActiveMatch {
  id: string
  format: MatchFormat
  sides: Record<Side, MatchSide>
  startedAt: string
  /** Quién sacó primero: con esto el saque se deriva del marcador. */
  firstServer: Side
  live: LiveMatch
}

export function formatOf(sides: Record<Side, MatchSide>): MatchFormat {
  return sides.A.players.length === 2 ? 'doubles' : 'singles'
}

export function sidePlayers(match: StoredMatch | ActiveMatch, side: Side): PlayerId[] {
  return match.sides[side].players
}

/** El lado en el que jugó una jugadora, o null si no jugó ese partido. */
export function sideOfPlayer(match: StoredMatch, id: PlayerId): Side | null {
  if (match.sides.A.players.includes(id)) return 'A'
  if (match.sides.B.players.includes(id)) return 'B'
  return null
}

export function finishMatch(active: ActiveMatch, playedAt = new Date().toISOString()): StoredMatch {
  const { status } = active.live
  if (!status.finished || status.winner === null) {
    throw new Error('El partido todavía no terminó')
  }
  return {
    id: active.id,
    format: active.format,
    rules: active.live.rules,
    sides: active.sides,
    result: {
      games: status.games,
      ...(status.tiebreak ? { tiebreak: status.tiebreak } : {}),
      winner: status.winner,
    },
    playedAt,
    durationSeconds: elapsedSeconds(active.startedAt, new Date(playedAt).getTime()),
    pointLog: active.live.pointLog,
  }
}
