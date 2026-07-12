/** Los valores de cada tema (colores, fuente y tamaños) viven en index.css, bajo [data-theme='...']. */
export type ThemeId = 'oscuro' | 'claro' | 'contraste' | 'slam'

export const THEMES: ThemeId[] = ['slam', 'oscuro', 'claro', 'contraste']

export const DEFAULT_THEME: ThemeId = 'slam'

export const THEME_LABELS: Record<ThemeId, string> = {
  slam: 'Grand Slam',
  oscuro: 'Oscuro',
  claro: 'Claro',
  contraste: 'Alto contraste',
}

export const THEME_HINTS: Record<ThemeId, string> = {
  slam: 'Verde de tablero y dígitos amarillos, como en los grandes.',
  oscuro: 'Sobrio, de noche no encandila.',
  claro: 'Para pleno sol.',
  contraste: 'Números gigantes en negro y amarillo: se ve del otro lado del club.',
}
