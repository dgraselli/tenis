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
