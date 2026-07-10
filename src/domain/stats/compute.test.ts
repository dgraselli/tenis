import { describe, expect, it } from 'vitest'
import { bestPairs, computePairStats, computePlayerStats, headToHead, rankPlayers } from './compute'
import { baseRating, ratingFor } from './rating'
import { pairKey } from './types'
import type { StoredMatch } from '../match/types'
import type { Player } from '../players/types'
import { DEFAULT_RULES } from '../scoring/types'

function player(id: string, seedRating?: number): Player {
  return { id, name: id, active: true, createdAt: '2026-01-01T00:00:00.000Z', seedRating }
}

let seq = 0
function match(a: string[], b: string[], gamesA: number, gamesB: number): StoredMatch {
  return {
    id: `m${seq++}`,
    format: a.length === 2 ? 'doubles' : 'singles',
    rules: DEFAULT_RULES,
    sides: {
      A: { players: a as [string] | [string, string] },
      B: { players: b as [string] | [string, string] },
    },
    result: { games: { A: gamesA, B: gamesB }, winner: gamesA > gamesB ? 'A' : 'B' },
    playedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('rating', () => {
  it('nadie que jugó nada arranca en 50', () => {
    expect(baseRating({ played: 0, won: 0, gamesDiff: 0 })).toBeCloseTo(50)
  })

  it('ganar el primer partido da 58, no 100', () => {
    expect(baseRating({ played: 1, won: 1, gamesDiff: 0 })).toBeCloseTo(58.33, 1)
  })

  it('perder el primer partido da 41, no 0', () => {
    expect(baseRating({ played: 1, won: 0, gamesDiff: 0 })).toBeCloseTo(41.67, 1)
  })

  it('converge al desempeño real cuando hay historia', () => {
    expect(baseRating({ played: 25, won: 18, gamesDiff: 0 })).toBeCloseTo(68.33, 1)
    // 180 de 200 es 90% real; el prior ya casi no lo mueve.
    expect(baseRating({ played: 200, won: 180, gamesDiff: 0 })).toBeCloseTo(89.02, 1)
  })

  it('el seedRating actúa de prior y se diluye al jugar', () => {
    expect(baseRating({ played: 0, won: 0, gamesDiff: 0, seedRating: 80 })).toBeCloseTo(80)
    // Con 20 partidos al 50%, el prior alto todavía arrastra unos puntos...
    expect(baseRating({ played: 20, won: 10, gamesDiff: 0, seedRating: 80 })).toBeCloseTo(56)
    // ...pero con 100 ya casi no se nota.
    expect(baseRating({ played: 100, won: 50, gamesDiff: 0, seedRating: 80 })).toBeCloseTo(51.4, 1)
  })

  it('la diferencia de games mueve el rating, pero poco y con techo', () => {
    const base = baseRating({ played: 10, won: 5, gamesDiff: 0 })
    expect(ratingFor({ played: 10, won: 5, gamesDiff: 0 })).toBeCloseTo(base)
    expect(ratingFor({ played: 10, won: 5, gamesDiff: 20 })).toBeCloseTo(base + 5)
    // El techo evita que una goleada aislada distorsione todo.
    expect(ratingFor({ played: 10, won: 5, gamesDiff: 999 })).toBeCloseTo(base + 5)
    expect(ratingFor({ played: 10, won: 5, gamesDiff: -999 })).toBeCloseTo(base - 5)
  })

  it('nunca se sale de 0-100', () => {
    expect(ratingFor({ played: 50, won: 50, gamesDiff: 300 })).toBeLessThanOrEqual(100)
    expect(ratingFor({ played: 50, won: 0, gamesDiff: -300 })).toBeGreaterThanOrEqual(0)
  })
})

describe('computePlayerStats', () => {
  const players = [player('ana'), player('bea'), player('lu'), player('vero')]

  it('cuenta partidos, victorias y games de cada lado', () => {
    const matches = [
      match(['ana', 'bea'], ['lu', 'vero'], 6, 4),
      match(['ana', 'lu'], ['bea', 'vero'], 3, 6),
    ]
    const byId = new Map(computePlayerStats(matches, players).map((s) => [s.playerId, s]))

    expect(byId.get('ana')).toMatchObject({ played: 2, won: 1, lost: 1, winRate: 0.5 })
    expect(byId.get('ana')!.gamesFor).toBe(6 + 3)
    expect(byId.get('ana')!.gamesAgainst).toBe(4 + 6)
    expect(byId.get('ana')!.gamesDiff).toBe(-1)

    expect(byId.get('vero')).toMatchObject({ played: 2, won: 1, lost: 1 })
    expect(byId.get('bea')).toMatchObject({ played: 2, won: 2, lost: 0, winRate: 1 })
  })

  it('incluye a las jugadoras que todavía no jugaron', () => {
    const stats = computePlayerStats([], players)
    expect(stats).toHaveLength(4)
    expect(stats.every((s) => s.played === 0 && s.rating === 50)).toBe(true)
  })

  it('el ranking ordena por rating', () => {
    const matches = [match(['ana'], ['lu'], 6, 0), match(['ana'], ['lu'], 6, 1)]
    const ranked = rankPlayers(computePlayerStats(matches, players))
    expect(ranked[0].playerId).toBe('ana')
    expect(ranked.at(-1)!.playerId).toBe('lu')
  })
})

describe('computePairStats', () => {
  it('trata (ana,bea) y (bea,ana) como la misma dupla', () => {
    const matches = [
      match(['ana', 'bea'], ['lu', 'vero'], 6, 4),
      match(['bea', 'ana'], ['lu', 'vero'], 2, 6),
    ]
    const pairs = computePairStats(matches)
    const anaBea = pairs.find((p) => pairKey(...p.players) === pairKey('ana', 'bea'))

    expect(anaBea).toMatchObject({ played: 2, won: 1, lost: 1, winRate: 0.5 })
    expect(anaBea!.gamesDiff).toBe(2 - 4) // (6-4) + (2-6)
  })

  it('ignora los singles', () => {
    expect(computePairStats([match(['ana'], ['lu'], 6, 0)])).toEqual([])
  })

  it('bestPairs exige un mínimo de partidos juntas', () => {
    const matches = [
      // ana+bea: 3 partidos, 2 ganados
      match(['ana', 'bea'], ['lu', 'vero'], 6, 4),
      match(['ana', 'bea'], ['lu', 'vero'], 6, 3),
      match(['ana', 'bea'], ['lu', 'vero'], 1, 6),
      // lu+vero llegan a 3 con esos mismos partidos, ganaron 1
    ]
    const pairs = computePairStats(matches)
    expect(bestPairs(pairs)).toHaveLength(2)
    expect(bestPairs(pairs)[0].players).toEqual(pairKey('ana', 'bea').split('|'))

    // Una dupla de un solo partido ganado no puede encabezar la tabla.
    const conNovata = [...matches, match(['ana', 'lu'], ['bea', 'vero'], 6, 0)]
    const top = bestPairs(computePairStats(conNovata))[0]
    expect(top.played).toBeGreaterThanOrEqual(3)
  })
})

describe('headToHead', () => {
  it('solo cuenta los partidos en que estuvieron en lados opuestos', () => {
    const matches = [
      match(['ana', 'bea'], ['lu', 'vero'], 6, 4), // ana vs lu: gana ana
      match(['ana', 'lu'], ['bea', 'vero'], 3, 6), // ana y lu del mismo lado: no cuenta
      match(['lu'], ['ana'], 6, 2), // gana lu
    ]
    expect(headToHead(matches, 'ana', 'lu')).toEqual({ aWins: 1, bWins: 1 })
  })
})
