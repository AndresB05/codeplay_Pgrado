## Context

Ver `proposal.md` — Why. Aquí queda sólo lo que condiciona el **cómo**, y son
tres hechos medidos contra la base real el 20-sep-2026:

1. **El catálogo de logros copió los nombres, no los referencia.** Los nueve
   `perfect_wN_lM` se sembraron en la `0036` con un `select` sobre `levels` que
   limpia el prefijo con `split_part(level.title, ' - ', 2)`, y los tres
   `perfect_world_N` llevan el nombre del mundo **escrito a mano** en el título
   («Dueño de la Selva») y dentro de la descripción («Supera los tres niveles de
   Selva Algorítmica con 100 de 100»). Renombrar un mundo **no actualiza ni una
   ni otra**.
2. **`achievements` vuelve a copiar al conceder.** `award_achievements` inserta
   título, descripción, icono y XP tomados del catálogo, y `achievements` los
   tiene `not null` desde la `0005`. Lo concedido es una foto, no un enlace.
3. **Las claves no dependen del nombre.** `perfect_w2_l3` y `perfect_world_2`
   salen del `sort_order` del mundo y del nivel. Ningún `sort_order` cambia.

Y dos del lado del cliente:

- La landing (`WorldsSection.tsx`) tiene los tres nombres **escritos dentro del
  componente**. No lee la base y no puede: es la pantalla anterior al login.
- `worlds.slug` lo mapean `worlds.service.ts` y `world.types.ts`, y **no lo
  consume ninguna pantalla**. Comprobado con `grep`: las cuatro apariciones de
  `slug` en `apps/web/src` son el mapeo y el tipo.

## Goals / Non-Goals

**Goals:**

- Que los tres nombres que la plataforma enseña sean **uno solo por mundo**, y
  que ninguno prometa lo que los cuatro bloques no permiten.
- Que el catálogo de logros quede al día en la **misma migración** que renombra,
  para que no exista un instante en que el catálogo nombre un mundo que ya no se
  llama así.
- Que lo ya concedido **no se toque**.

**Non-Goals:**

- **No se rediseña ningún puzle** ni cambia ningún título de nivel.
- **No se hace dinámica la landing.** Es anterior al login y leer la base desde
  ahí es un cambio de arquitectura que este renombrado no necesita.
- **No se arregla `worlds/worldsData.ts`**, el repliegue de maqueta. Sus tres
  mundos son otros mundos, inventados, y su suerte es la del `ROADMAP.md` §3.3.
- **No se toca el esquema.** Ninguna columna se añade, se quita ni cambia de
  tipo: `database.types.ts` no se regenera.

## Decisions

### Una sola migración, con `update` y no con `on conflict`

La `0012` sembró los mundos con `insert ... on conflict (slug) do update`, que es
repetible. La tentación es reescribirla, y se descarta: **una migración aplicada
no se reescribe**, porque la base remota ya la tiene registrada y el `push` no la
volvería a ejecutar. El renombrado es un `update` en una migración nueva,
`202606030043_rename_worlds.sql`, que localiza cada fila **por su `slug` viejo**.

Alternativa considerada: localizar por `sort_order`. Se descarta porque el
`sort_order` no es único a nivel de tabla por ninguna restricción —lo es de
hecho, no de derecho— y el `slug` sí tiene `unique`.

### El `slug` se renombra con el título

Es el único punto discutible del cambio, porque un `slug` es un identificador y
los identificadores se renombran con cuidado. Se hace porque:

- **No lo consume nada.** Ni una ruta, ni una consulta, ni un test.
- La alternativa —dejar `costa-de-bugs` apuntando a «Encrucijada de las
  Decisiones»— es la clase de renombrado a medias que convierte cualquier
  consulta de depuración en un acertijo, y el proyecto ya pagó una vez por eso
  (`CONTEXT.md` §4.2b: nueve filas sembradas de otro juego).

El `unique` sobre `slug` protege el `update`: si algún día dos filas fueran a
quedar con el mismo, la migración falla en vez de mezclarlas.

### El catálogo se pone al día a mano, y no se re-deriva

Los tres `perfect_world_N` se actualizan con un `update ... where
achievement_key = ...` que escribe el título y la descripción nuevos. **No se
re-deriva el catálogo entero desde `worlds` y `levels`.**

Alternativa considerada: volver a ejecutar la siembra de la `0036` con `on
conflict do update` para que el catálogo se regenere solo desde el contenido. Se
descarta por dos razones:

1. **Los títulos de mundo no son derivables.** «Dueño de la Selva» no sale de
   «Selva Algorítmica» por ninguna regla: se escribió a mano justamente porque
   derivarlo daba «Dueño de Selva Algorítmica», que no se lee. Una re-derivación
   tendría que volver a escribirlos a mano igual.
2. **Los nueve de nivel no cambian**, así que re-derivarlos es trabajo sin efecto
   con riesgo de efecto: un `do update` mal escrito les tocaría el `awarded_xp` o
   el `sort_order`.

### `public.achievements` no se toca, y hay que decirlo en voz alta

Es una decisión, no un olvido: `CONTEXT.md` §2.11 la fijó al copiar título y
descripción en la concesión. Un niño que ganó «Dueño de la Selva» lo sigue
teniendo así. La migración lleva el motivo escrito dentro, porque la siguiente
persona que lea un `achievements` con nombres viejos junto a un catálogo con
nombres nuevos va a pensar que falta un `update`.

### Los tres nombres, y de dónde sale cada uno

| Orden | Título | `region_label` | Qué pide el mundo de verdad |
| --- | --- | --- | --- |
| 1 | Sendero de los Patrones | Algoritmos y patrones | Siempre adelante, Camino con curvas, La escalera: avanzar y girar sobre tablero llano |
| 2 | Cordillera de la Abstracción | Descomposición y abstracción | Salta y sube, El gran rodeo, La torre: alturas, y el camino se arma por tramos |
| 3 | Encrucijada de las Decisiones | Evaluación de problemas | Dos caminos, El faro, Muchos caminos: varias rutas y un tope de pasos que sólo algunas respetan |

Los `region_label` salen de `DISENO-DEL-JUEGO.md` §2, que ya fija un ámbito del
pensamiento computacional por mundo. Sustituyen a «Amazonía», «Región Andina» y
«Caribe» por decisión del usuario del 20-sep-2026, con la contrapartida anotada:
**se pierde la ambientación colombiana de ese rótulo**, que era un valor de la
memoria de grado. Lo que no se pierde es la de los niveles ni la del tema visual.

## Risks / Trade-offs

- **[La landing vuelve a divergir]** → No hay nada en el repositorio que lo
  impida: los nombres están escritos dentro del componente y la base está a una
  migración de distancia. Mitigación real: queda escrito en `CONTEXT.md` §2.6
  que los tres nombres de `WorldsSection.tsx` son copia a mano de `worlds.title`
  y que renombrar un mundo obliga a tocar los dos sitios. Mitigación
  arquitectónica —leer la base desde la landing— se descarta arriba.
- **[Alguien «arregla» los `achievements` viejos]** → El motivo va dentro de la
  migración y en `CONTEXT.md` §2.11, que ya lo decía. Es la segunda vez que se
  escribe a propósito.
- **[Un mundo publicado sin niveles]** → No aplica: los tres tienen sus tres
  niveles publicados, comprobado contra la base.
- **[El `update` no encuentra las filas]** → Un `update` que no toca ninguna fila
  **no falla**, y la migración pasaría en silencio dejando los nombres viejos. Se
  evita comprobando el recuento dentro de la migración y abortando si no son
  exactamente tres mundos y tres logros, que es la única forma de que el error
  aparezca en el `push` y no tres días después en una pantalla.
- **[Se pierde el rótulo de región]** → Asumido por el usuario. La identidad
  colombiana sigue en los niveles y en el tema visual.

## Migration Plan

1. Se escribe `supabase/migrations/202606030043_rename_worlds.sql`.
2. **PARADA: el SQL se lee antes del `db push`** (`ROADMAP.md` §1.3, punto 9).
3. El **usuario** lanza `npx supabase db push`. La salida tiene que aplicar esa
   migración y **ninguna otra**; si arrastra más, hay migraciones sin aplicar y
   eso se mira antes de seguir.
4. Se comprueba contra la base por REST que los tres mundos y los tres logros de
   mundo llevan los nombres nuevos, y que `achievements` conserva los viejos.
5. `gen types` **no hace falta**: ninguna columna cambia.

**Vuelta atrás:** una migración nueva con los `update` inversos. No hay pérdida
de datos que recuperar — el renombrado no borra nada.
