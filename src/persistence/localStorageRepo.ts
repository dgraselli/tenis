import type { Repository } from './repository'
import { runMigrations } from './migrations'
import { STORAGE_KEY, emptyDB } from './schema'
import type { PersistedDB } from './schema'

/** Lo mínimo que necesitamos de `localStorage`. Inyectable para los tests. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export class StorageFullError extends Error {
  constructor() {
    super('No hay más espacio para guardar. Borrá partidos viejos e intentá de nuevo.')
    this.name = 'StorageFullError'
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Rellena lo que falte con los defaults. Agregar un campo opcional a `Settings`
 * no debería obligar a escribir una migración.
 */
function hydrate(raw: Record<string, unknown>): PersistedDB {
  const base = emptyDB()
  const settings = isRecord(raw.settings) ? raw.settings : {}
  return {
    schemaVersion: base.schemaVersion,
    players: Array.isArray(raw.players) ? raw.players : base.players,
    matches: Array.isArray(raw.matches) ? raw.matches : base.matches,
    activeMatch: isRecord(raw.activeMatch)
      ? (raw.activeMatch as unknown as PersistedDB['activeMatch'])
      : null,
    settings: { ...base.settings, ...settings },
  }
}

export function createLocalStorageRepo(storage: StorageLike): Repository {
  return {
    load(): PersistedDB {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw === null) return emptyDB()

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return recover(storage, raw, 'los datos guardados no son JSON válido')
      }

      if (!isRecord(parsed)) {
        return recover(storage, raw, 'los datos guardados no tienen la forma esperada')
      }

      try {
        return hydrate(runMigrations(parsed))
      } catch (err) {
        return recover(storage, raw, String(err))
      }
    },

    save(db: PersistedDB): void {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(db))
      } catch (err) {
        if (isQuotaError(err)) throw new StorageFullError()
        throw err
      }
    },
  }
}

/**
 * Nunca tiramos los datos del grupo a la basura: se archivan bajo otra clave
 * para poder recuperarlos a mano, y la app arranca vacía en vez de romperse.
 */
function recover(storage: StorageLike, raw: string, reason: string): PersistedDB {
  const key = `${STORAGE_KEY}.roto.${Date.now()}`
  console.error(`No se pudieron leer los datos (${reason}). Se archivaron en "${key}".`)
  try {
    storage.setItem(key, raw)
  } catch {
    console.error('Tampoco se pudo archivar la copia.')
  }
  return emptyDB()
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}
