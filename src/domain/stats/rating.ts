/**
 * Rating 0-100 que alimenta el sorteo nivelado.
 *
 * Es el porcentaje de victorias amortiguado por una media bayesiana: se le
 * suman `C` partidos "fantasma" jugados al nivel del prior. Ganar el primer
 * partido deja a la jugadora en 58, no en 100, y el rating converge al
 * desempeño real a medida que se juega.
 *
 * Se elige esto sobre Elo por dos razones: es explicable en una frase, y no
 * depende del orden de los partidos, así que corregir uno viejo no obliga a
 * reprocesar toda la cronología.
 */
export const SHRINKAGE = 5
export const DEFAULT_PRIOR = 0.5

/** Cuánto puede mover la diferencia de games, en puntos de rating. */
const GAMES_BONUS_CAP = 5
const GAMES_DIFF_CAP = 20

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export interface RatingInput {
  played: number
  won: number
  gamesDiff: number
  /** Nivel sembrado 0-100. Actúa como prior y se diluye al jugar. */
  seedRating?: number
}

/** El rating sin el ajuste por diferencia de games. Útil para explicarlo. */
export function baseRating({ played, won, seedRating }: RatingInput): number {
  const prior = seedRating === undefined ? DEFAULT_PRIOR : clamp(seedRating, 0, 100) / 100
  return ((won + SHRINKAGE * prior) / (played + SHRINKAGE)) * 100
}

export function ratingFor(input: RatingInput): number {
  const bonus =
    (clamp(input.gamesDiff, -GAMES_DIFF_CAP, GAMES_DIFF_CAP) / GAMES_DIFF_CAP) * GAMES_BONUS_CAP
  return clamp(baseRating(input) + bonus, 0, 100)
}
