import { useStore } from '../../app/store'
import { usePlayers } from '../../app/usePlayers'
import { useStats } from '../../app/useStats'
import { MIN_PAIR_MATCHES } from '../../domain/stats/compute'
import { playerName } from '../../domain/players/types'
import { Titulo, Vacio } from '../components/Vacio'

const pct = (v: number) => `${Math.round(v * 100)}%`

export function RankingScreen() {
  const { db } = useStore()
  const { players } = usePlayers()
  const { ranking, topPairs } = useStats()

  if (db.matches.length === 0) {
    return <Vacio>El ranking aparece cuando terminen su primer partido.</Vacio>
  }

  const conPartidos = ranking.filter((s) => s.played > 0)

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section>
        <Titulo>Ranking individual</Titulo>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-tinta-4">
            <tr>
              <th className="py-2 text-left font-medium">Jugadora</th>
              <th className="py-2 text-right font-medium">PJ</th>
              <th className="py-2 text-right font-medium">Gan</th>
              <th className="py-2 text-right font-medium">%</th>
              <th className="py-2 text-right font-medium">Games</th>
              <th className="py-2 text-right font-medium">Nivel</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {conPartidos.map((s, i) => (
              <tr key={s.playerId} className="border-t border-borde">
                <td className="py-3 text-left font-medium text-tinta">
                  <span className="mr-2 text-tinta-5">{i + 1}</span>
                  {playerName(players, s.playerId)}
                </td>
                <td className="py-3 text-right text-tinta-3">{s.played}</td>
                <td className="py-3 text-right text-tinta-3">{s.won}</td>
                <td className="py-3 text-right text-tinta-3">{pct(s.winRate)}</td>
                <td className="py-3 text-right text-tinta-3">
                  {s.gamesDiff > 0 ? `+${s.gamesDiff}` : s.gamesDiff}
                </td>
                <td className="py-3 text-right font-bold text-acento-vivo">
                  {Math.round(s.rating)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-relaxed text-tinta-5">
          El <strong>nivel</strong> es el porcentaje de victorias amortiguado: arranca cerca de 50 y
          se va acercando al rendimiento real a medida que juegan. Ganar el primer partido deja el
          nivel en 58, no en 100. Es el número que usa el sorteo nivelado.
        </p>
      </section>

      <section>
        <Titulo>Mejores duplas</Titulo>
        {topPairs.length === 0 ? (
          <p className="text-sm text-tinta-4">
            Ninguna dupla jugó todavía {MIN_PAIR_MATCHES} partidos juntas. Hasta entonces no tiene
            sentido rankearlas: una que ganó su único partido encabezaría la tabla.
          </p>
        ) : (
          <ul className="space-y-2">
            {topPairs.map((p) => (
              <li
                key={p.players.join('|')}
                className="flex items-center justify-between rounded-xl bg-tarjeta p-3"
              >
                <span className="font-medium text-tinta">
                  {p.players.map((id) => playerName(players, id)).join(' / ')}
                </span>
                <span className="tabular text-sm text-tinta-3">
                  {p.won}-{p.lost} · <strong className="text-acento-vivo">{pct(p.winRate)}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
