import { describe, expect, it } from 'vitest'
import { pointTo } from './engine'
import { currentServer } from './serve'
import { replay } from './liveMatch'
import { rulesForGames } from './types'
import type { MatchStatus, Side } from './types'

const rules = rulesForGames(6)

/** Un game limpio para `side`: cuatro puntos seguidos. */
function games(sides: Side[]): MatchStatus {
  return replay(
    sides.flatMap((s) => [s, s, s, s]),
    rules,
  )
}

describe('currentServer en games comunes', () => {
  it('arranca sacando quien fue elegida para sacar primero', () => {
    expect(currentServer(games([]), 'A')).toBe('A')
    expect(currentServer(games([]), 'B')).toBe('B')
  })

  it('alterna con cada game completado, gane quien gane', () => {
    expect(currentServer(games(['A']), 'A')).toBe('B')
    expect(currentServer(games(['B']), 'A')).toBe('B')
    expect(currentServer(games(['A', 'B']), 'A')).toBe('A')
    expect(currentServer(games(['A', 'B', 'A']), 'A')).toBe('B')
  })

  it('no cambia en el medio de un game', () => {
    let status = games(['A'])
    status = pointTo(status, 'B', rules)
    status = pointTo(status, 'A', rules)
    expect(currentServer(status, 'A')).toBe('B')
  })

  it('con el partido terminado no saca nadie', () => {
    const status = games(['A', 'A', 'A', 'A', 'A', 'A'])
    expect(status.finished).toBe(true)
    expect(currentServer(status, 'A')).toBeNull()
  })
})

describe('currentServer en el tie-break', () => {
  /** 6-6 con `extra` puntos alternados dentro del tie-break. */
  function tiebreakAfter(extra: number): MatchStatus {
    // 12 games alternados dejan 6-6 sin cerrar ningún set.
    let status = games(['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'])
    for (let i = 0; i < extra; i++) {
      status = pointTo(status, i % 2 === 0 ? 'A' : 'B', rules)
    }
    return status
  }

  it('lo abre quien seguía en la rotación', () => {
    // 12 games jugados: le toca de nuevo a la que sacó primero.
    expect(tiebreakAfter(0).current?.phase).toBe('tiebreak')
    expect(currentServer(tiebreakAfter(0), 'A')).toBe('A')
  })

  it('cambia después del primer punto y de ahí cada dos', () => {
    const esperado: Side[] = ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A']
    esperado.forEach((side, puntos) => {
      expect(currentServer(tiebreakAfter(puntos), 'A')).toBe(side)
    })
  })
})
