import { useCallback } from 'react'
import { drawDay } from '../domain/draw/drawDay'
import type { DrawMatch, DrawStrategy } from '../domain/draw/types'
import type { PlayerId } from '../domain/players/types'
import { useStore } from './store'
import { useStats } from './useStats'

export function useDraw() {
  const { session, updateSession } = useStore()
  const { pairHistory, ratingOf } = useStats()

  const togglePresent = useCallback(
    (id: PlayerId) => {
      updateSession((s) => ({
        ...s,
        present: s.present.includes(id) ? s.present.filter((x) => x !== id) : [...s.present, id],
        lastDraw: null,
      }))
    },
    [updateSession],
  )

  const draw = useCallback(
    (strategy: DrawStrategy) => {
      updateSession((s) => {
        const result = drawDay({
          strategy,
          history: pairHistory,
          present: s.present.map((playerId) => ({
            playerId,
            rating: ratingOf(playerId),
            restsToday: s.restsToday[playerId] ?? 0,
          })),
        })

        // Quien descansa suma un turno: así el descanso rota en la próxima ronda.
        const restsToday = { ...s.restsToday }
        for (const id of result.resting) restsToday[id] = (restsToday[id] ?? 0) + 1

        return {
          ...s,
          lastDraw: result,
          restsToday,
          // Las duplas recién sorteadas cuentan como "acaban de coincidir",
          // aunque todavía no hayan jugado.
          pendingPairs: result.matches
            .flatMap((m) => [m.sideA, m.sideB])
            .filter((side): side is [PlayerId, PlayerId] => side.length === 2),
        }
      })
    },
    [updateSession, pairHistory, ratingOf],
  )

  /** Al empezar a jugar un cruce, deja de estar "pendiente". */
  const clearPending = useCallback(
    (match: DrawMatch) => {
      updateSession((s) => ({
        ...s,
        pendingPairs: s.pendingPairs.filter(
          (pair) =>
            !isSamePair(pair, match.sideA) && !isSamePair(pair, match.sideB),
        ),
      }))
    },
    [updateSession],
  )

  const reset = useCallback(() => {
    updateSession((s) => ({ ...s, restsToday: {}, pendingPairs: [], lastDraw: null }))
  }, [updateSession])

  return { session, togglePresent, draw, clearPending, reset }
}

function isSamePair(pair: [PlayerId, PlayerId], side: PlayerId[]): boolean {
  return side.length === 2 && pair.includes(side[0]) && pair.includes(side[1])
}
