import { useEffect, useRef } from 'react'
import type { Command, KeyBindings } from '../domain/remote/types'

/** Algunos clickers repiten la tecla si se mantiene apretada. */
const DEBOUNCE_MS = 120

/**
 * Escucha el teclado y despacha comandos. No sabe ni le importa si la tecla
 * viene de un clicker Bluetooth, de un teclado o de un pasa-páginas: para el
 * navegador un dispositivo HID emparejado es un teclado más.
 */
export function useRemoteControl(
  bindings: KeyBindings,
  dispatch: (command: Command) => void,
  enabled = true,
): void {
  const lastFired = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const command = bindings[event.code]
      if (!command) return

      // No robarle las teclas a un input donde alguien está escribiendo.
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      const now = Date.now()
      if (now - (lastFired.current[event.code] ?? 0) < DEBOUNCE_MS) return
      lastFired.current[event.code] = now

      event.preventDefault()
      dispatch(command)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bindings, dispatch, enabled])
}

/**
 * Modo aprendizaje: captura la próxima tecla que se apriete, incluida Escape.
 * Quien llama decide qué hacer con ella (típicamente, Escape cancela).
 */
export function useKeyCapture(onCapture: ((code: string) => void) | null): void {
  useEffect(() => {
    if (!onCapture) return

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      onCapture(event.code)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCapture])
}
