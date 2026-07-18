import type { ActiveMatch, MatchFormat, StoredMatch } from '../domain/match/types'
import type { Player } from '../domain/players/types'
import type { KeyBindings } from '../domain/remote/types'
import type { MatchRules } from '../domain/scoring/types'
import type { ThemeId } from '../domain/theme/types'
import { DEFAULT_BINDINGS } from '../domain/remote/types'
import { DEFAULT_RULES } from '../domain/scoring/types'
import { DEFAULT_THEME } from '../domain/theme/types'

export const STORAGE_KEY = 'tenis.db'
export const SCHEMA_VERSION = 5

export interface Settings {
  /** Último formato usado por modalidad: default al empezar un partido. */
  lastRules: Record<MatchFormat, MatchRules>
  keyBindings: KeyBindings
  theme: ThemeId
  /** Sonidos al anotar. Campo con default: no necesita migración. */
  sound: boolean
}

export interface PersistedDB {
  schemaVersion: number
  players: Player[]
  matches: StoredMatch[]
  /** Partido en curso, o null. El ranking NO se guarda: se deriva. */
  activeMatch: ActiveMatch | null
  settings: Settings
}

export function emptyDB(): PersistedDB {
  return {
    schemaVersion: SCHEMA_VERSION,
    players: [],
    matches: [],
    activeMatch: null,
    settings: {
      lastRules: { singles: DEFAULT_RULES, doubles: DEFAULT_RULES },
      keyBindings: DEFAULT_BINDINGS,
      theme: DEFAULT_THEME,
      sound: true,
    },
  }
}
