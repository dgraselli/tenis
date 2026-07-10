import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { StoreProvider } from './app/store'
import { createLocalStorageRepo } from './persistence/localStorageRepo'
import type { StorageLike } from './persistence/localStorageRepo'
import type { Repository } from './persistence/repository'

class FakeStorage implements StorageLike {
  map = new Map<string, string>()
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
}

let storage: FakeStorage
let repo: Repository

beforeEach(() => {
  storage = new FakeStorage()
  repo = createLocalStorageRepo(storage)
})

function renderApp() {
  return render(
    <StoreProvider repo={repo}>
      <App />
    </StoreProvider>,
  )
}

const tab = (name: string) => screen.getByRole('button', { name })
const half = (name: string) => screen.getByRole('button', { name: new RegExp(name) })

async function agregarJugadoras(user: ReturnType<typeof userEvent.setup>, nombres: string[]) {
  await user.click(tab('Jugadoras'))
  for (const nombre of nombres) {
    await user.type(screen.getByPlaceholderText('Nombre'), nombre)
    await user.click(screen.getByRole('button', { name: 'Agregar' }))
  }
}

/** Deja un singles Ana vs Bea, a 4 games, listo para empezar. */
async function empezarSingles(user: ReturnType<typeof userEvent.setup>) {
  await agregarJugadoras(user, ['Ana', 'Bea'])
  await user.click(tab('Partido'))

  // La modalidad va primero: al cambiarla, el formato vuelve a su último usado.
  await user.click(screen.getByRole('button', { name: 'Singles' }))
  await user.click(screen.getByRole('button', { name: 'Set corto (4 games)' }))

  await user.click(screen.getByRole('button', { name: 'Ana' }))
  await user.click(screen.getByRole('button', { name: 'Bea' }))
  await user.click(screen.getByRole('button', { name: 'Empezar partido' }))
}

describe('la app de punta a punta', () => {
  it('juega un partido, lo guarda y lo muestra en el historial y el ranking', async () => {
    const user = userEvent.setup()
    renderApp()
    await empezarSingles(user)

    expect(screen.getByText('Set a 4 games')).toBeInTheDocument()

    // 16 puntos limpios de Ana: cuatro games a cero.
    for (let i = 0; i < 16; i++) await user.click(half('Ana'))

    expect(screen.getByText(/Ganó/)).toBeInTheDocument()
    expect(screen.getByText('4-0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // Vuelve a la pantalla de nuevo partido: el tanteador quedó libre.
    expect(screen.getByRole('button', { name: 'Empezar partido' })).toBeInTheDocument()

    await user.click(tab('Historial'))
    const tarjeta = screen.getByRole('article')
    expect(within(tarjeta).getByText('4-0')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Ana')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Set a 4 games')).toBeInTheDocument()

    await user.click(tab('Ranking'))
    const filaAna = screen.getByRole('row', { name: /Ana/ })
    expect(within(filaAna).getByText('100%')).toBeInTheDocument()
    // Ganar el primer partido deja el nivel en 59 (58,3 más el ajuste por
    // diferencia de games), no en 100.
    expect(within(filaAna).getByText('59')).toBeInTheDocument()
  })

  it('deshacer devuelve el marcador al punto anterior', async () => {
    const user = userEvent.setup()
    renderApp()
    await empezarSingles(user)

    await user.click(half('Ana'))
    expect(half('Ana')).toHaveTextContent('15')

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(half('Ana')).toHaveTextContent('0')
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeDisabled()
  })

  it('el clicker Bluetooth suma puntos como los botones', async () => {
    const user = userEvent.setup()
    renderApp()
    await empezarSingles(user)

    // Las teclas por defecto: flechas para los puntos, borrar para deshacer.
    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(half('Ana')).toHaveTextContent('15')

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    expect(half('Bea')).toHaveTextContent('15')

    fireEvent.keyDown(window, { code: 'Backspace' })
    expect(half('Bea')).toHaveTextContent('0')
  })

  it('el partido en curso sobrevive a cerrar y reabrir la app', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await empezarSingles(user)

    await user.click(half('Ana'))
    await user.click(half('Ana'))
    expect(half('Ana')).toHaveTextContent('30')

    // Se cierra la pestaña y se vuelve a abrir contra el mismo almacenamiento.
    unmount()
    render(
      <StoreProvider repo={createLocalStorageRepo(storage)}>
        <App />
      </StoreProvider>,
    )

    expect(half('Ana')).toHaveTextContent('30')
    expect(screen.getByText('Set a 4 games')).toBeInTheDocument()
  })

  it('el formato queda congelado en cada partido', async () => {
    const user = userEvent.setup()
    renderApp()

    // Un partido a 4 games.
    await empezarSingles(user)
    for (let i = 0; i < 16; i++) await user.click(half('Ana'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // Ahora se cambia el default a 6 games y se empieza otro.
    await user.click(screen.getByRole('button', { name: 'Singles' }))
    await user.click(screen.getByRole('button', { name: 'Set normal (6 games)' }))
    await user.click(screen.getByRole('button', { name: 'Ana' }))
    await user.click(screen.getByRole('button', { name: 'Bea' }))
    await user.click(screen.getByRole('button', { name: 'Empezar partido' }))
    expect(screen.getByText('Set a 6 games')).toBeInTheDocument()

    // El partido viejo sigue mostrándose como lo que fue: un set a 4.
    await user.click(tab('Historial'))
    expect(screen.getByText('Set a 4 games')).toBeInTheDocument()
  })

  it('al jugar un cruce del sorteo se elige el formato, con el último de la modalidad de default', async () => {
    const user = userEvent.setup()
    renderApp()

    // Un singles a 4 games deja ese formato como último usado en singles.
    await empezarSingles(user)
    for (let i = 0; i < 16; i++) await user.click(half('Ana'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(tab('Sorteo'))
    await user.click(screen.getByRole('button', { name: 'Ana' }))
    await user.click(screen.getByRole('button', { name: 'Bea' }))
    await user.click(screen.getByRole('button', { name: 'Sortear' }))
    await user.click(screen.getByRole('button', { name: 'Jugar' }))

    // Todavía no empezó nada: primero se confirma el formato, que arranca
    // en el último usado para singles.
    expect(screen.getByText('Formato de juego')).toBeInTheDocument()
    expect(screen.getByText('Set a 4 games')).toBeInTheDocument()

    // Se puede cambiar antes de arrancar.
    await user.click(screen.getByRole('button', { name: 'Set normal (6 games)' }))
    await user.click(screen.getByRole('button', { name: 'Empezar partido' }))

    // El tanteador quedó con el formato elegido.
    expect(screen.getByText('Set a 6 games')).toBeInTheDocument()
    expect(screen.getByText(/Ana/)).toBeInTheDocument()
  })
})
