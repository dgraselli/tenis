/** Los valores de cada tema (colores, fuente y tamaños) viven en index.css, bajo [data-theme='...']. */
export type ThemeId = 'oscuro' | 'claro' | 'canchero' | 'contraste' | 'slam'

export const THEMES: ThemeId[] = ['oscuro', 'claro', 'canchero', 'contraste', 'slam']

export const DEFAULT_THEME: ThemeId = 'oscuro'

export const THEME_LABELS: Record<ThemeId, string> = {
  oscuro: 'Oscuro',
  claro: 'Claro',
  canchero: 'Canchero',
  contraste: 'Alto contraste',
  slam: 'Grand Slam',
}

export const THEME_HINTS: Record<ThemeId, string> = {
  oscuro: 'El de siempre: sobrio, de noche no encandila.',
  claro: 'Para pleno sol.',
  canchero: 'Polvo de ladrillo, atardecer y letra divertida.',
  contraste: 'Números gigantes en negro y amarillo: se ve del otro lado del club.',
  slam: 'Verde de tablero y dígitos amarillos, como en los grandes.',
}
