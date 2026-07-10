import { useCallback, useState } from 'react'
import { useStore } from '../../app/store'
import { useKeyCapture } from '../../app/useRemoteControl'
import { COMMAND_LABELS, DEFAULT_BINDINGS, bindKey } from '../../domain/remote/types'
import type { Command } from '../../domain/remote/types'
import { Titulo } from '../components/Vacio'

const COMMANDS: Command[] = ['point:A', 'point:B', 'undo']

export function RemoteScreen() {
  const { db, update } = useStore()
  const [learning, setLearning] = useState<Command | null>(null)

  const bindings = db.settings.keyBindings

  const capture = useCallback(
    (code: string) => {
      if (learning === null) return
      if (code !== 'Escape') {
        update((d) => ({
          ...d,
          settings: { ...d.settings, keyBindings: bindKey(d.settings.keyBindings, code, learning) },
        }))
      }
      setLearning(null)
    },
    [learning, update],
  )

  useKeyCapture(learning ? capture : null)

  const keyFor = (command: Command) =>
    Object.entries(bindings).find(([, c]) => c === command)?.[0]

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Control remoto</Titulo>
        <p className="text-sm leading-relaxed text-slate-400">
          Emparejá un clicker Bluetooth con el celular (los pasa-páginas o anillos de control andan
          bien). El celular lo ve como un teclado y la app escucha sus teclas. Apretá{' '}
          <em>Configurar</em> y después el botón del clicker que quieras usar.
        </p>
      </section>

      <section className="space-y-2">
        {COMMANDS.map((command) => {
          const code = keyFor(command)
          const aprendiendo = learning === command
          return (
            <div key={command} className="flex items-center gap-3 rounded-xl bg-slate-800 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100">{COMMAND_LABELS[command]}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {aprendiendo ? 'Apretá una tecla… (Escape cancela)' : (code ?? 'sin asignar')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLearning(aprendiendo ? null : command)}
                className={[
                  'min-h-12 shrink-0 rounded-lg px-4 text-sm font-medium',
                  aprendiendo ? 'bg-amber-400 text-amber-950' : 'bg-slate-700 text-slate-100',
                ].join(' ')}
              >
                {aprendiendo ? 'Escuchando' : 'Configurar'}
              </button>
            </div>
          )
        })}
      </section>

      <button
        type="button"
        onClick={() =>
          update((d) => ({ ...d, settings: { ...d.settings, keyBindings: DEFAULT_BINDINGS } }))
        }
        className="min-h-12 w-full rounded-xl bg-slate-800 text-sm text-slate-300"
      >
        Volver a las teclas por defecto (flechas y borrar)
      </button>

      <section className="rounded-xl border border-slate-800 p-4">
        <Titulo>Antes de comprar</Titulo>
        <p className="text-sm leading-relaxed text-slate-400">
          Conviene un clicker que mande <strong>flechas</strong> o <strong>Page Up/Down</strong>. Los
          que mandan «subir volumen» —los remotos de cámara— no sirven: el sistema operativo se queda
          esa tecla para el volumen y el navegador nunca la ve.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Un reloj inteligente no sirve para esto. Ni un Apple Watch ni un Wear OS le pueden mandar
          sus toques a una página web sin una app nativa de por medio.
        </p>
      </section>
    </div>
  )
}
