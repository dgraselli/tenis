import { describe, expect, it } from 'vitest'
import { newMatch, otherSide, pointTo } from './engine'
import { applyPoint, replay, startLiveMatch, undo } from './liveMatch'
import { formatFinalScore, formatPoint } from './format'
import { DEFAULT_RULES, rulesForGames, validateRules } from './types'
import type { MatchRules, MatchStatus, Side } from './types'
import { seeded } from '../../lib/rng'

const RULES = DEFAULT_RULES

/** Aplica una secuencia de puntos: 'AAAB' = tres puntos de A y uno de B. */
function play(seq: string, rules: MatchRules = RULES, from: MatchStatus = newMatch()): MatchStatus {
  return [...seq].reduce((s, c) => pointTo(s, c as Side, rules), from)
}

/** Le hace ganar `n` games seguidos a `side` desde `status` (4 puntos limpios cada uno). */
function winGames(status: MatchStatus, side: Side, n: number, rules: MatchRules = RULES) {
  return play(side.repeat(4 * n), rules, status)
}

/** Deja el set en `a`-`b` games alternando games limpios. */
function atGames(a: number, b: number, rules: MatchRules = RULES): MatchStatus {
  let s = newMatch()
  for (let i = 0; i < Math.max(a, b); i++) {
    if (i < a) s = winGames(s, 'A', 1, rules)
    if (i < b) s = winGames(s, 'B', 1, rules)
  }
  return s
}

describe('puntos dentro del game', () => {
  it('avanza 0 -> 15 -> 30 -> 40', () => {
    expect(play('A').current).toMatchObject({ points: { A: 1, B: 0 } })
    expect(play('AA').current).toMatchObject({ points: { A: 2, B: 0 } })
    expect(play('AAA').current).toMatchObject({ points: { A: 3, B: 0 } })
  })

  it('40-0 y punto cierra el game', () => {
    const s = play('AAAA')
    expect(s.games).toEqual({ A: 1, B: 0 })
    expect(s.current).toMatchObject({ phase: 'game', points: { A: 0, B: 0 } })
  })

  it('40-30 y punto cierra el game, sin pasar por deuce', () => {
    const s = play('AAABBA') // A: 40, B: 30, punto de A
    expect(s.games).toEqual({ A: 1, B: 0 })
  })

  it('40-40 da deuce, no game', () => {
    const s = play('AAABBB')
    expect(s.games).toEqual({ A: 0, B: 0 })
    expect(s.current).toMatchObject({ phase: 'game', points: { A: 3, B: 3 }, advantage: null })
  })

  it('desde deuce, el punto da ventaja', () => {
    expect(play('AAABBBA').current).toMatchObject({ advantage: 'A' })
  })

  it('con ventaja, el punto cierra el game', () => {
    const s = play('AAABBBAA')
    expect(s.games).toEqual({ A: 1, B: 0 })
  })

  it('ventaja perdida vuelve a deuce', () => {
    const s = play('AAABBBAB') // ventaja A, punto de B
    expect(s.games).toEqual({ A: 0, B: 0 })
    expect(s.current).toMatchObject({ points: { A: 3, B: 3 }, advantage: null })
  })

  it('aguanta varios deuces seguidos', () => {
    const s = play('AAABBB' + 'ABABAB' + 'AA')
    expect(s.games).toEqual({ A: 1, B: 0 })
  })
})

describe('cierre de set (6 games)', () => {
  it('gana 6-0', () => {
    const s = winGames(newMatch(), 'A', 6)
    expect(s.finished).toBe(true)
    expect(s.winner).toBe('A')
    expect(s.games).toEqual({ A: 6, B: 0 })
    expect(s.current).toBeNull()
  })

  it('gana 6-4', () => {
    const s = winGames(atGames(5, 4), 'A', 1)
    expect(s.finished).toBe(true)
    expect(s.games).toEqual({ A: 6, B: 4 })
  })

  it('6-5 NO cierra el set: la diferencia es 1', () => {
    const s = winGames(atGames(5, 5), 'A', 1)
    expect(s.finished).toBe(false)
    expect(s.games).toEqual({ A: 6, B: 5 })
    expect(s.current).toMatchObject({ phase: 'game' })
  })

  it('7-5 cierra el set', () => {
    const s = winGames(atGames(6, 5), 'A', 1)
    expect(s.finished).toBe(true)
    expect(s.games).toEqual({ A: 7, B: 5 })
  })

  it('6-6 abre el tie-break', () => {
    const s = atGames(6, 6)
    expect(s.finished).toBe(false)
    expect(s.current).toMatchObject({ phase: 'tiebreak', points: { A: 0, B: 0 } })
  })
})

describe('tie-break', () => {
  const at66 = () => atGames(6, 6)

  it('gana 7-5 y el set queda 7-6', () => {
    const s = play('ABABABABAB' + 'AA', RULES, at66()) // 5-5 y dos de A
    expect(s.finished).toBe(true)
    expect(s.winner).toBe('A')
    expect(s.games).toEqual({ A: 7, B: 6 })
    expect(s.tiebreak).toEqual({ A: 7, B: 5 })
    expect(formatFinalScore(s, 'A')).toBe('7-6 (7-5)')
  })

  it('7-6 no cierra: hace falta diferencia de 2', () => {
    const s = play('ABABABABABABA', RULES, at66()) // 7-6
    expect(s.finished).toBe(false)
    expect(s.current).toMatchObject({ phase: 'tiebreak', points: { A: 7, B: 6 } })
  })

  it('se prolonga hasta 9-7', () => {
    const s = play('ABABABABABABAB' + 'AA', RULES, at66()) // 7-7, luego 9-7
    expect(s.finished).toBe(true)
    expect(s.tiebreak).toEqual({ A: 9, B: 7 })
  })

  it('7-0 cierra', () => {
    const s = play('AAAAAAA', RULES, at66())
    expect(s.finished).toBe(true)
    expect(s.tiebreak).toEqual({ A: 7, B: 0 })
  })
})

describe('partido terminado', () => {
  it('pointTo es idempotente y devuelve el mismo objeto', () => {
    const done = winGames(newMatch(), 'A', 6)
    expect(pointTo(done, 'B', RULES)).toBe(done)
    expect(pointTo(done, 'A', RULES)).toBe(done)
  })
})

describe('inmutabilidad', () => {
  it('pointTo no muta el estado que recibe', () => {
    const before = newMatch()
    const snapshot = structuredClone(before)
    pointTo(before, 'A', RULES)
    expect(before).toEqual(snapshot)
  })
})

describe('reglas configurables', () => {
  it('set a 4 games: gana 4-2', () => {
    const r = rulesForGames(4)
    const s = winGames(atGames(3, 2, r), 'A', 1, r)
    expect(s.finished).toBe(true)
    expect(s.games).toEqual({ A: 4, B: 2 })
  })

  it('set a 4 games: 4-3 NO cierra, 5-3 sí', () => {
    const r = rulesForGames(4)
    const cuatroTres = winGames(atGames(3, 3, r), 'A', 1, r)
    expect(cuatroTres.finished).toBe(false)
    expect(cuatroTres.games).toEqual({ A: 4, B: 3 })

    const cincoTres = winGames(cuatroTres, 'A', 1, r)
    expect(cincoTres.finished).toBe(true)
    expect(cincoTres.games).toEqual({ A: 5, B: 3 })
  })

  it('set a 4 games: 4-4 abre el tie-break', () => {
    const r = rulesForGames(4)
    expect(atGames(4, 4, r).current).toMatchObject({ phase: 'tiebreak' })
  })

  it('pro-set a 8 games: 6-6 NO abre tie-break, 8-8 sí', () => {
    const r = rulesForGames(8)
    expect(atGames(6, 6, r).current).toMatchObject({ phase: 'game' })
    expect(atGames(8, 8, r).current).toMatchObject({ phase: 'tiebreak' })
  })

  it('sin tie-break: el set se estira hasta la diferencia de 2', () => {
    const r: MatchRules = { ...rulesForGames(6), tiebreakAt: null }
    const seisSeis = atGames(6, 6, r)
    expect(seisSeis.finished).toBe(false)
    expect(seisSeis.current).toMatchObject({ phase: 'game' })

    const ochoSeis = winGames(seisSeis, 'A', 2, r)
    expect(ochoSeis.finished).toBe(true)
    expect(ochoSeis.games).toEqual({ A: 8, B: 6 })
  })

  it('tie-break desacoplado: set a 4 con tie-break en 3-3 termina 4-3', () => {
    const r: MatchRules = { ...rulesForGames(4), tiebreakAt: 3 }
    const treTres = atGames(3, 3, r)
    expect(treTres.current).toMatchObject({ phase: 'tiebreak' })

    const s = play('AAAAAAA', r, treTres)
    expect(s.finished).toBe(true)
    expect(s.games).toEqual({ A: 4, B: 3 })
  })

  it('el mismo pointLog cierra en distinto lugar según las reglas', () => {
    // A gana 4 games limpios: 16 puntos.
    const log = 'A'.repeat(16)
    expect(play(log, rulesForGames(4)).finished).toBe(true)
    expect(play(log, rulesForGames(6)).finished).toBe(false)
    expect(play(log, rulesForGames(8)).finished).toBe(false)
  })
})

describe('validateRules', () => {
  it('acepta los presets', () => {
    for (const g of [4, 6, 8]) expect(validateRules(rulesForGames(g))).toEqual([])
  })

  it('rechaza un set de 0 games', () => {
    expect(validateRules({ ...DEFAULT_RULES, gamesToWinSet: 0 })).not.toEqual([])
  })

  it('rechaza un tie-break que se dispara antes de que el set pueda llegar a su largo', () => {
    expect(validateRules({ ...rulesForGames(6), tiebreakAt: 3 })).not.toEqual([])
  })
})

describe('deshacer', () => {
  it('vuelve exactamente al estado anterior', () => {
    let m = startLiveMatch(RULES)
    m = applyPoint(m, 'A')
    const antes = m.status
    m = applyPoint(m, 'B')
    m = undo(m)
    expect(m.status).toEqual(antes)
    expect(m.pointLog).toEqual(['A'])
  })

  it('deshace un punto que cerró un game', () => {
    let m = startLiveMatch(RULES)
    for (const s of 'AAAA') m = applyPoint(m, s as Side)
    expect(m.status.games).toEqual({ A: 1, B: 0 })

    m = undo(m)
    expect(m.status.games).toEqual({ A: 0, B: 0 })
    expect(m.status.current).toMatchObject({ points: { A: 3, B: 0 } })
    expect(formatPoint(m.status.current!, 'A')).toBe('40')
  })

  it('deshace la ventaja y devuelve el deuce', () => {
    let m = startLiveMatch(RULES)
    for (const s of 'AAABBBA') m = applyPoint(m, s as Side)
    expect(m.status.current).toMatchObject({ advantage: 'A' })

    m = undo(m)
    expect(m.status.current).toMatchObject({ points: { A: 3, B: 3 }, advantage: null })
  })

  it('deshacer sobre un partido sin puntos no rompe', () => {
    const m = startLiveMatch(RULES)
    expect(undo(m)).toBe(m)
  })

  it('no loguea puntos sobre un partido terminado', () => {
    let m = startLiveMatch(RULES)
    for (const s of 'A'.repeat(24)) m = applyPoint(m, s as Side) // 6-0
    expect(m.status.finished).toBe(true)
    const largo = m.pointLog.length

    m = applyPoint(m, 'B')
    expect(m.pointLog.length).toBe(largo)
  })

  it('replay reconstruye el mismo estado', () => {
    let m = startLiveMatch(RULES)
    for (const s of 'AABBABABBBAAAB') m = applyPoint(m, s as Side)
    expect(replay(m.pointLog, m.rules)).toEqual(m.status)
  })
})

describe('propiedad: cualquier partido termina con un marcador legal', () => {
  for (const gamesToWinSet of [4, 6, 8]) {
    it(`set a ${gamesToWinSet} games, 300 partidos al azar`, () => {
      const rules = rulesForGames(gamesToWinSet)

      for (let seed = 1; seed <= 300; seed++) {
        const rng = seeded(seed)
        let status = newMatch()
        let puntos = 0

        while (!status.finished) {
          status = pointTo(status, rng() < 0.5 ? 'A' : 'B', rules)
          if (++puntos > 10_000) throw new Error('el partido no termina nunca')
        }

        const w = status.winner!
        const l = otherSide(w)
        const gw = status.games[w]
        const gl = status.games[l]

        expect(gw).toBeGreaterThan(gl)

        if (status.tiebreak) {
          // Ganado en tie-break: el set queda tiebreakAt+1 contra tiebreakAt.
          expect(gw).toBe(rules.tiebreakAt! + 1)
          expect(gl).toBe(rules.tiebreakAt)
          const tw = status.tiebreak[w]
          const tl = status.tiebreak[l]
          expect(tw).toBeGreaterThanOrEqual(rules.tiebreakTo)
          expect(tw - tl).toBeGreaterThanOrEqual(rules.tiebreakMargin)
        } else {
          expect(gw).toBeGreaterThanOrEqual(rules.gamesToWinSet)
          expect(gw - gl).toBeGreaterThanOrEqual(rules.gamesMargin)
        }

        expect(status.current).toBeNull()
      }
    })
  }
})
