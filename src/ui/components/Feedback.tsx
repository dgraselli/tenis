import { Titulo } from './Vacio'

/**
 * Enlace a un formulario externo de feedback (ej. Tally), como en regatas:
 * la URL llega por variable de entorno y, si no está configurada, la sección
 * directamente no existe.
 */
export function Feedback() {
  const url = import.meta.env.VITE_FEEDBACK_URL
  if (!url) return null

  return (
    <section className="rounded-xl border border-borde p-4">
      <Titulo>Feedback</Titulo>
      <p className="text-sm leading-relaxed text-tinta-3">
        ¿Encontraste un error o se te ocurrió una mejora? Contanos.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tarjeta text-sm font-medium text-tinta"
      >
        💬 Enviar feedback
      </a>
    </section>
  )
}
