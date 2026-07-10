import type { ReactNode } from 'react'

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="max-w-xs text-center text-slate-400">{children}</p>
    </div>
  )
}

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
  )
}

export function Opcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-12 rounded-lg px-4 text-sm font-medium transition',
        activa ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
