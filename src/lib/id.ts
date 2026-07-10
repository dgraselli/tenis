export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Navegadores viejos y contextos sin https: alcanza para ids locales.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
