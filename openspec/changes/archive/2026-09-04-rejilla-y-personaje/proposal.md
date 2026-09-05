## Why

El J1 dejó una escena con un cubo y nada más: `docs/CONTEXT.md` §2.9 lo dice tal
cual —«sin rejilla, sin personaje, sin bloques y sin backend»—. Éste es el
**J2** de `docs/ROADMAP-JUEGO.md` §3, y lo que tiene que conseguir es que **se
vea el tablero y el personaje se mueva**, montado todo desde un objeto de
configuración escrito a mano en el código.

Y arrastra una decisión que sólo se puede tomar aquí: **dónde viven las reglas de
movimiento**. El J5 las reutiliza para el intérprete, así que si nacen enredadas
con el pintado de la escena, el J5 las reescribe. Nacen en un módulo puro —sin
`three` y sin JSX—, que además trae **los primeros tests del juego**: jsdom no
implementa WebGL y por eso el J1 no pudo llevar ninguno, pero un módulo puro sí
se prueba.

## What Changes

- **Un objeto de configuración escrito a mano**, provisional y a propósito: una
  rejilla de 5×5 con salida en una esquina, meta en otra, **al menos un muro y al
  menos un hueco**. Sin ese par, las reglas de movimiento nacen sin nada que las
  ejercite. **No es un puzle diseñado** y no pretende serlo:
  `ROADMAP-JUEGO.md` §3 reserva el diseño de los nueve puzles al usuario y lo
  sitúa en el J6; depurar el pintado contra un puzle que además importa es
  depurar dos cosas a la vez.
- **Las reglas de movimiento, en un módulo puro sin `three` ni JSX.** Dada una
  configuración, una casilla y una orientación: qué produce avanzar y qué produce
  girar, incluido contra un muro, contra un hueco y contra el borde. Con su test
  al lado, siguiendo el idiom de `context/invitationToken.helpers.ts`.
- **La escena pasa de un cubo a un tablero**: pinta las casillas de la
  configuración, distingue muro de hueco, marca salida y meta, y coloca al
  personaje. **El paso de la rejilla es la constante 1,0**, nunca deducido del
  tamaño de ningún modelo (`ROADMAP-JUEGO.md` §3).
- **El personaje se mueve llamando funciones desde la consola**, que es
  literalmente el criterio de la fila J2 del roadmap. En desarrollo y sólo en
  desarrollo.
- **NO entra `drei`.** El roadmap lo admite fijado a `^9.122` si `OrbitControls`
  hace falta de verdad, y no hace falta: una cámara fija mirando un tablero de
  5×5 lo enseña entero. Cada dependencia que no se importa es peso sin evidencia
  (`DISENO-DEL-JUEGO.md` §5), y `drei` trae `three` en sus `peerDependencies`,
  con la trampa de la copia doble que §2.9 documenta.
- **NO se fija el formato definitivo de `config`.** Es el J3, y el roadmap dice
  que el del J2 es provisional.
- **NO se detecta la llegada a la meta ni se anima nada.** Es el J5.
- **NO se carga ningún `.glb`** de `apps/web/public/models/`: la fase A se hace
  entera con cubos de colores.

## Capabilities

### New Capabilities

Ninguna. `juego-3d` ya existe y es donde esto vive.

### Modified Capabilities

- `juego-3d`: gana las dos primeras reglas de juego. Hasta hoy la capacidad sólo
  garantizaba **dónde y cómo** se dibuja —dentro de la aplicación, en diferido, y
  con un banco de pruebas que no llega a producción—. Se le añaden **qué se
  dibuja** (un tablero descrito por una configuración, con casillas
  intransitables de dos clases) y **cómo se mueve el personaje** (por casillas,
  girando en el sitio, sin atravesar muros, huecos ni el borde). Ningún requisito
  existente se modifica ni se retira.

## Impact

**Dependencias: ninguna.** No se instala nada. Es deliberado y está justificado
arriba.

**Código** — todo bajo `apps/web/src/game/`, que es donde vive el juego
(`DISENO-DEL-JUEGO.md` §6)

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/level.ts` | **Nuevo.** Los tipos del tablero y la constante del paso de rejilla. Sin `three`, sin JSX |
| `apps/web/src/game/debugLevel.ts` | **Nuevo.** El objeto de configuración escrito a mano: 5×5, un muro, un hueco, salida y meta |
| `apps/web/src/game/movement.ts` | **Nuevo.** Las reglas puras: avanzar y girar. **Es lo que el J5 reutiliza** |
| `apps/web/src/game/movement.test.ts` | **Nuevo.** Los primeros tests del juego, al lado del archivo que prueban |
| `apps/web/src/game/GameScene.tsx` | Deja de pintar un cubo suelto y pinta el tablero y el personaje leyendo la configuración. Sigue siendo el lado perezoso |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | El texto de la pantalla, que hoy anuncia «Un cubo, y nada más», y cómo se maneja al personaje desde la consola |

**La frontera del bundle no se mueve, y hay que cuidarla al escribir los
imports.** `GameSceneLoader.tsx` sigue sin importar `three`, y los módulos puros
—que no lo arrastran— se consumen **sólo desde el lado perezoso**: importarlos
desde encima de la frontera los metería en el trozo principal.

**Bundle.** La línea de partida, medida hoy sobre `0cd05a9`: trozo principal
**624,57 kB** (167,68 gzip), trozo `GameScene` **823,50 kB** (221,63), **206
módulos**. Después del cambio el principal **no debe subir** y lo que crezca
tiene que salir en el trozo aparte.

**Tests.** Los 109 tests de 15 archivos siguen pasando **sin tocarlos**, y se
suma un archivo nuevo. **Ninguno monta `<Canvas>`**: jsdom no tiene WebGL, así
que un test así probaría el simulacro y no la escena.

**Dependencia de Supabase: ninguna, y no hay `db push`.** No hay migración y no
se toca el esquema. `ROADMAP-JUEGO.md` §1 lo dice de toda la fase A: no toca
Supabase ni una vez, y es deliberado.

**Documentación**

- `docs/ROADMAP-JUEGO.md` §3: el J2 pasa a ✅.
- `docs/CONTEXT.md` §2.9: pasa a describir el J1 **y** el J2, con las rutas
  reales.
- `docs/CONTEXT.md` §2.9 y `openspec/config.yaml` (bloque STACK): la frase
  «`GameScene.tsx` es el único módulo que importa `three`» **deja de ser cierta**
  con este cambio. Se reescribe en los dos sitios por la que sí se sostiene y era
  la que importaba: **nada por encima de la frontera diferida lo importa**.
- `docs/CONTEXT.md` §4.8: sigue titulando «Bundle de 623 kB» y describiendo un
  solo chunk de 177 módulos como línea de partida del juego. Eso es de **antes**
  del J1 y se corrige aquí.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: dice «Hoy no hay nada
  jugable» y describe el esqueleto. Con rejilla y personaje deja de ser cierto, y
  **ningún delta transporta el Purpose** (`ROADMAP.md` §1.3 punto 6): se abre y
  se reescribe a mano **al archivar**.
