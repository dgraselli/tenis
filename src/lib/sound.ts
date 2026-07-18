import type { ScoreEvent } from '../domain/scoring/events'

export type Sound = ScoreEvent | 'deshacer'

/**
 * Notas de cada sonido: [frecuencia en Hz, arranque en segundos]. Cuanto más
 * importante lo que se cerró, más notas. Sintetizado con Web Audio: sin
 * archivos que descargar, suena igual offline.
 */
const NOTES: Record<Sound, [number, number][]> = {
  punto: [[880, 0]],
  game: [
    [660, 0],
    [880, 0.12],
  ],
  set: [
    [660, 0],
    [880, 0.12],
    [1100, 0.24],
  ],
  partido: [
    [660, 0],
    [880, 0.12],
    [1100, 0.24],
    [1320, 0.36],
  ],
  deshacer: [[330, 0]],
}

let ctx: AudioContext | null = null

export function playSound(sound: Sound): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return
  try {
    // Se crea en el primer punto: para entonces ya hubo un toque en la
    // pantalla y el navegador permite audio.
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    const t0 = ctx.currentTime
    for (const [freq, at] of NOTES[sound]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      // Envolvente corta: blip, no alarma.
      gain.gain.setValueAtTime(0.0001, t0 + at)
      gain.gain.exponentialRampToValueAtTime(0.4, t0 + at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0 + at)
      osc.stop(t0 + at + 0.2)
    }
  } catch {
    // Sin audio no se rompe nada: el tanteador sigue mudo.
  }
}
