import { newMatch, pointTo } from './engine'
import type { MatchRules, MatchStatus, Side } from './types'

/**
 * Partido en curso. La fuente de verdad es `pointLog`: `status` siempre es
 * `replay(pointLog)`. Guardar la secuencia de puntos en vez de snapshots hace
 * que deshacer sea imposible de desincronizar, y un set no pasa de ~180 puntos,
 * así que recomputar entero cuesta microsegundos.
 */
export interface LiveMatch {
  rules: MatchRules
  status: MatchStatus
  pointLog: Side[]
}

export function startLiveMatch(rules: MatchRules): LiveMatch {
  return { rules, status: newMatch(), pointLog: [] }
}

export function replay(pointLog: Side[], rules: MatchRules): MatchStatus {
  return pointLog.reduce((status, side) => pointTo(status, side, rules), newMatch())
}

export function applyPoint(match: LiveMatch, side: Side): LiveMatch {
  const status = pointTo(match.status, side, match.rules)
  // pointTo devuelve el mismo objeto si el partido ya terminó: no loguear.
  if (status === match.status) return match
  return { ...match, status, pointLog: [...match.pointLog, side] }
}

export function undo(match: LiveMatch): LiveMatch {
  if (match.pointLog.length === 0) return match
  const pointLog = match.pointLog.slice(0, -1)
  return { ...match, pointLog, status: replay(pointLog, match.rules) }
}

export function canUndo(match: LiveMatch): boolean {
  return match.pointLog.length > 0
}
