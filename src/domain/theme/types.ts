/** Los valores de cada tema viven en index.css, bajo [data-theme='...']. */
export type ThemeId = 'oscuro' | 'claro' | 'canchero' | 'contraste'

export const THEMES: ThemeId[] = ['oscuro', 'claro', 'canchero', 'contraste']

export const DEFAULT_THEME: ThemeId = 'oscuro'

export const THEME_LABELS: Record<ThemeId, string> = {
  oscuro: 'Oscuro',
  claro: 'Claro',
  canchero: 'Canchero',
  contraste: 'Alto contraste',
}

export const THEME_HINTS: Record<ThemeId, string> = {
  oscuro: 'El de siempre: sobrio, de noche no encandila.',
  claro: 'Para pleno sol.',
  canchero: 'Polvo de ladrillo y atardecer.',
  contraste: 'Negro y amarillo fuertes: se lee de lejos.',
}
