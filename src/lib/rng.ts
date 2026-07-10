/**
 * PRNG sembrable (splitmix32). No sirve para criptografía, sí para sortear
 * parejas y, sobre todo, para tener tests deterministas.
 *
 * Se usa splitmix32 y no un congruencial lineal simple porque el LCG, sembrado
 * con enteros chicos y consecutivos, devuelve un primer valor casi idéntico
 * para todas las semillas. Cualquier decisión que dependa del primer `rng()`
 * (como el desempate de quién descansa) saldría siempre igual.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x9e3779b9) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
