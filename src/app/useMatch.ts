import { useCallback } from 'react'
import { finishMatch, formatOf } from '../domain/match/types'
import type { MatchSide } from '../domain/match/types'
import type { PlayerId } from '../domain/players/types'
import type { Command } from '../domain/remote/types'
import { applyPoint, startLiveMatch, undo } from '../domain/scoring/liveMatch'
import type { MatchRules, Side } from '../domain/scoring/types'
import { newId } from '../lib/id'
import { useStore } from './store'

export function useMatch() {
  const { db, update } = useStore()
  const active = db.activeMatch

  const start = useCallback(
    (sideA: PlayerId[], sideB: PlayerId[], rules: MatchRules, firstServer: Side = 'A') => {
      const sides = {
        A: { players: sideA as MatchSide['players'] },
        B: { players: sideB as MatchSide['players'] },
      }
      const format = formatOf(sides)
      update((d) => ({
        ...d,
        activeMatch: {
          id: newId(),
          format,
          sides,
          startedAt: new Date().toISOString(),
          firstServer,
          live: startLiveMatch(rules),
        },
        // El último formato usado queda de default para el próximo partido de esa modalidad.
        settings: { ...d.settings, lastRules: { ...d.settings.lastRules, [format]: rules } },
      }))
    },
    [update],
  )

  const point = useCallback(
    (side: Side) => {
      update((d) =>
        d.activeMatch === null
          ? d
          : { ...d, activeMatch: { ...d.activeMatch, live: applyPoint(d.activeMatch.live, side) } },
      )
    },
    [update],
  )

  const undoPoint = useCallback(() => {
    update((d) =>
      d.activeMatch === null
        ? d
        : { ...d, activeMatch: { ...d.activeMatch, live: undo(d.activeMatch.live) } },
    )
  }, [update])

  /** Táctil y clicker entran por acá: son dos entradas al mismo camino. */
  const dispatch = useCallback(
    (command: Command) => {
      if (command === 'undo') undoPoint()
      else point(command === 'point:A' ? 'A' : 'B')
    },
    [point, undoPoint],
  )

  /** Guarda el partido terminado en el historial y libera el tanteador. */
  const save = useCallback(() => {
    update((d) => {
      if (d.activeMatch === null || !d.activeMatch.live.status.finished) return d
      return {
        ...d,
        matches: [...d.matches, finishMatch(d.activeMatch)],
        activeMatch: null,
      }
    })
  }, [update])

  const discard = useCallback(() => {
    update((d) => ({ ...d, activeMatch: null }))
  }, [update])

  return { active, start, point, undoPoint, dispatch, save, discard }
}
