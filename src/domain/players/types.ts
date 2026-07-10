export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
  /**
   * Baja lógica. Nunca se borra una jugadora: los partidos históricos la
   * referencian y borrarla dejaría el historial apuntando al vacío.
   */
  active: boolean
  createdAt: string
  /** Nivel inicial 0-100 para sembrar a alguien que ya sabemos cómo juega. */
  seedRating?: number
}

export function activePlayers(players: Player[]): Player[] {
  return players.filter((p) => p.active)
}

export function playerName(players: Player[], id: PlayerId): string {
  return players.find((p) => p.id === id)?.name ?? '¿?'
}
