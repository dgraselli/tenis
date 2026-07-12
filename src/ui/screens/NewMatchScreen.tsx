import { useState } from 'react'
import { useStore } from '../../app/store'
import { useMatch } from '../../app/useMatch'
import { usePlayers } from '../../app/usePlayers'
import type { PlayerId } from '../../domain/players/types'
import { validateRules } from '../../domain/scoring/types'
import type { MatchRules, Side } from '../../domain/scoring/types'
import { FormatoPicker } from '../components/FormatoPicker'
import { PlayerChip } from '../components/PlayerChip'
import { Opcion, Titulo, Vacio } from '../components/Vacio'

type Modalidad = 'singles' | 'doubles'

export function NewMatchScreen() {
  const { active: players } = usePlayers()
  const { db } = useStore()
  const { start } = useMatch()

  const [modalidad, setModalidad] = useState<Modalidad>('doubles')
  const [rules, setRules] = useState<MatchRules>(db.settings.lastRules[modalidad])
  const [sideA, setSideA] = useState<PlayerId[]>([])
  const [sideB, setSideB] = useState<PlayerId[]>([])
  const [selecting, setSelecting] = useState<'A' | 'B'>('A')
  const [saca, setSaca] = useState<Side>('A')

  const capacity = modalidad === 'doubles' ? 2 : 1
  const errors = validateRules(rules)
  const completo = sideA.length === capacity && sideB.length === capacity
  const listo = completo && errors.length === 0

  const nameOf = (id: PlayerId) => players.find((p) => p.id === id)?.name ?? '¿?'

  function toggle(id: PlayerId) {
    if (sideA.includes(id)) {
      setSideA(sideA.filter((x) => x !== id))
      setSelecting('A')
      return
    }
    if (sideB.includes(id)) {
      setSideB(sideB.filter((x) => x !== id))
      setSelecting('B')
      return
    }

    // Se llena el lado elegido; si ya está completo, cae en el otro.
    const hayLugar = { A: sideA.length < capacity, B: sideB.length < capacity }
    const destino = hayLugar[selecting] ? selecting : hayLugar.A ? 'A' : hayLugar.B ? 'B' : null
    if (destino === null) return

    if (destino === 'A') {
      const next = [...sideA, id]
      setSideA(next)
      if (next.length === capacity) setSelecting('B')
    } else {
      const next = [...sideB, id]
      setSideB(next)
      if (next.length === capacity) setSelecting('A')
    }
  }

  function cambiarModalidad(m: Modalidad) {
    setModalidad(m)
    // Cada modalidad arranca con su último formato usado.
    setRules(db.settings.lastRules[m])
    setSideA([])
    setSideB([])
    setSelecting('A')
    setSaca('A')
  }

  if (players.length < 2) {
    return (
      <Vacio>
        Cargá al menos dos jugadores en la pestaña <strong>Jugadores</strong> para poder empezar un
        partido.
      </Vacio>
    )
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Modalidad</Titulo>
        <div className="flex gap-2">
          <Opcion activa={modalidad === 'doubles'} onClick={() => cambiarModalidad('doubles')}>
            Dobles
          </Opcion>
          <Opcion activa={modalidad === 'singles'} onClick={() => cambiarModalidad('singles')}>
            Singles
          </Opcion>
        </div>
      </section>

      <section>
        <Titulo>Formato</Titulo>
        <FormatoPicker rules={rules} onChange={setRules} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        {(['A', 'B'] as const).map((side) => {
          const ids = side === 'A' ? sideA : sideB
          return (
            <button
              key={side}
              type="button"
              onClick={() => setSelecting(side)}
              className={[
                'min-h-24 rounded-xl border-2 p-3 text-left transition',
                selecting === side ? 'border-acento bg-tarjeta' : 'border-borde-2',
              ].join(' ')}
            >
              <span className="text-xs uppercase tracking-wide text-tinta-4">Lado {side}</span>
              <div className="mt-1 text-lg font-semibold text-tinta">
                {ids.length === 0 ? (
                  <span className="text-tinta-5">Elegí {capacity}</span>
                ) : (
                  ids.map(nameOf).join(' / ')
                )}
              </div>
            </button>
          )
        })}
      </section>

      <section>
        <Titulo>Saca primero</Titulo>
        <div className="flex gap-2">
          {(['A', 'B'] as const).map((side) => {
            const ids = side === 'A' ? sideA : sideB
            return (
              <Opcion key={side} activa={saca === side} onClick={() => setSaca(side)}>
                🎾 {ids.length > 0 ? ids.map(nameOf).join(' / ') : `Lado ${side}`}
              </Opcion>
            )
          })}
        </div>
      </section>

      <section>
        <Titulo>Jugadores</Titulo>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const elegida = sideA.includes(p.id) || sideB.includes(p.id)
            return (
              <PlayerChip
                key={p.id}
                name={p.name}
                selected={elegida}
                disabled={!elegida && completo}
                onClick={() => toggle(p.id)}
              />
            )
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={!listo}
        onClick={() => start(sideA, sideB, rules, saca)}
        className="min-h-14 w-full rounded-xl bg-acento text-lg font-bold text-acento-tinta disabled:opacity-30"
      >
        Empezar partido
      </button>
    </div>
  )
}
