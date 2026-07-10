import { useState } from 'react'
import { useStore } from './app/store'
import { TabBar } from './ui/components/TabBar'
import type { Tab } from './ui/components/TabBar'
import { DrawScreen } from './ui/screens/DrawScreen'
import { HistoryScreen } from './ui/screens/HistoryScreen'
import { PlayersScreen } from './ui/screens/PlayersScreen'
import { RankingScreen } from './ui/screens/RankingScreen'
import { RemoteScreen } from './ui/screens/RemoteScreen'
import { ScoreScreen } from './ui/screens/ScoreScreen'

type View = Tab | 'ajustes'

const TITLES: Record<View, string> = {
  partido: 'Partido',
  sorteo: 'Sorteo del día',
  ranking: 'Ranking',
  historial: 'Historial',
  jugadoras: 'Jugadoras',
  ajustes: 'Control remoto',
}

export default function App() {
  const [view, setView] = useState<View>('partido')
  const { saveError } = useStore()

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 pt-[env(safe-area-inset-top)]">
        <h1 className="py-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
          {TITLES[view]}
        </h1>
        <button
          type="button"
          onClick={() => setView(view === 'ajustes' ? 'partido' : 'ajustes')}
          aria-label="Control remoto"
          className={[
            'min-h-11 rounded-lg px-3 text-lg',
            view === 'ajustes' ? 'text-emerald-400' : 'text-slate-500',
          ].join(' ')}
        >
          ⚙
        </button>
      </header>

      {saveError && (
        <p className="shrink-0 bg-rose-900 px-4 py-2 text-sm text-rose-100">{saveError}</p>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'partido' && <ScoreScreen />}
        {view === 'sorteo' && <DrawScreen onPlay={() => setView('partido')} />}
        {view === 'ranking' && <RankingScreen />}
        {view === 'historial' && <HistoryScreen />}
        {view === 'jugadoras' && <PlayersScreen />}
        {view === 'ajustes' && <RemoteScreen />}
      </main>

      <TabBar value={view} onChange={setView} />
    </div>
  )
}
