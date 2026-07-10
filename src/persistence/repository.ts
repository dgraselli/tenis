import type { PersistedDB } from './schema'

/**
 * El punto de corte para migrar a la nube. La UI habla con los datos solo a
 * través de esta interfaz: escribir un `cloudRepo.ts` no obliga a tocar el
 * dominio ni las pantallas.
 */
export interface Repository {
  load(): PersistedDB
  save(db: PersistedDB): void
}
