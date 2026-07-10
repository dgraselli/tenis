import { useMemo } from 'react'
import { buildPairHistory } from '../domain/draw/history'
import { bestPairs, computePairStats, computePlayerStats, rankPlayers } from '../domain/stats/compute'
import type { PlayerId } from '../domain/players/types'
import { useStore } from './store'

/**
 * El ranking se deriva del historial en cada render, memoizado. No se persiste:
 * guardarlo obligaría a invalidarlo cada vez que se corrige o borra un partido.
 */
export function useStats() {
  const { db, session } = useStore()

  const playerStats = useMemo(
    () => computePlayerStats(db.matches, db.players),
    [db.matches, db.players],
  )

  const ratingOf = useMemo(() => {
    const byId = new Map(playerStats.map((s) => [s.playerId, s.rating]))
    return (id: PlayerId) => byId.get(id) ?? 50
  }, [playerStats])

  const pairStats = useMemo(() => computePairStats(db.matches), [db.matches])

  const pairHistory = useMemo(
    () => buildPairHistory(db.matches, session.pendingPairs),
    [db.matches, session.pendingPairs],
  )

  return {
    playerStats,
    ranking: useMemo(() => rankPlayers(playerStats), [playerStats]),
    pairStats,
    topPairs: useMemo(() => bestPairs(pairStats), [pairStats]),
    pairHistory,
    ratingOf,
  }
}
