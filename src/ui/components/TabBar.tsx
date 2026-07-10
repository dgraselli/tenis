export const TABS = ['partido', 'sorteo', 'ranking', 'historial', 'jugadoras'] as const
export type Tab = (typeof TABS)[number]

const LABELS: Record<Tab, string> = {
  partido: 'Partido',
  sorteo: 'Sorteo',
  ranking: 'Ranking',
  historial: 'Historial',
  jugadoras: 'Jugadoras',
}

export function TabBar({ value, onChange }: { value: string; onChange: (tab: Tab) => void }) {
  return (
    <nav className="flex shrink-0 border-t border-slate-700 bg-slate-900 pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={[
            'flex-1 py-3 text-xs font-medium transition',
            value === tab ? 'text-emerald-400' : 'text-slate-400',
          ].join(' ')}
        >
          {LABELS[tab]}
        </button>
      ))}
    </nav>
  )
}
