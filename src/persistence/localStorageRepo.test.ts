import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalStorageRepo } from './localStorageRepo'
import type { StorageLike } from './localStorageRepo'
import { runMigrations } from './migrations'
import type { Migration } from './migrations'
import { STORAGE_KEY, emptyDB } from './schema'
import { DEFAULT_BINDINGS } from '../domain/remote/types'
import { rulesForGames } from '../domain/scoring/types'

class FakeStorage implements StorageLike {
  map = new Map<string, string>()
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  keys() {
    return [...this.map.keys()]
  }
}

let storage: FakeStorage

beforeEach(() => {
  storage = new FakeStorage()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createLocalStorageRepo', () => {
  it('sin datos guardados devuelve una base vacía', () => {
    expect(createLocalStorageRepo(storage).load()).toEqual(emptyDB())
  })

  it('guarda y recupera lo mismo', () => {
    const repo = createLocalStorageRepo(storage)
    const db = emptyDB()
    db.players.push({ id: 'p1', name: 'Ana', active: true, createdAt: '2026-01-01T00:00:00.000Z' })
    db.settings.lastRules.singles = rulesForGames(4)

    repo.save(db)
    expect(repo.load()).toEqual(db)
  })

  it('rellena los settings que falten con los defaults', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, players: [], matches: [] }))

    const db = createLocalStorageRepo(storage).load()
    expect(db.settings.keyBindings).toEqual(DEFAULT_BINDINGS)
    expect(db.activeMatch).toBeNull()
  })

  it('con JSON roto arranca vacía pero archiva los datos, no los tira', () => {
    storage.setItem(STORAGE_KEY, '{esto no es json')

    expect(createLocalStorageRepo(storage).load()).toEqual(emptyDB())

    const archivo = storage.keys().find((k) => k.startsWith(`${STORAGE_KEY}.roto.`))
    expect(archivo).toBeDefined()
    expect(storage.getItem(archivo!)).toBe('{esto no es json')
  })

  it('migra el lastRules único de v1 a uno por modalidad', () => {
    const viejas = rulesForGames(4)
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, players: [], matches: [], settings: { lastRules: viejas } }),
    )

    const db = createLocalStorageRepo(storage).load()
    expect(db.settings.lastRules).toEqual({ singles: viejas, doubles: viejas })
  })

  it('migra el partido en curso de v2 agregándole quién saca primero', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, players: [], matches: [], activeMatch: { id: 'm1' } }),
    )

    const db = createLocalStorageRepo(storage).load()
    expect(db.activeMatch).toMatchObject({ id: 'm1', firstServer: 'A' })
  })

  it('migra los resultados de v3 al formato por sets, con setsToWin en las reglas', () => {
    const rulesViejas = { gamesToWinSet: 6, gamesMargin: 2, tiebreakAt: 6, tiebreakTo: 7, tiebreakMargin: 2 }
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        players: [],
        matches: [
          {
            id: 'm1',
            rules: rulesViejas,
            result: { games: { A: 7, B: 6 }, tiebreak: { A: 7, B: 5 }, winner: 'A' },
          },
        ],
        activeMatch: {
          id: 'm2',
          firstServer: 'A',
          live: { rules: rulesViejas, status: { games: { A: 1, B: 0 } }, pointLog: [] },
        },
        settings: { lastRules: { singles: rulesViejas, doubles: rulesViejas } },
      }),
    )

    const db = createLocalStorageRepo(storage).load()
    expect(db.matches[0].rules.setsToWin).toBe(1)
    expect(db.matches[0].result).toEqual({
      sets: [{ games: { A: 7, B: 6 }, tiebreak: { A: 7, B: 5 } }],
      winner: 'A',
    })
    expect(db.activeMatch!.live.rules.setsToWin).toBe(1)
    expect(db.activeMatch!.live.status.sets).toEqual([])
    expect(db.settings.lastRules.singles.setsToWin).toBe(1)
  })

  it('con datos de una versión más nueva no los pisa: los archiva', () => {
    const futuro = JSON.stringify({ schemaVersion: 99, players: [{ id: 'p1' }] })
    storage.setItem(STORAGE_KEY, futuro)

    expect(createLocalStorageRepo(storage).load()).toEqual(emptyDB())
    const archivo = storage.keys().find((k) => k.startsWith(`${STORAGE_KEY}.roto.`))
    expect(storage.getItem(archivo!)).toBe(futuro)
  })
})

describe('runMigrations', () => {
  const migrations: Record<number, Migration> = {
    1: (raw) => ({ ...raw, agregado: true }),
    2: (raw) => ({ ...raw, otro: 'sí' }),
  }

  it('encadena las migraciones y deja la versión final', () => {
    const out = runMigrations({ schemaVersion: 1 }, migrations, 3)
    expect(out).toEqual({ schemaVersion: 3, agregado: true, otro: 'sí' })
  })

  it('no hace nada si ya está en la versión objetivo', () => {
    expect(runMigrations({ schemaVersion: 2, x: 1 }, migrations, 2)).toEqual({
      schemaVersion: 2,
      x: 1,
    })
  })

  it('falla explícitamente si falta una migración', () => {
    expect(() => runMigrations({ schemaVersion: 0 }, migrations, 3)).toThrow(/Falta la migración/)
  })

  it('falla si los datos son de una versión más nueva', () => {
    expect(() => runMigrations({ schemaVersion: 5 }, migrations, 3)).toThrow(/más nueva/)
  })
})
