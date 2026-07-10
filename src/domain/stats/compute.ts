import type { StoredMatch } from '../match/types'
import { sideOfPlayer } from '../match/types'
import type { Player, PlayerId } from '../players/types'
import { otherSide } from '../scoring/engine'
import { ratingFor } from './rating'
import { pairFromKey, pairKey } from './types'
import type { PairStats, PlayerStats } from './types'

/** Partidos mínimos juntas para entrar al ranking de duplas. */
export const MIN_PAIR_MATCHES = 3

function emptyStats(playerId: PlayerId): PlayerStats {
  return {
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    winRate: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    gamesDiff: 0,
    rating: 0,
  }
}

/**
 * Se computa al vuelo desde el historial: el ranking no se persiste. Guardar
 * agregados obligaría a invalidarlos cada vez que se corrige o borra un
 * partido, sin ningún beneficio a esta escala.
 */
export function computePlayerStats(matches: StoredMatch[], players: Player[]): PlayerStats[] {
  const byId = new Map<PlayerId, PlayerStats>()
  for (const p of players) byId.set(p.id, emptyStats(p.id))

  for (const match of matches) {
    for (const side of ['A', 'B'] as const) {
      for (const id of match.sides[side].players) {
        const s = byId.get(id) ?? emptyStats(id)
        byId.set(id, s)

        s.played += 1
        if (match.result.winner === side) s.won += 1
        else s.lost += 1
        s.gamesFor += match.result.games[side]
        s.gamesAgainst += match.result.games[otherSide(side)]
      }
    }
  }

  const seedOf = new Map(players.map((p) => [p.id, p.seedRating]))

  return [...byId.values()].map((s) => {
    s.gamesDiff = s.gamesFor - s.gamesAgainst
    s.winRate = s.played === 0 ? 0 : s.won / s.played
    s.rating = ratingFor({
      played: s.played,
      won: s.won,
      gamesDiff: s.gamesDiff,
      seedRating: seedOf.get(s.playerId),
    })
    return s
  })
}

/** Solo dobles: en singles no hay dupla. */
export function computePairStats(matches: StoredMatch[]): PairStats[] {
  const byKey = new Map<string, PairStats>()

  for (const match of matches) {
    if (match.format !== 'doubles') continue

    for (const side of ['A', 'B'] as const) {
      const [a, b] = match.sides[side].players
      if (b === undefined) continue

      const key = pairKey(a, b)
      const s = byKey.get(key) ?? {
        players: pairFromKey(key),
        played: 0,
        won: 0,
        lost: 0,
        winRate: 0,
        gamesDiff: 0,
      }
      byKey.set(key, s)

      s.played += 1
      if (match.result.winner === side) s.won += 1
      else s.lost += 1
      s.gamesDiff += match.result.games[side] - match.result.games[otherSide(side)]
    }
  }

  for (const s of byKey.values()) s.winRate = s.won / s.played
  return [...byKey.values()]
}

/** Ranking individual: primero el mejor rating, desempate por diferencia de games. */
export function rankPlayers(stats: PlayerStats[]): PlayerStats[] {
  return [...stats].sort((a, b) => b.rating - a.rating || b.gamesDiff - a.gamesDiff)
}

/**
 * Las duplas que mejor funcionan juntas. Se exige un mínimo de partidos: si no,
 * una dupla que jugó una sola vez y ganó encabezaría la tabla.
 */
export function bestPairs(pairs: PairStats[], minPlayed = MIN_PAIR_MATCHES): PairStats[] {
  return pairs
    .filter((p) => p.played >= minPlayed)
    .sort((a, b) => b.winRate - a.winRate || b.gamesDiff - a.gamesDiff)
}

/** Cara a cara entre dos jugadoras: partidos en que estuvieron en lados opuestos. */
export function headToHead(
  matches: StoredMatch[],
  a: PlayerId,
  b: PlayerId,
): { aWins: number; bWins: number } {
  let aWins = 0
  let bWins = 0

  for (const match of matches) {
    const sa = sideOfPlayer(match, a)
    const sb = sideOfPlayer(match, b)
    if (sa === null || sb === null || sa === sb) continue
    if (match.result.winner === sa) aWins += 1
    else bWins += 1
  }

  return { aWins, bWins }
}
