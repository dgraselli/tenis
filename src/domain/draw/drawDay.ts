import type { PlayerId } from '../players/types'
import { emptyHistory, repeatCost } from './history'
import type { DrawInput, DrawMatch, DrawResult, DrawStrategy, PairHistory, PresentPlayer } from './types'

/** Cuántos barajados se prueban antes de elegir el que menos repite. */
const CANDIDATES = 240
const DEFAULT_JITTER = 0.1
/** Repetir rival molesta menos que repetir compañera. */
const OPPONENT_WEIGHT = 0.25

/** Las tres formas de partir un grupo de 4 en dos equipos. */
const PARTITIONS = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
] as const

export function drawDay(input: DrawInput): DrawResult {
  const rng = input.rng ?? Math.random
  const history = input.history ?? emptyHistory()
  const jitterPct = input.jitterPct ?? DEFAULT_JITTER

  const { resting, pool } = chooseResting(input.present, rng)
  if (pool.length < 2) return { matches: [], resting }

  // El azar y el nivelado se resuelven de una: uno baraja, el otro ordena.
  // Solo 'sin-repetir' necesita explorar, porque busca minimizar coincidencias.
  const rounds = input.strategy === 'sin-repetir' ? CANDIDATES : 1

  let best: DrawMatch[] | null = null
  let bestCost = Infinity

  for (let i = 0; i < rounds; i++) {
    const candidate = buildCandidate(pool, input.strategy, history, rng, jitterPct)
    const cost = input.strategy === 'sin-repetir' ? repetitionCost(candidate, history) : 0
    if (cost < bestCost) {
      best = candidate
      bestCost = cost
    }
  }

  return { matches: best ?? [], resting }
}

/**
 * Con número impar, una descansa. Se elige entre las que menos descansaron hoy,
 * con desempate al azar, para que el descanso rote en vez de caer siempre sobre
 * la misma.
 */
function chooseResting(
  present: PresentPlayer[],
  rng: () => number,
): { resting: PlayerId[]; pool: PresentPlayer[] } {
  if (present.length % 2 === 0) return { resting: [], pool: present }

  const fewest = Math.min(...present.map((p) => p.restsToday))
  const candidates = present.filter((p) => p.restsToday === fewest)
  const chosen = candidates[Math.floor(rng() * candidates.length)]

  return {
    resting: [chosen.playerId],
    pool: present.filter((p) => p.playerId !== chosen.playerId),
  }
}

function buildCandidate(
  pool: PresentPlayer[],
  strategy: DrawStrategy,
  history: PairHistory,
  rng: () => number,
  jitterPct: number,
): DrawMatch[] {
  const order = strategy === 'nivelado' ? sortByJitteredRating(pool, rng, jitterPct) : shuffle(pool, rng)

  const doublesCount = Math.floor(order.length / 4)
  const matches: DrawMatch[] = []

  for (let i = 0; i < doublesCount; i++) {
    matches.push(makeDoubles(order.slice(i * 4, i * 4 + 4), strategy, history, rng))
  }

  // Si sobran dos (el total no es múltiplo de 4), juegan singles.
  const leftovers = order.slice(doublesCount * 4)
  if (leftovers.length === 2) {
    matches.push({
      format: 'singles',
      sideA: [leftovers[0].playerId],
      sideB: [leftovers[1].playerId],
    })
  }

  return matches
}

/**
 * Dentro de un grupo de 4, elegir cómo se parten los equipos.
 * En 'nivelado' gana siempre la partición que enfrenta a la mejor + la peor
 * contra las dos del medio: es la de sumas más parejas.
 */
function makeDoubles(
  court: PresentPlayer[],
  strategy: DrawStrategy,
  history: PairHistory,
  rng: () => number,
): DrawMatch {
  const score = (partition: (typeof PARTITIONS)[number]): number => {
    const [ta, tb] = partition
    if (strategy === 'nivelado') {
      const sum = (t: readonly number[]) => t.reduce((acc, i) => acc + court[i].rating, 0)
      return Math.abs(sum(ta) - sum(tb))
    }
    if (strategy === 'sin-repetir') {
      return (
        repeatCost(history.together, court[ta[0]].playerId, court[ta[1]].playerId) +
        repeatCost(history.together, court[tb[0]].playerId, court[tb[1]].playerId)
      )
    }
    return 0
  }

  const chosen =
    strategy === 'azar'
      ? PARTITIONS[Math.floor(rng() * PARTITIONS.length)]
      : PARTITIONS.reduce((best, p) => (score(p) < score(best) ? p : best))

  return {
    format: 'doubles',
    sideA: chosen[0].map((i) => court[i].playerId),
    sideB: chosen[1].map((i) => court[i].playerId),
  }
}

function repetitionCost(matches: DrawMatch[], history: PairHistory): number {
  let cost = 0

  for (const m of matches) {
    for (const side of [m.sideA, m.sideB]) {
      if (side.length === 2) cost += repeatCost(history.together, side[0], side[1])
    }
    for (const a of m.sideA) {
      for (const b of m.sideB) cost += OPPONENT_WEIGHT * repeatCost(history.against, a, b)
    }
  }

  return cost
}

/**
 * Perturba los ratings antes de ordenar. Sin esto, las mismas presentes darían
 * exactamente el mismo cruce todas las veces. Jugadoras de nivel parecido pueden
 * caer en canchas distintas, pero los partidos siguen siendo parejos.
 */
function sortByJitteredRating(
  pool: PresentPlayer[],
  rng: () => number,
  jitterPct: number,
): PresentPlayer[] {
  const ratings = pool.map((p) => p.rating)
  const span = Math.max(...ratings) - Math.min(...ratings) || 1

  return pool
    .map((p) => ({ p, key: p.rating + (rng() * 2 - 1) * jitterPct * span }))
    .sort((x, y) => y.key - x.key)
    .map((x) => x.p)
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Qué tan desparejo quedó un cruce. Menor es mejor. Se usa en los tests. */
export function imbalance(matches: DrawMatch[], ratingOf: (id: PlayerId) => number): number {
  return matches.reduce((total, m) => {
    const sum = (side: PlayerId[]) => side.reduce((acc, id) => acc + ratingOf(id), 0)
    return total + Math.abs(sum(m.sideA) - sum(m.sideB))
  }, 0)
}
