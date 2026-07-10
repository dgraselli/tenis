import type {
  GamePointIndex,
  GameScore,
  MatchRules,
  MatchStatus,
  Side,
  TiebreakScore,
} from './types'

export function otherSide(side: Side): Side {
  return side === 'A' ? 'B' : 'A'
}

export function newMatch(): MatchStatus {
  return {
    games: { A: 0, B: 0 },
    current: { phase: 'game', points: { A: 0, B: 0 }, advantage: null },
    winner: null,
    finished: false,
  }
}

/**
 * Aplica un punto ganado por `side`. Pura: no muta `status`.
 * Sobre un partido terminado devuelve el mismo objeto, sin cambios.
 */
export function pointTo(status: MatchStatus, side: Side, rules: MatchRules): MatchStatus {
  if (status.finished || status.current === null) return status
  const loser = otherSide(side)
  return status.current.phase === 'tiebreak'
    ? applyTiebreakPoint(status, status.current, side, loser, rules)
    : applyGamePoint(status, status.current, side, loser, rules)
}

function applyGamePoint(
  status: MatchStatus,
  game: GameScore,
  side: Side,
  loser: Side,
  rules: MatchRules,
): MatchStatus {
  const p = game.points

  // Deuce y ventaja. Esta rama va PRIMERO: si se evaluara después de
  // "tengo 40 y gano el punto -> game", un 40-40 cerraría el game mal.
  if (p[side] === 3 && p[loser] === 3) {
    if (game.advantage === null) {
      return { ...status, current: { ...game, advantage: side } }
    }
    if (game.advantage === side) {
      return winGame(status, side, rules)
    }
    // Tenía la ventaja el rival y la pierde: vuelve a deuce.
    return { ...status, current: { ...game, advantage: null } }
  }

  // 40 contra menos de 40: el punto cierra el game.
  if (p[side] === 3) {
    return winGame(status, side, rules)
  }

  // Avance normal 0 -> 15 -> 30 -> 40.
  return {
    ...status,
    current: {
      ...game,
      points: { ...p, [side]: (p[side] + 1) as GamePointIndex },
    },
  }
}

function applyTiebreakPoint(
  status: MatchStatus,
  tb: TiebreakScore,
  side: Side,
  loser: Side,
  rules: MatchRules,
): MatchStatus {
  const points = { ...tb.points, [side]: tb.points[side] + 1 }

  // Gana con >= tiebreakTo y diferencia >= tiebreakMargin.
  // Cubre 7-0..7-5 y las prolongaciones 8-6, 9-7, 12-10...
  if (points[side] >= rules.tiebreakTo && points[side] - points[loser] >= rules.tiebreakMargin) {
    return {
      games: { ...status.games, [side]: status.games[side] + 1 },
      current: null,
      winner: side,
      finished: true,
      tiebreak: points,
    }
  }

  return { ...status, current: { phase: 'tiebreak', points } }
}

/**
 * Cierra un game y decide qué sigue: fin del set, tie-break, o game nuevo.
 * Las dos condiciones se leen de las reglas, sin números cableados: por eso
 * un set a 4 games funciona sin tocar nada.
 */
function winGame(status: MatchStatus, side: Side, rules: MatchRules): MatchStatus {
  const games = { ...status.games, [side]: status.games[side] + 1 }
  const won = games[side]
  const lost = games[otherSide(side)]

  // Set ganado: llegó al largo del set con la diferencia mínima.
  // Con el default cubre 6-0..6-4 y también 7-5.
  if (won >= rules.gamesToWinSet && won - lost >= rules.gamesMargin) {
    return { games, current: null, winner: side, finished: true }
  }

  // Empate en el umbral del tie-break.
  if (rules.tiebreakAt !== null && won === rules.tiebreakAt && lost === rules.tiebreakAt) {
    return {
      games,
      current: { phase: 'tiebreak', points: { A: 0, B: 0 } },
      winner: null,
      finished: false,
    }
  }

  // 6-5 no cierra (diferencia 1): el set sigue con otro game.
  return {
    games,
    current: { phase: 'game', points: { A: 0, B: 0 }, advantage: null },
    winner: null,
    finished: false,
  }
}
