interface Props {
  name: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function PlayerChip({ name, selected = false, disabled = false, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'min-h-12 rounded-full px-4 py-2 text-base font-medium transition',
        'disabled:opacity-35',
        selected
          ? 'bg-emerald-500 text-emerald-950'
          : 'bg-slate-700 text-slate-100 enabled:active:bg-slate-600',
      ].join(' ')}
    >
      {name}
    </button>
  )
}
