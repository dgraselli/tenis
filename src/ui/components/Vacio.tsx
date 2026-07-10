import type { ReactNode } from 'react'

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="max-w-xs text-center text-tinta-3">{children}</p>
    </div>
  )
}

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-tinta-4">{children}</h2>
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
        activa ? 'bg-acento text-acento-tinta' : 'bg-tarjeta text-tinta-2',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
