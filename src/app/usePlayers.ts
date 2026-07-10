import { useCallback, useMemo } from 'react'
import { activePlayers } from '../domain/players/types'
import type { Player, PlayerId } from '../domain/players/types'
import { newId } from '../lib/id'
import { useStore } from './store'

export function usePlayers() {
  const { db, update } = useStore()

  const add = useCallback(
    (name: string, seedRating?: number) => {
      const player: Player = {
        id: newId(),
        name: name.trim(),
        active: true,
        createdAt: new Date().toISOString(),
        ...(seedRating === undefined ? {} : { seedRating }),
      }
      update((d) => ({ ...d, players: [...d.players, player] }))
    },
    [update],
  )

  const patch = useCallback(
    (id: PlayerId, changes: Partial<Player>) => {
      update((d) => ({
        ...d,
        players: d.players.map((p) => (p.id === id ? { ...p, ...changes } : p)),
      }))
    },
    [update],
  )

  return {
    players: db.players,
    active: useMemo(() => activePlayers(db.players), [db.players]),
    add,
    rename: useCallback((id: PlayerId, name: string) => patch(id, { name: name.trim() }), [patch]),
    /** Baja lógica: el historial sigue apuntando a una jugadora que existe. */
    setActive: useCallback((id: PlayerId, active: boolean) => patch(id, { active }), [patch]),
    setSeed: useCallback((id: PlayerId, seedRating?: number) => patch(id, { seedRating }), [patch]),
  }
}
