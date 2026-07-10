/**
 * Los botones táctiles y el clicker Bluetooth despachan los mismos comandos.
 * Son dos entradas al mismo camino, no dos caminos.
 */
export type Command = 'point:A' | 'point:B' | 'undo'

/** De `KeyboardEvent.code` a comando. Ej: { ArrowUp: 'point:A' } */
export type KeyBindings = Record<string, Command>

export const COMMAND_LABELS: Record<Command, string> = {
  'point:A': 'Punto para el lado de arriba',
  'point:B': 'Punto para el lado de abajo',
  undo: 'Deshacer el último punto',
}

/** Un teclado común sirve para probar sin tener el clicker todavía. */
export const DEFAULT_BINDINGS: KeyBindings = {
  ArrowUp: 'point:A',
  ArrowDown: 'point:B',
  Backspace: 'undo',
}

/** Vuelve a dejar libre una tecla antes de asignarla a otro comando. */
export function bindKey(bindings: KeyBindings, code: string, command: Command): KeyBindings {
  const next: KeyBindings = {}
  for (const [k, c] of Object.entries(bindings)) {
    if (k !== code && c !== command) next[k] = c
  }
  next[code] = command
  return next
}
