/** Segundos transcurridos desde un instante ISO hasta `to` (ahora por defecto). */
export function elapsedSeconds(fromIso: string, to = Date.now()): number {
  return Math.max(0, Math.floor((to - new Date(fromIso).getTime()) / 1000))
}

/** "12:34" o "1:02:09": el reloj del partido en curso. */
export function formatClock(totalSeconds: number): string {
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60) % 60
  const h = Math.floor(totalSeconds / 3600)
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

/** "45 min" o "1 h 20 min": la duración de un partido guardado. */
export function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
