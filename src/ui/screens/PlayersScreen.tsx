import { useState } from 'react'
import { usePlayers } from '../../app/usePlayers'
import { useStats } from '../../app/useStats'
import { Titulo } from '../components/Vacio'

export function PlayersScreen() {
  const { players, add, rename, setActive } = usePlayers()
  const { playerStats } = useStats()
  const [nombre, setNombre] = useState('')

  const statsOf = (id: string) => playerStats.find((s) => s.playerId === id)
  const activas = players.filter((p) => p.active)
  const inactivas = players.filter((p) => !p.active)

  function agregar() {
    const limpio = nombre.trim()
    if (!limpio) return
    add(limpio)
    setNombre('')
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Agregar jugadora</Titulo>
        <div className="flex gap-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregar()}
            placeholder="Nombre"
            className="min-h-12 flex-1 rounded-lg bg-slate-800 px-4 text-slate-100 placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={nombre.trim() === ''}
            className="min-h-12 rounded-lg bg-emerald-500 px-5 font-bold text-emerald-950 disabled:opacity-30"
          >
            Agregar
          </button>
        </div>
      </section>

      <section>
        <Titulo>En el grupo ({activas.length})</Titulo>
        <ul className="space-y-2">
          {activas.map((p) => {
            const s = statsOf(p.id)
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-800 p-3">
                <input
                  value={p.name}
                  onChange={(e) => rename(p.id, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-lg text-slate-100 outline-none"
                />
                <span className="tabular shrink-0 text-sm text-slate-500">
                  {s ? `${s.played} PJ · ${Math.round(s.rating)}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => setActive(p.id, false)}
                  className="min-h-10 shrink-0 rounded-lg px-3 text-sm text-slate-500"
                >
                  Dar de baja
                </button>
              </li>
            )
          })}
        </ul>
        {activas.length === 0 && (
          <p className="text-sm text-slate-500">Todavía no hay ninguna jugadora.</p>
        )}
      </section>

      {inactivas.length > 0 && (
        <section>
          <Titulo>Dadas de baja</Titulo>
          <p className="mb-2 text-xs text-slate-600">
            No se borran nunca: sus partidos siguen contando en el historial.
          </p>
          <ul className="space-y-2">
            {inactivas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-900 p-3 text-slate-500"
              >
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => setActive(p.id, true)}
                  className="min-h-10 rounded-lg px-3 text-sm text-emerald-400"
                >
                  Reactivar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
