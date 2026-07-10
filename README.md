# Tanteador de tenis

App web para llevar el tanteador, el ranking y el sorteo de parejas de un grupo de amigas.
Pensada para usarse con una mano en la cancha, instalable como PWA, y con los datos guardados
en el celular.

## Qué hace

- **Tanteador en vivo** con las reglas reales del tenis: 15/30/40, deuce, ventaja, games, tie-break.
  El largo del set es configurable (4, 6, 8 games, o el número que quieran), con o sin tie-break.
- **Historial** de partidos, cada uno con el formato con el que se jugó.
- **Ranking** individual y de duplas.
- **Jugadoras**: alta y baja lógica (nunca se borran, para no romper el historial).
- **Sorteo de cruces** entre las presentes, con tres criterios a elección: azar puro, sin repetir
  duplas, o nivelado por rating.
- **Control remoto**: se puede anotar con un clicker Bluetooth sin tocar el celular.

## Correr el proyecto

```bash
pnpm install
pnpm dev       # abre en la red local; entrá desde el celular con la IP de la máquina
pnpm test      # 107 tests
pnpm build     # typecheck + build de producción
pnpm preview   # sirve el build, con service worker activo
```

## Cómo está armado

Tres anillos, con las dependencias apuntando en una sola dirección:

```
src/
├─ domain/       TypeScript puro. Sin React, sin localStorage. Es donde están los tests que importan.
│  ├─ scoring/     motor de tanteo (máquina de estados)
│  ├─ stats/       ranking, estadísticas, rating
│  ├─ draw/        sorteo de cruces
│  ├─ players/     jugadoras
│  ├─ match/       partido guardado y partido en curso
│  └─ remote/      comandos del control remoto
├─ persistence/  interfaz Repository, adaptador localStorage, migraciones
├─ app/          hooks que pegan dominio y persistencia
└─ ui/           componentes y pantallas
```

`domain/` no importa de ningún otro anillo. `ui/` habla con los datos solo a través de los hooks de
`app/`. El punto de corte para migrar a un backend es la interfaz `Repository`: escribir un
`cloudRepo.ts` no obliga a tocar el dominio ni las pantallas.

### Decisiones que conviene conocer antes de tocar el código

**Las reglas se congelan dentro de cada partido guardado.** Un partido jugado a 4 games se muestra y
se recomputa a 4 games para siempre, aunque después cambien el formato por defecto. Sin esto, cambiar
la configuración reinterpretaría retroactivamente el historial.

**Deshacer un punto recomputa el partido entero desde el log de puntos**, en vez de restaurar un
snapshot guardado. Un set no pasa de unos 180 puntos, así que recalcular cuesta microsegundos y es
imposible que el estado quede desincronizado.

**El ranking no se persiste**: se deriva del historial en cada render. Guardar agregados obligaría a
invalidarlos cada vez que se corrige o borra un partido.

**El rating es el porcentaje de victorias amortiguado**, no Elo. Ganar el primer partido deja a una
jugadora en 58, no en 100. Se eligió así porque se explica en una frase y no depende del orden de los
partidos, así que corregir uno viejo no obliga a reprocesar la cronología.

**El azar del sorteo entra por un `rng` inyectable**, para que los tests sean deterministas con una
semilla fija.

## El clicker Bluetooth

Un smartwatch **no sirve** para anotar desde una web app: Web Bluetooth no existe en iOS, y ni Apple
Watch ni Wear OS le pueden mandar sus toques a una página sin una app nativa de por medio.

Lo que sí funciona es un **clicker Bluetooth de dos botones** (un pasa-páginas o un anillo de control,
unos 5 a 15 dólares). El celular lo empareja como si fuera un teclado, y la app escucha las teclas.
En la pantalla de Control remoto (el engranaje, arriba a la derecha) se aprieta *Configurar* y después
el botón del clicker, y queda asignado.

Conviene uno que mande **flechas** o **Page Up/Down**. Los que mandan «subir volumen» —los remotos de
cámara— no sirven: el sistema operativo se queda esa tecla y el navegador nunca la ve.


