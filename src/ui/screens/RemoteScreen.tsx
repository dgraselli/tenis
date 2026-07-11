import { useCallback, useState } from 'react'
import { useStore } from '../../app/store'
import { useKeyCapture } from '../../app/useRemoteControl'
import { COMMAND_LABELS, DEFAULT_BINDINGS, bindKey } from '../../domain/remote/types'
import type { Command } from '../../domain/remote/types'
import { THEMES, THEME_HINTS, THEME_LABELS } from '../../domain/theme/types'
import type { ThemeId } from '../../domain/theme/types'
import { Feedback } from '../components/Feedback'
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

  const setTheme = (theme: ThemeId) =>
    update((d) => ({ ...d, settings: { ...d.settings, theme } }))

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Tema</Titulo>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              // Cada opción se pinta con su propio tema: es su vista previa.
              data-theme={t}
              onClick={() => setTheme(t)}
              aria-pressed={db.settings.theme === t}
              className={[
                'min-h-20 rounded-xl border-2 bg-fondo p-3 text-left font-tema transition',
                db.settings.theme === t ? 'border-acento' : 'border-borde-2',
              ].join(' ')}
            >
              <span className="font-semibold text-tinta">
                {THEME_LABELS[t]}
                {db.settings.theme === t && <span className="ml-1 text-acento-vivo">✓</span>}
              </span>
              <p className="mt-1 text-xs text-tinta-4">{THEME_HINTS[t]}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Titulo>Control remoto</Titulo>
        <p className="text-sm leading-relaxed text-tinta-3">
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
            <div key={command} className="flex items-center gap-3 rounded-xl bg-tarjeta p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-tinta">{COMMAND_LABELS[command]}</p>
                <p className="mt-1 font-mono text-xs text-tinta-4">
                  {aprendiendo ? 'Apretá una tecla… (Escape cancela)' : (code ?? 'sin asignar')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLearning(aprendiendo ? null : command)}
                className={[
                  'min-h-12 shrink-0 rounded-lg px-4 text-sm font-medium',
                  aprendiendo ? 'bg-aviso text-aviso-tinta' : 'bg-chip text-tinta',
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
        className="min-h-12 w-full rounded-xl bg-tarjeta text-sm text-tinta-2"
      >
        Volver a las teclas por defecto (flechas y borrar)
      </button>

      <section className="rounded-xl border border-borde p-4">
        <Titulo>Antes de comprar</Titulo>
        <p className="text-sm leading-relaxed text-tinta-3">
          Conviene un clicker que mande <strong>flechas</strong> o <strong>Page Up/Down</strong>. Los
          que mandan «subir volumen» —los remotos de cámara— no sirven: el sistema operativo se queda
          esa tecla para el volumen y el navegador nunca la ve.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-tinta-3">
          Un reloj inteligente no sirve para esto. Ni un Apple Watch ni un Wear OS le pueden mandar
          sus toques a una página web sin una app nativa de por medio.
        </p>
      </section>

      <Feedback />
    </div>
  )
}
