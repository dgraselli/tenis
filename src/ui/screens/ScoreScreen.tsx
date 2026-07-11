import { useStore } from '../../app/store'
import { useElapsedSeconds } from '../../app/useElapsed'
import { useMatch } from '../../app/useMatch'
import { usePlayers } from '../../app/usePlayers'
import { useRemoteControl } from '../../app/useRemoteControl'
import { formatClock } from '../../lib/duration'
import { canUndo } from '../../domain/scoring/liveMatch'
import { describeGame, describeRules, formatFinalScore, formatPoint } from '../../domain/scoring/format'
import type { Side } from '../../domain/scoring/types'
import { playerName } from '../../domain/players/types'
import { NewMatchScreen } from './NewMatchScreen'

export function ScoreScreen() {
  const { db } = useStore()
  const { active, point, undoPoint, dispatch, save, discard } = useMatch()
  const { players } = usePlayers()

  // El clicker y los botones táctiles despachan los mismos comandos.
  useRemoteControl(db.settings.keyBindings, dispatch, active !== null)

  if (active === null) return <NewMatchScreen />

  const { status, rules } = active.live
  const nameOf = (side: Side) =>
    active.sides[side].players.map((id) => playerName(players, id)).join(' / ')

  const subtitulo = describeGame(status.current, (s) => nameOf(s))

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-borde px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-tinta-4">
            <p className="truncate">{describeRules(rules)}</p>
            <Cronometro startedAt={active.startedAt} />
          </div>
          {subtitulo && <p className="text-sm font-semibold text-acento-vivo">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={undoPoint}
            disabled={!canUndo(active.live)}
            className="min-h-11 rounded-lg bg-tarjeta px-4 text-sm font-medium text-tinta disabled:opacity-30"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Descartar este partido sin guardarlo?')) discard()
            }}
            className="min-h-11 rounded-lg px-3 text-sm text-tinta-4"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {(['A', 'B'] as const).map((side) => (
          <button
            key={side}
            type="button"
            disabled={status.finished}
            onClick={() => point(side)}
            className={[
              'flex flex-1 items-center justify-between gap-4 px-6 transition',
              side === 'A' ? 'bg-panel' : 'bg-fondo',
              'enabled:active:bg-acento-fondo',
            ].join(' ')}
          >
            <div className="min-w-0 text-left">
              <div className="truncate text-nombre font-semibold text-tinta">{nameOf(side)}</div>
              <div className="tabular font-marcador mt-1 text-games font-bold leading-none text-tinta-2">
                {status.games[side]}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-tinta-5">games</div>
            </div>

            {status.current && (
              <div className="tabular font-marcador text-puntos font-black leading-none text-acento-vivo">
                {formatPoint(status.current, side)}
              </div>
            )}
          </button>
        ))}
      </div>

      {status.finished && status.winner && (
        <div className="border-t-2 border-acento bg-panel p-4">
          <p className="text-center text-lg">
            Ganó <strong className="text-acento-vivo">{nameOf(status.winner)}</strong>
          </p>
          <p className="tabular font-marcador mt-1 text-center text-3xl font-bold text-tinta">
            {formatFinalScore(status, status.winner)}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={undoPoint}
              className="min-h-14 flex-1 rounded-xl bg-tarjeta font-medium text-tinta"
            >
              Me equivoqué
            </button>
            <button
              type="button"
              onClick={save}
              className="min-h-14 flex-[2] rounded-xl bg-acento text-lg font-bold text-acento-tinta"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Va aparte para que el tick por segundo no re-renderice el tanteador entero.
 * Sigue corriendo hasta guardar: la duración guardada es la que se ve al tocar
 * "Guardar".
 */
function Cronometro({ startedAt }: { startedAt: string }) {
  const seconds = useElapsedSeconds(startedAt)
  return <span className="tabular shrink-0">{formatClock(seconds)}</span>
}
