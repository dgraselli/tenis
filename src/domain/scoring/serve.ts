import { otherSide } from './engine'
import type { MatchStatus, Side } from './types'

/**
 * Quién saca, derivado del marcador: no se guarda por punto. El saque alterna
 * con cada game completado; en el tie-break arranca quien seguía en la rotación
 * y cambia después del primer punto y de ahí cada dos.
 */
export function currentServer(status: MatchStatus, firstServer: Side): Side | null {
  if (status.current === null) return null

  const gamesPlayed = status.games.A + status.games.B
  const gameServer = gamesPlayed % 2 === 0 ? firstServer : otherSide(firstServer)
  if (status.current.phase !== 'tiebreak') return gameServer

  const points = status.current.points.A + status.current.points.B
  return Math.floor((points + 1) / 2) % 2 === 0 ? gameServer : otherSide(gameServer)
}
