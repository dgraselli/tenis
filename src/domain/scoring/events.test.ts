import { describe, expect, it } from 'vitest'
import { scoreEvent } from './events'
import { pointTo } from './engine'
import { replay } from './liveMatch'
import { rulesForGames } from './types'
import type { Side } from './types'

const best3 = { ...rulesForGames(4), setsToWin: 2 }

/** El estado tras `n` puntos limpios de A, y el que sigue con un punto más. */
function transition(n: number) {
  const prev = replay(Array<Side>(n).fill('A'), best3)
  return { prev, next: pointTo(prev, 'A', best3) }
}

describe('scoreEvent', () => {
  it('un punto común es solo un punto', () => {
    const { prev, next } = transition(0)
    expect(scoreEvent(prev, next)).toBe('punto')
  })

  it('el punto que cierra un game es un game', () => {
    const { prev, next } = transition(3)
    expect(scoreEvent(prev, next)).toBe('game')
  })

  it('el punto que cierra un set es un set', () => {
    // 15 puntos: 3 games y 40-0 en el cuarto; el que sigue cierra el set.
    const { prev, next } = transition(15)
    expect(next.sets).toHaveLength(1)
    expect(scoreEvent(prev, next)).toBe('set')
  })

  it('el punto que cierra el partido es el partido', () => {
    const { prev, next } = transition(31)
    expect(next.finished).toBe(true)
    expect(scoreEvent(prev, next)).toBe('partido')
  })
})
