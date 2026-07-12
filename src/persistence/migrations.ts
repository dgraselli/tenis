import { DEFAULT_RULES } from '../domain/scoring/types'
import { SCHEMA_VERSION } from './schema'

/** Transforma el documento crudo de la versión N a la N+1. */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Clave = versión de origen. Para pasar de v2 a v3 se agrega `2: (raw) => ...`
 * y se sube SCHEMA_VERSION a 3.
 */
export const MIGRATIONS: Record<number, Migration> = {
  // v1 guardaba un único lastRules; v2 lo separa por modalidad.
  1: (raw) => {
    const settings = isRecord(raw.settings) ? raw.settings : {}
    const old = isRecord(settings.lastRules) ? settings.lastRules : DEFAULT_RULES
    return {
      ...raw,
      settings: { ...settings, lastRules: { singles: old, doubles: old } },
    }
  },
  // v3 agrega quién saca primero al partido en curso. Para uno que venía de
  // antes no se sabe: se asume el lado A, que era el default visual.
  2: (raw) => {
    if (!isRecord(raw.activeMatch)) return raw
    return { ...raw, activeMatch: { firstServer: 'A', ...raw.activeMatch } }
  },
  // v4 pasa a partidos por sets: las reglas ganan setsToWin (1 = lo que ya
  // era), los resultados guardan sets en vez de un solo marcador, y el estado
  // en vivo lleva la lista de sets cerrados.
  3: (raw) => {
    const conSets = (rules: unknown) =>
      isRecord(rules) ? { setsToWin: 1, ...rules } : rules

    const resultado = (result: unknown) => {
      if (!isRecord(result)) return result
      const { games, tiebreak, winner } = result
      return { sets: [{ games, ...(tiebreak !== undefined ? { tiebreak } : {}) }], winner }
    }

    const matches = Array.isArray(raw.matches)
      ? raw.matches.map((m) =>
          isRecord(m) ? { ...m, rules: conSets(m.rules), result: resultado(m.result) } : m,
        )
      : raw.matches

    let activeMatch = raw.activeMatch
    if (isRecord(activeMatch) && isRecord(activeMatch.live)) {
      const live = activeMatch.live
      activeMatch = {
        ...activeMatch,
        live: {
          ...live,
          rules: conSets(live.rules),
          ...(isRecord(live.status) ? { status: { sets: [], ...live.status } } : {}),
        },
      }
    }

    const settings = isRecord(raw.settings) ? raw.settings : {}
    const lastRules = isRecord(settings.lastRules)
      ? {
          singles: conSets(settings.lastRules.singles),
          doubles: conSets(settings.lastRules.doubles),
        }
      : settings.lastRules

    return { ...raw, matches, activeMatch, settings: { ...settings, lastRules } }
  },
}

/**
 * Aplica las migraciones en cadena hasta llegar a `target`.
 * Falta una migración -> error explícito, en vez de datos corruptos silenciosos.
 */
export function runMigrations(
  raw: Record<string, unknown>,
  migrations: Record<number, Migration> = MIGRATIONS,
  target = SCHEMA_VERSION,
): Record<string, unknown> {
  let current = raw
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0

  if (version > target) {
    throw new Error(
      `Los datos son de una versión más nueva (v${version}) que esta app (v${target}).`,
    )
  }

  while (version < target) {
    const migrate = migrations[version]
    if (!migrate) throw new Error(`Falta la migración de v${version} a v${version + 1}.`)
    current = migrate(current)
    version += 1
    current.schemaVersion = version
  }

  return current
}
