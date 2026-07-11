import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Feedback } from './Feedback'

describe('Feedback', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin formulario configurado no muestra nada', () => {
    // Fijado explícitamente: en CI la variable real existe y llega a los tests.
    vi.stubEnv('VITE_FEEDBACK_URL', '')
    const { container } = render(<Feedback />)
    expect(container).toBeEmptyDOMElement()
  })

  it('con la URL configurada muestra el enlace al formulario', () => {
    vi.stubEnv('VITE_FEEDBACK_URL', 'https://tally.so/r/ejemplo')
    render(<Feedback />)

    const link = screen.getByRole('link', { name: /Enviar feedback/ })
    expect(link).toHaveAttribute('href', 'https://tally.so/r/ejemplo')
    // Abre aparte para no perder el partido en curso.
    expect(link).toHaveAttribute('target', '_blank')
  })
})
