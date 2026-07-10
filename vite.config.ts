import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Escucha en toda la red local para poder abrir la app desde el celular.
    host: true,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // Testing Library solo engancha su limpieza automática entre tests cuando
    // los globals están activos. Sin esto, el DOM de un test queda montado en
    // el siguiente y las consultas encuentran todo por duplicado.
    globals: true,
  },
})
