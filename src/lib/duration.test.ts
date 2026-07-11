import { describe, expect, it } from 'vitest'
import { elapsedSeconds, formatClock, formatDuration } from './duration'

describe('elapsedSeconds', () => {
  it('mide los segundos entre dos instantes', () => {
    const inicio = '2026-07-11T10:00:00.000Z'
    expect(elapsedSeconds(inicio, Date.parse('2026-07-11T10:42:30.000Z'))).toBe(2550)
  })

  it('nunca es negativo aunque el reloj se haya movido hacia atrás', () => {
    const inicio = '2026-07-11T10:00:00.000Z'
    expect(elapsedSeconds(inicio, Date.parse('2026-07-11T09:59:00.000Z'))).toBe(0)
  })
})

describe('formatClock', () => {
  it('muestra minutos y segundos con dos dígitos', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(600)).toBe('10:00')
  })

  it('agrega las horas cuando el partido pasa de una hora', () => {
    expect(formatClock(3600)).toBe('1:00:00')
    expect(formatClock(3600 + 125)).toBe('1:02:05')
  })
})

describe('formatDuration', () => {
  it('redondea a minutos', () => {
    expect(formatDuration(2550)).toBe('43 min')
    expect(formatDuration(59 * 60)).toBe('59 min')
  })

  it('un partido relámpago figura como 1 min, no como 0', () => {
    expect(formatDuration(10)).toBe('1 min')
  })

  it('pasa a horas y minutos cuando corresponde', () => {
    expect(formatDuration(3600)).toBe('1 h')
    expect(formatDuration(3600 + 20 * 60)).toBe('1 h 20 min')
  })
})
