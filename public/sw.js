/**
 * Service worker escrito a mano. La app es chica y sus assets llevan hash en el
 * nombre, así que no hace falta un manifiesto de precache ni las 300
 * dependencias que arrastra Workbox.
 *
 * Estrategia: los assets con hash son inmutables, así que van cache-first. La
 * navegación va network-first, para que una versión nueva de la app llegue
 * apenas hay señal, y caiga al cache solo si el celular está sin internet.
 */
const CACHE = 'tanteador-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function guardar(request, response) {
  const cache = await caches.open(CACHE)
  await cache.put(request, response)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Solo GET del mismo origen: nada de interceptar terceros ni escrituras.
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          guardar(request, response.clone())
          return response
        })
        // Relativas al propio sw.js: funcionan en la raíz y bajo /tenis/.
        .catch(async () => (await caches.match('./index.html')) ?? caches.match('./')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) guardar(request, response.clone())
          return response
        }),
    ),
  )
})
