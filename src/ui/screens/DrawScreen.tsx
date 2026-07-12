import { useStore } from '../../app/store'
import { useDraw } from '../../app/useDraw'
import { useMatch } from '../../app/useMatch'
import { usePlayers } from '../../app/usePlayers'
import { STRATEGY_HINTS, STRATEGY_LABELS } from '../../domain/draw/types'
import type { DrawMatch, DrawStrategy } from '../../domain/draw/types'
import { playerName } from '../../domain/players/types'
import { validateRules } from '../../domain/scoring/types'
import type { MatchRules, Side } from '../../domain/scoring/types'
import { FormatoPicker } from '../components/FormatoPicker'
import { PlayerChip } from '../components/PlayerChip'
import { Opcion, Titulo, Vacio } from '../components/Vacio'
import { useState } from 'react'

const STRATEGIES: DrawStrategy[] = ['azar', 'sin-repetir', 'nivelado']

export function DrawScreen({ onPlay }: { onPlay: () => void }) {
  const { db } = useStore()
  const { players } = usePlayers()
  const { active, start } = useMatch()
  const { session, togglePresent, draw, clearPending, reset } = useDraw()
  const [strategy, setStrategy] = useState<DrawStrategy>('nivelado')
  /** Cruce elegido con "Jugar": falta confirmar el formato antes de arrancar. */
  const [pendiente, setPendiente] = useState<DrawMatch | null>(null)
  const [rules, setRules] = useState<MatchRules | null>(null)
  const [saca, setSaca] = useState<Side>('A')

  const activas = players.filter((p) => p.active)
  if (activas.length < 2) {
    return <Vacio>Cargá al menos dos jugadores para poder sortear.</Vacio>
  }

  function jugar(match: DrawMatch) {
    setPendiente(match)
    // El default es el último formato usado en esa modalidad.
    setRules(db.settings.lastRules[match.format])
    setSaca('A')
  }

  function empezar() {
    if (pendiente === null || rules === null) return
    clearPending(pendiente)
    start(pendiente.sideA, pendiente.sideB, rules, saca)
    setPendiente(null)
    onPlay()
  }

  const nombres = (side: DrawMatch['sideA']) =>
    side.map((id) => playerName(players, id)).join(' / ')

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Quiénes están ({session.present.length})</Titulo>
        <div className="flex flex-wrap gap-2">
          {activas.map((p) => (
            <PlayerChip
              key={p.id}
              name={p.name}
              selected={session.present.includes(p.id)}
              onClick={() => togglePresent(p.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <Titulo>Cómo armar las parejas</Titulo>
        <div className="space-y-2">
          {STRATEGIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrategy(s)}
              className={[
                'w-full rounded-xl border-2 p-3 text-left transition',
                strategy === s ? 'border-acento bg-tarjeta' : 'border-borde',
              ].join(' ')}
            >
              <span className="font-semibold text-tinta">{STRATEGY_LABELS[s]}</span>
              <p className="mt-1 text-sm text-tinta-4">{STRATEGY_HINTS[s]}</p>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={session.present.length < 2}
        onClick={() => draw(strategy)}
        className="min-h-14 w-full rounded-xl bg-acento text-lg font-bold text-acento-tinta disabled:opacity-30"
      >
        Sortear
      </button>

      {session.lastDraw && (
        <section>
          <Titulo>Cruces</Titulo>
          {active !== null && (
            <p className="mb-2 text-sm text-aviso-vivo">
              Hay un partido en curso. Terminalo o salí de él antes de empezar otro.
            </p>
          )}

          <ul className="space-y-3">
            {session.lastDraw.matches.map((m, i) => (
              <li key={i} className="rounded-xl bg-tarjeta p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-tinta">
                      {m.sideA.map((id) => playerName(players, id)).join(' / ')}
                    </p>
                    <p className="my-1 text-xs uppercase tracking-wide text-tinta-5">contra</p>
                    <p className="truncate font-medium text-tinta">
                      {m.sideB.map((id) => playerName(players, id)).join(' / ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={active !== null}
                    onClick={() => jugar(m)}
                    className="min-h-12 shrink-0 rounded-lg bg-acento px-5 font-bold text-acento-tinta disabled:opacity-30"
                  >
                    Jugar
                  </button>
                </div>
                {m.format === 'singles' && (
                  <p className="mt-2 text-xs text-tinta-4">Singles: sobraban dos.</p>
                )}
              </li>
            ))}
          </ul>

          {session.lastDraw.resting.length > 0 && (
            <p className="mt-3 text-sm text-tinta-3">
              Descansa <strong>{session.lastDraw.resting.map((id) => playerName(players, id)).join(', ')}</strong>.
              En la próxima ronda le toca a otro.
            </p>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={reset}
        className="min-h-12 w-full rounded-xl text-sm text-tinta-4"
      >
        Reiniciar la jornada
      </button>

      {pendiente !== null && rules !== null && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-fondo/80 p-4 sm:items-center">
          <div className="max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-panel p-4">
            <div>
              <Titulo>Formato de juego</Titulo>
              <p className="text-sm text-tinta-3">
                {nombres(pendiente.sideA)} <span className="text-tinta-5">contra</span>{' '}
                {nombres(pendiente.sideB)}
              </p>
            </div>

            <FormatoPicker rules={rules} onChange={setRules} />

            <div>
              <Titulo>Saca primero</Titulo>
              <div className="flex gap-2">
                {(['A', 'B'] as const).map((side) => (
                  <Opcion key={side} activa={saca === side} onClick={() => setSaca(side)}>
                    🎾 {nombres(side === 'A' ? pendiente.sideA : pendiente.sideB)}
                  </Opcion>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={validateRules(rules).length > 0}
              onClick={empezar}
              className="min-h-14 w-full rounded-xl bg-acento text-lg font-bold text-acento-tinta disabled:opacity-30"
            >
              Empezar partido
            </button>
            <button
              type="button"
              onClick={() => setPendiente(null)}
              className="min-h-12 w-full rounded-xl text-sm text-tinta-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
