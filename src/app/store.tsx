import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DrawResult } from '../domain/draw/types'
import type { PlayerId } from '../domain/players/types'
import type { Repository } from '../persistence/repository'
import type { PersistedDB } from '../persistence/schema'

/**
 * Estado de la jornada. No se persiste: vale mientras el grupo está en la
 * cancha. Es lo que hace que el descanso rote y que el sorteo sepa qué duplas
 * ya salieron hoy aunque todavía no hayan jugado.
 */
export interface Session {
  present: PlayerId[]
  restsToday: Record<PlayerId, number>
  pendingPairs: [PlayerId, PlayerId][]
  lastDraw: DrawResult | null
}

const emptySession = (): Session => ({
  present: [],
  restsToday: {},
  pendingPairs: [],
  lastDraw: null,
})

interface StoreValue {
  db: PersistedDB
  update: (fn: (db: PersistedDB) => PersistedDB) => void
  session: Session
  updateSession: (fn: (s: Session) => Session) => void
  saveError: string | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ repo, children }: { repo: Repository; children: ReactNode }) {
  const [db, setDb] = useState<PersistedDB>(() => repo.load())
  const [session, setSession] = useState<Session>(emptySession)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Lo que se acaba de cargar ya está en disco: no hace falta reescribirlo.
  const loaded = useRef(true)

  useEffect(() => {
    if (loaded.current) {
      loaded.current = false
      return
    }
    try {
      repo.save(db)
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudieron guardar los datos.')
    }
  }, [db, repo])

  const value = useMemo<StoreValue>(
    () => ({
      db,
      update: (fn) => setDb(fn),
      session,
      updateSession: (fn) => setSession(fn),
      saveError,
    }),
    [db, session, saveError],
  )

  return <StoreContext value={value}>{children}</StoreContext>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore fuera de StoreProvider')
  return value
}
