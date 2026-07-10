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
          ? 'bg-acento text-acento-tinta'
          : 'bg-chip text-tinta enabled:active:bg-chip-activo',
      ].join(' ')}
    >
      {name}
    </button>
  )
}
