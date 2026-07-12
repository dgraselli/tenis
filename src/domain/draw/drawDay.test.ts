import { describe, expect, it } from 'vitest'
import { drawDay, imbalance } from './drawDay'
import { buildPairHistory, emptyHistory } from './history'
import type { DrawMatch, DrawResult, PresentPlayer } from './types'
import { seeded } from '../../lib/rng'
import { pairKey } from '../stats/types'
import type { StoredMatch } from '../match/types'
import { DEFAULT_RULES } from '../scoring/types'

function present(spec: Record<string, number>, restsToday = 0): PresentPlayer[] {
  return Object.entries(spec).map(([playerId, rating]) => ({ playerId, rating, restsToday }))
}

/** N jugadoras con ratings equiespaciados de 90 hacia abajo. */
function ladder(n: number): PresentPlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    playerId: `p${i}`,
    rating: 90 - i * 5,
    restsToday: 0,
  }))
}

function allPlayers(result: DrawResult): string[] {
  return [...result.matches.flatMap((m) => [...m.sideA, ...m.sideB]), ...result.resting].sort()
}

function countFormat(matches: DrawMatch[], format: 'singles' | 'doubles'): number {
  return matches.filter((m) => m.format === format).length
}

describe('composición del cruce', () => {
  const strategies = ['azar', 'sin-repetir', 'nivelado'] as const

  for (const strategy of strategies) {
    describe(strategy, () => {
      const draw = (n: number, seed = 1) =>
        drawDay({ present: ladder(n), strategy, rng: seeded(seed) })

      it('4 presentes: un dobles, nadie descansa', () => {
        const r = draw(4)
        expect(countFormat(r.matches, 'doubles')).toBe(1)
        expect(r.resting).toEqual([])
      })

      it('2 presentes: un singles', () => {
        const r = draw(2)
        expect(countFormat(r.matches, 'singles')).toBe(1)
      })

      it('6 presentes: un dobles y un singles', () => {
        const r = draw(6)
        expect(countFormat(r.matches, 'doubles')).toBe(1)
        expect(countFormat(r.matches, 'singles')).toBe(1)
        expect(r.resting).toEqual([])
      })

      it('10 presentes: dos dobles y un singles', () => {
        const r = draw(10)
        expect(countFormat(r.matches, 'doubles')).toBe(2)
        expect(countFormat(r.matches, 'singles')).toBe(1)
      })

      it('8 presentes: dos dobles, sin singles', () => {
        const r = draw(8)
        expect(countFormat(r.matches, 'doubles')).toBe(2)
        expect(countFormat(r.matches, 'singles')).toBe(0)
      })

      it('con número impar descansa exactamente una', () => {
        for (const n of [3, 5, 7, 9]) {
          expect(draw(n).resting).toHaveLength(1)
        }
      })

      it('cada presente aparece exactamente una vez', () => {
        for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
          const r = draw(n)
          expect(allPlayers(r)).toEqual(ladder(n).map((p) => p.playerId).sort())
        }
      })

      it('una sola presente descansa y no hay partidos', () => {
        const r = draw(1)
        expect(r.matches).toEqual([])
        expect(r.resting).toHaveLength(1)
      })

      it('sin presentes no rompe', () => {
        expect(drawDay({ present: [], strategy, rng: seeded(1) })).toEqual({
          matches: [],
          resting: [],
        })
      })

      it('el mismo seed da el mismo sorteo', () => {
        expect(draw(9, 42)).toEqual(draw(9, 42))
      })
    })
  }
})

describe('descanso rotativo', () => {
  it('descansa la que menos descansó hoy', () => {
    const people: PresentPlayer[] = [
      { playerId: 'ana', rating: 50, restsToday: 2 },
      { playerId: 'bea', rating: 50, restsToday: 2 },
      { playerId: 'lu', rating: 50, restsToday: 0 },
    ]

    for (let seed = 1; seed <= 20; seed++) {
      const r = drawDay({ present: people, strategy: 'azar', rng: seeded(seed) })
      expect(r.resting).toEqual(['lu'])
    }
  })

  it('con empate, el desempate es al azar', () => {
    const people = present({ ana: 50, bea: 50, lu: 50 })
    const quienes = new Set<string>()
    for (let seed = 1; seed <= 30; seed++) {
      quienes.add(drawDay({ present: people, strategy: 'azar', rng: seeded(seed) }).resting[0])
    }
    expect(quienes.size).toBeGreaterThan(1)
  })
})

describe('estrategia nivelado', () => {
  it('junta a la mejor con la peor', () => {
    const people = present({ mejor: 90, segunda: 70, tercera: 60, peor: 40 })
    // jitter 0 = determinista, para verificar la partición sin ruido.
    const r = drawDay({ present: people, strategy: 'nivelado', jitterPct: 0, rng: seeded(1) })

    const equipos = [r.matches[0].sideA.sort(), r.matches[0].sideB.sort()].sort()
    expect(equipos).toEqual([['mejor', 'peor'], ['segunda', 'tercera']])
  })

  it('arma partidos más parejos que el azar', () => {
    const people = ladder(8)
    const ratingOf = (id: string) => people.find((p) => p.playerId === id)!.rating

    const promedio = (strategy: 'azar' | 'nivelado') => {
      let total = 0
      for (let seed = 1; seed <= 50; seed++) {
        const r = drawDay({ present: people, strategy, rng: seeded(seed) })
        total += imbalance(r.matches, ratingOf)
      }
      return total / 50
    }

    expect(promedio('nivelado')).toBeLessThan(promedio('azar'))
  })

  it('con las mismas presentes no da siempre el mismo cruce', () => {
    const people = ladder(8)
    const cruces = new Set<string>()
    for (let seed = 1; seed <= 30; seed++) {
      const r = drawDay({ present: people, strategy: 'nivelado', rng: seeded(seed) })
      cruces.add(JSON.stringify(r.matches.map((m) => [m.sideA.sort(), m.sideB.sort()].sort())))
    }
    expect(cruces.size).toBeGreaterThan(1)
  })

  it('sin jitter sí es determinista', () => {
    const people = ladder(8)
    const cruces = new Set<string>()
    for (let seed = 1; seed <= 10; seed++) {
      const r = drawDay({ present: people, strategy: 'nivelado', jitterPct: 0, rng: seeded(seed) })
      cruces.add(JSON.stringify(r.matches))
    }
    expect(cruces.size).toBe(1)
  })
})

describe('estrategia sin-repetir', () => {
  let seq = 0
  function playedTogether(a: string, b: string, vs: [string, string]): StoredMatch {
    return {
      id: `m${seq++}`,
      format: 'doubles',
      rules: DEFAULT_RULES,
      sides: { A: { players: [a, b] }, B: { players: vs } },
      result: { sets: [{ games: { A: 6, B: 4 } }], winner: 'A' },
      playedAt: `2026-01-0${1 + seq}T00:00:00.000Z`,
    }
  }

  const pairsOf = (r: DrawResult) =>
    new Set(
      r.matches.flatMap((m) =>
        [m.sideA, m.sideB].filter((s) => s.length === 2).map((s) => pairKey(s[0], s[1])),
      ),
    )

  it('evita repetir la dupla que acaba de jugar junta', () => {
    const people = present({ ana: 50, bea: 50, lu: 50, vero: 50 })
    const history = buildPairHistory([playedTogether('ana', 'bea', ['lu', 'vero'])])

    for (let seed = 1; seed <= 20; seed++) {
      const r = drawDay({ present: people, strategy: 'sin-repetir', history, rng: seeded(seed) })
      expect(pairsOf(r).has(pairKey('ana', 'bea'))).toBe(false)
    }
  })

  it('evita también las duplas ya sorteadas hoy y todavía sin jugar', () => {
    const people = present({ ana: 50, bea: 50, lu: 50, vero: 50 })
    const history = buildPairHistory([], [['ana', 'lu']])

    for (let seed = 1; seed <= 20; seed++) {
      const r = drawDay({ present: people, strategy: 'sin-repetir', history, rng: seeded(seed) })
      expect(pairsOf(r).has(pairKey('ana', 'lu'))).toBe(false)
    }
  })

  it('sin historia se comporta como un barajado cualquiera', () => {
    const people = ladder(8)
    const r = drawDay({
      present: people,
      strategy: 'sin-repetir',
      history: emptyHistory(),
      rng: seeded(7),
    })
    expect(r.matches).toHaveLength(2)
  })

  it('reparte las compañeras a lo largo de varias rondas', () => {
    const people = present({ ana: 50, bea: 50, lu: 50, vero: 50 })
    const matches: StoredMatch[] = []
    const vistas = new Set<string>()

    // Con 4 jugadoras hay exactamente 3 duplas posibles para ana.
    for (let ronda = 0; ronda < 3; ronda++) {
      const history = buildPairHistory(matches)
      const r = drawDay({
        present: people,
        strategy: 'sin-repetir',
        history,
        rng: seeded(ronda + 1),
      })
      const m = r.matches[0]
      for (const key of pairsOf(r)) vistas.add(key)
      matches.push(playedTogether(m.sideA[0], m.sideA[1], [m.sideB[0], m.sideB[1]]))
    }

    // Las 3 rondas usaron 3 duplas distintas para cada lado: 6 duplas en total
    // sobre las 6 posibles con 4 jugadoras.
    expect(vistas.size).toBe(6)
  })
})

describe('buildPairHistory', () => {
  it('el partido más reciente queda a distancia 1', () => {
    const mk = (a: string, b: string, at: string): StoredMatch => ({
      id: at,
      format: 'doubles',
      rules: DEFAULT_RULES,
      sides: { A: { players: [a, b] }, B: { players: ['x', 'y'] } },
      result: { sets: [{ games: { A: 6, B: 0 } }], winner: 'A' },
      playedAt: at,
    })

    const history = buildPairHistory([
      mk('ana', 'bea', '2026-01-01T00:00:00.000Z'),
      mk('lu', 'vero', '2026-03-01T00:00:00.000Z'),
    ])

    expect(history.together[pairKey('lu', 'vero')]).toBe(1)
    expect(history.together[pairKey('ana', 'bea')]).toBe(2)
    expect(history.together[pairKey('ana', 'lu')]).toBeUndefined()
    expect(history.against[pairKey('lu', 'x')]).toBe(1)
  })
})
