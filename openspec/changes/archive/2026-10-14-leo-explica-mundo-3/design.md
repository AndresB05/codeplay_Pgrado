## Context

El mundo 3 es el único con máximo de pasos (`stepLimit` en `config`, ver
`limite-de-pasos`). El contador —«Pasos restantes: N»— lo pinta `GameScene.tsx`
arriba a la derecha del tablero, dentro de la frontera diferida del juego, y sólo
existe en la pantalla de nivel (`StudentLevelModule`). La lista de niveles
(`StudentWorldLevelsModule`) no lo tiene.

`profiles` no admite `update` desde el cliente desde la 0009; la 0046 resolvió
lo mismo para `last_seen_at` con una función `security definer` que sólo toca
`auth.uid()`.

## Goals / Non-Goals

**Goals:**
- Que Leo hable donde el niño va a usar lo que explica.
- La migración más pequeña que guarde «visto» por cuenta.
- Un componente que reciba mundo, imagen y burbujas por parámetro.

**Non-Goals:**
- Un sistema de tutoriales: ni catálogo de explicaciones en la base, ni pasos
  configurables desde fuera, ni explicaciones en otros mundos.
- Animar al personaje: es una imagen fija que se desplaza.
- Señalar el contador real a través del velo.

## Decisions

### 1. Leo sale en la pantalla de nivel, no en la lista de niveles

Se monta en `StudentLevelModule`, cuando el nivel ya está `ready` y su mundo es el
tercero de la lista ordenada —el mismo criterio que ya decide `fillGaps` y
`withJump`—.

- Lo que explica sólo existe ahí: el contador está en pantalla detrás del velo, y
  al cerrar Leo el niño lo tiene donde la burbuja dijo.
- La tarjeta del mundo lleva a la lista de niveles, y desde ahí el niño elige
  uno. Pero sin progreso en el mundo el único abierto es el 1, así que «la
  primera vez que entra al mundo» y «la primera vez que abre un nivel del mundo»
  quedan a un toque de distancia. Quien tenga niveles sueltos de antes del
  candado verá a Leo en el que abra, que es igual de válido.
- La pantalla de nivel ya sabe el `stepLimit` del nivel abierto, así que la
  segunda burbuja puede enseñar **su** número y no uno inventado.

**Descartada:** la lista de niveles. Explicaría un contador que no se ve y que el
niño encontraría una pantalla después, que es justo lo que falló en la prueba.

### 2. La segunda burbuja enseña una copia del contador

Dentro de la burbuja va una píldora con el mismo aspecto que la del juego
(fondo `ink`, letra blanca, «Pasos restantes: N» con el máximo del nivel) y el
texto «Míralo arriba, a la derecha del tablero». Leo señala hacia su derecha y
arriba, que es la dirección del contador real.

**Descartada:** recortar el velo para que el contador real quede iluminado. La
píldora vive dentro de la frontera diferida del juego, su posición habría que
medirla a través de ella y cambia con el ancho; mucho mecanismo para una
diferencia que el niño no nota.

### 3. El botón para repetirlo va en la cabecera del nivel

Un botón con la cara de Leo y el texto «¿Cómo se juega aquí?», a la derecha del
título, en la tarjeta que ya tiene «Volver a los niveles». Sólo en el mundo 3.

**Descartada:** meterlo en la ayuda de las instrucciones (`helpOpen`). Ese panel
es un `<button>` entero —se toca para abrir y para cerrar— y no admite otro botón
dentro sin anidar botones. Ponerlo al lado, sobre el tablero, lo taparía el panel
al abrirse.

### 4. Guardado: un `uuid[]` en `profiles` y una función que añade

Migración `202606030048_world_intros_seen.sql`:

- `profiles.seen_world_intros uuid[] not null default '{}'`.
- `mark_world_intro_seen(input_world_id uuid) returns void`, `security definer`,
  `search_path = public`: exige `auth.uid()`, comprueba que el mundo existe y
  añade el id si no está (`array_append` bajo `not (input_world_id = any(...))`).
  `revoke` a `public`/`anon`, `grant execute` a `authenticated`, como la 0046.

La lectura va por `select seen_world_intros from profiles where id = <propio>`,
que `profiles_select_own` ya permite. Sin tabla nueva, sin política nueva.

- Por **id** de mundo y no por slug: la 0043 demostró que los slugs se renombran.
- En `profiles` y no en una tabla aparte: es un dato por persona, pequeño y que
  se lee con el perfil; una tabla pediría RLS, políticas y `grant` propios.
- **Se anota al cerrar**, no al abrir. Una función que anotase y devolviese «era
  la primera vez» parece más simple, pero con `React.StrictMode` el efecto corre
  dos veces en desarrollo: la primera llamada se descarta al desmontar y la
  segunda ya devuelve «no». Leo no saldría nunca en desarrollo.

**El lado del cliente** son dos métodos más en `profile.service.ts`
(`getSeenWorldIntros`, `markWorldIntroSeen`), con `{ data, error }`. No se añade
el campo a `User` ni se pasa por `AuthProvider`: sólo lo lee una pantalla y
meterlo en la sesión obligaría a refrescarla al cerrar.

### 5. El componente

`components/dashboard/student/WorldIntro.tsx`:

```ts
type WorldIntroProps = {
  image: string;
  bubbles: ReactNode[];
  onClose: () => void;
};
```

Recibe las burbujas ya escritas y no sabe de mundos, base ni contador: decidir
cuándo sale y anotarlo es cosa de quien lo monta. «Mundo por parámetro» queda en
quien lo monta, que pasa el id a `markWorldIntroSeen`. Los textos del mundo 3 viven
junto al montaje, en `StudentLevelModule`.

- **El velo cubre sólo el `<main>` del panel**, decidido por el usuario tras
  verlo: las barras lateral y superior quedan a la vista. Va en un portal a ese
  `<main>` —que es `relative isolate`— con `absolute inset-0`. Se descartó medir
  el rectángulo del `<main>` y pintar un `fixed` encima: habría que remedirlo en
  cada scroll y cada cambio de tamaño, y el `absolute` ya lo sigue solo y lo
  cubre entero aunque la página se desplace. El portal hace falta igual: dentro
  del árbol del módulo, el contenedor de posicionamiento dependería de lo que
  envuelva al diálogo. Leo va `sticky bottom-0` dentro del velo para quedarse en
  el borde inferior de la pantalla, y el velo lleva `overflow: clip` y no
  `hidden`, que lo convertiría en contenedor de scroll y rompería el `sticky`.
- **La barra lateral se puede usar** con Leo abierto: navegar desmonta el nivel
  y el diálogo con él, sin anotar la explicación como vista, porque no se llegó
  a cerrar. Bloquearla con una capa invisible la dejaría a la vista pero muerta,
  que confunde más. El teclado no llega a ella: Tab no sale del diálogo.
- **El tamaño lo manda el ancho del módulo, no el de la pantalla**: una
  *container query* sobre el velo (`.leo-stage`, en `main.css`). Con la barra
  lateral abierta, una tableta en vertical deja 500 px de módulo, y las clases
  `sm:` ponían a Leo y la burbuja lado a lado con la burbuja en 61 px. A partir
  de 720 px de módulo van lado a lado, con Leo a `min(64vh, 640px, 60cqw)`
  (≈72 % del alto visible a 1366×768) y letra de 26 px. Por debajo, la burbuja
  va encima.
- **La salida es la entrada al revés**: Leo y la burbuja caen (280 ms) y el velo
  se desvanece (320 ms). El cierre real espera al `animationend` del velo, con un
  respaldo de 600 ms. Sin movimiento, se cierra al instante.
- Velo con `bg-ink/70`; el clic en el velo cierra, el clic en Leo
  o en la burbuja no (`stopPropagation`).
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` al texto de la burbuja.
  El foco va al botón principal al abrir y a cada burbuja nueva; Tab no sale del
  diálogo; al cerrar vuelve al elemento que lo tenía.
- Escape cierra, como en `LevelCompleteDialog`.
- La imagen lleva `alt=""`: lo que dice Leo está en la burbuja.
- Leo abajo a la izquierda, a unos 260 px de alto (menos en móvil); la burbuja a
  su derecha, a la altura de su mano, con la cola hacia él.

### 6. Animación en CSS

Una clase en `main.css` bajo `@layer components`: entrada desde `translateY(110%)`
con un rebote corto (≈450 ms, `cubic-bezier` con sobrepaso), la burbuja con ≈120
ms de retraso. Un bloque `@media (prefers-reduced-motion: reduce)` le quita
`animation`, igual que hacen ya `.wood-plank` y `.wood-key`. Al pasar de burbuja
no se repite la entrada de Leo; la burbuja nueva aparece sin desplazarse.

### 7. Textos

1. «¡Hola! En este mundo los pasos están contados.»
2. «Mira arriba, a la derecha del tablero. Te dice cuántos te quedan.» + píldora
   «Pasos restantes: N».
3. «Si se acaban antes de la meta, toca empezar otra vez. ¡Busca el camino más
   corto!»

Botones: «Siguiente», «Siguiente», «¡Entendido!».

## Risks / Trade-offs

- [Los tipos no conocen la función ni la columna hasta regenerarlos] → el orden de
  las tareas pone la migración primero; el usuario lanza `db push` y
  `gen types`, y el código va después.
- [Si el `db push` no está hecho, la lectura falla] → la explicación no sale y el
  nivel se juega igual (está en el spec). El botón de la cabecera funciona aunque
  falle la lectura.
- [Un niño que cierra la pestaña con Leo abierto lo vuelve a ver] → aceptado: no
  llegó a cerrarlo.
- [Anotar falla en silencio] → lo vuelve a ver la próxima vez; preferible a un
  error que el niño no entiende.
- [El mundo 3 se decide por posición] → es el criterio que ya usan `fillGaps` y
  `withJump`; cuando haga falta en otro mundo, el montaje pasará a mirar otra cosa.

## Migration Plan

1. Escribir la 0048. El usuario lanza `supabase db push` y
   `npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts`.
2. Código. Sin la 0048 aplicada no rompe nada: la lectura falla y Leo no sale.
3. Vuelta atrás: quitar el montaje; la columna y la función pueden quedarse.
