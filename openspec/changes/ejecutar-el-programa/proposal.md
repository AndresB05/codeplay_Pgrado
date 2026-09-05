## Why

El J4 dejó un editor que produce el programa en JSON y una escena que no lo lee:
`StudentGameLabModule.tsx` lo dice en pantalla —«Todavía no se ejecutan»— y las
órdenes se siguen dando de una en una desde la consola. Éste es el **J5** de
`docs/ROADMAP-JUEGO.md` §3, y su criterio es el que convierte las cuatro piezas
en un juego: **un nivel se resuelve de principio a fin, sin backend**.

Y arrastra una decisión que **no está tomada en ninguna parte**: el contrato
define `success` como «si el niño resolvió el nivel» y no dice qué pasa si el
programa **pisa la meta y se va**. Lo decide este paso, porque es el primero que
tiene que responderlo, y se escribe en el contrato: por §5, `success` es «el
único dato que la plataforma se cree sin poder comprobarlo».

## What Changes

- **Entra el intérprete**, `apps/web/src/game/interpreter.ts`, **puro**: recorre
  el JSON del programa y pliega las órdenes sobre la pose inicial con `turn` y
  `advance`, que el J2 escribió para esto. **No importa Blockly ni `three`**, y
  por eso se puede probar —igual que `movement.ts` fue el primer módulo del juego
  con tests—.
- **Sabe lo que hay dentro del sobre, y `program.ts` sigue sin saberlo.** Ese
  módulo se niega a propósito a conocer la forma que serializa el editor
  —«conocerla sería escribir aquí una segunda copia del formato»—; el intérprete
  sí la conoce, porque recorrerla es su trabajo. Son dos módulos y la frontera
  entre ellos queda escrita: uno abre el sobre, el otro lee la carta.
- **Chocar NO detiene el programa.** El contrato §4.4 cuenta los **pasos
  ordenados, no los ejecutados**: `avanzar 4` contra un muro a dos casillas suma
  cuatro. Un intérprete que se pare al chocar hace que el recuento del J6 y el
  del servidor dejen de poder coincidir con lo que se vio en pantalla. El
  `blockedBy` de `advance` se usa para **enseñar el choque**, no para abortar.
- **Se decide y se escribe qué pasa al pisar la meta y seguir: cuenta.** El
  nivel se resuelve si el personaje pisa la meta **en algún momento** de la
  ejecución, no sólo si acaba encima. Es la misma regla que ya rige el choque:
  pasarse de largo es **ineficiencia**, y la ineficiencia se paga en la
  puntuación —el recorrido de más son pasos de más—, no invalidando lo que sí se
  consiguió. Va a `CONTRATO-DE-INTEGRACION.md` §4.4.
- **Se decide y se escribe qué se ejecuta cuando hay varios montones sueltos**,
  que §4.3 dejó explícitamente «al paso que ejecute»: se ejecuta **el montón cuyo
  bloque raíz esté más arriba en el lienzo** —y más a la izquierda a igualdad de
  altura—, y los demás se ignoran. Es la única regla de las candidatas que el
  niño puede ver: el orden del array serializado es de construcción, no de
  pantalla.
- **El personaje se anima casilla a casilla y giro a giro**, con el programa
  ejecutándose a un paso por vez para que se vea el recorrido. Un avance
  bloqueado se ve como un **topetazo** contra lo que estorba, y el programa
  continúa.
- **NO entra `@react-spring/three`.** El roadmap la asigna a este paso, pero
  `useFrame` de fiber interpola entre dos casillas sin traer nada nuevo, y
  `DISENO-DEL-JUEGO.md` §5 avisa de que **una dependencia que nadie importa es
  peso sin evidencia**. Lo que este paso necesita —posición entre dos casillas,
  giro por el lado corto y un topetazo— son tres interpolaciones sobre el mismo
  reloj que ya gobierna el bucle de la ejecución. El personaje sigue siendo un
  cubo de relleno; los 25 clips del modelo con esqueleto son del **J7.4**, y ahí
  se decide con el modelo delante. El detalle está en `design.md`.
- **Se retira el requisito de las órdenes sueltas**, y con él
  `window.codeplayGame`. Empieza diciendo «Mientras el programa de bloques no
  exista»: existe desde el J4 y desde este paso además se ejecuta, así que su
  premisa se cumplió del todo. **Es el primer `REMOVED` del proyecto**, y el
  punto 8 de `ROADMAP.md` §1.3 aplica al archivarlo. No es sólo higiene del
  spec: la consola y la ejecución escriben la misma pose, así que dejarlas
  juntas es dejar dos dueños de un mismo estado.
- **El banco de pruebas gana los dos botones que sustituyen a la consola**,
  «Ejecutar» y «Reiniciar», y **viven dentro del juego**, bajo la frontera
  diferida, no en la pantalla que lo aloja: el J8 monta la pantalla de nivel
  real y tiene que heredarlos.
- **NO se cuentan pasos ni se pinta resultado.** Es el **J6**. El intérprete
  produce el recorrido y dice si se llegó; cuántos pasos se usaron y cómo queda
  contra `optimalSteps` no se enseña.
- **NO entra `repetir N veces`.** No hace falta para ejecutar, y arrastra el
  anidamiento que §4.3 dejó sin registrar.
- **NO se toca Supabase**, ni migración, ni se cablea `config` desde la base
  —eso es el J8—. **Ni modelos `.glb`**: cubos, que es el J7.4.

## Capabilities

### New Capabilities

Ninguna. `juego-3d` ya existe y es donde esto vive.

### Modified Capabilities

- `juego-3d`: gana **la ejecución del programa**. Hasta hoy la capacidad
  garantizaba dónde y cómo se dibuja el juego, qué se dibuja, cómo se mueve el
  personaje y que el programa se pueda escribir y leer como JSON — pero el
  programa **no movía a nadie**. Se le añaden dos garantías: que **el programa
  de bloques mueve al personaje**, viéndose paso a paso y sin que un choque
  interrumpa lo que queda por ejecutar, y que **el juego sabe si el programa
  llegó a la meta**. Y **pierde una**: las órdenes sueltas en desarrollo, cuya
  condición de existencia —«mientras el programa de bloques no exista»— deja de
  cumplirse con este mismo cambio. Diez garantías pasan a **once**.

## Impact

**Dependencias: ninguna.** No se instala nada, así que el lockfile no se toca y
los ocho binarios de plataforma de `@supabase/cli` no corren peligro. Se
comprueba igualmente que `three` sigue en **una sola copia 0.170.0** —el chequeo
que el J2 dejó escrito para quien añadiera una librería del ecosistema 3D y que
**nunca se ha ejecutado**, porque `drei` no llegó a entrar—.

**Código** — todo bajo `apps/web/src/game/`, salvo la última fila

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/interpreter.ts` | **Nuevo. Puro.** Lee las órdenes del interior del sobre y las pliega sobre la pose inicial con `turn` y `advance`. Devuelve el recorrido y si se llegó a la meta. Sin Blockly, sin `three` y sin JSX |
| `apps/web/src/game/interpreter.test.ts` | **Nuevo.** El recorrido y la meta contra tableros escritos en el propio test, con el JSON del contrato §4.3 como entrada |
| `apps/web/src/game/GameScene.tsx` | Recibe el programa, lo ejecuta al pulsar «Ejecutar», anima el recorrido paso a paso y **pierde `window.codeplayGame`** |
| `apps/web/src/game/GameSceneLoader.tsx` | Pasa a recibir el programa como propiedad. Sigue **sin importar `three`**: el tipo del sobre no lo arrastra, igual que en `BlockEditorLoader.tsx` |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | Baja el programa que ya tiene en estado hasta la escena, y **quita la tarjeta de las órdenes de consola**, que dejan de existir |

**La frontera no se mueve, y es la parte delicada del cableado.** El programa
viaja **hacia abajo como dato** desde la pantalla que ya lo tiene en estado; lo
que **no** sube es el intérprete, que se importa desde `GameScene.tsx` —bajo la
frontera— y no desde el laboratorio. Subirlo lo metería en el trozo principal y
con él el recorrido que el J6 va a extender. Es la misma regla que ya sostiene
`movement.ts`.

**Bundle.** La línea de partida, medida sobre `b602ff2`: trozo principal
**624,78 kB** (167,77 gzip), `BlockEditor` **644,50** (172,77), `GameScene`
**825,21** (222,25), **219 módulos**. El principal **no debe subir** —y puede
bajar, porque la tarjeta de las órdenes de consola desaparece—; lo que crezca
tiene que salir en el trozo de la escena.

**Tests.** Los **134** de 18 archivos siguen pasando sin tocarlos, y se suma un
archivo nuevo. Se lanzan con `npm run test:run`: `npx vitest run` desde la raíz
se salta la configuración del workspace y da decenas de fallos falsos.

**Dependencia de Supabase: ninguna, y no hay `db push`.** No hay migración y no
se toca el esquema. `ROADMAP-JUEGO.md` §1 lo dice de toda la fase A: no toca
Supabase ni una vez, y es deliberado.

**Documentación**

- `docs/CONTRATO-DE-INTEGRACION.md` §4.4: qué pasa al pisar la meta y seguir, que
  hoy no está decidido en ninguna parte.
- `docs/CONTRATO-DE-INTEGRACION.md` §4.3: qué se ejecuta cuando el lienzo tiene
  varios montones, que ese apartado deja explícitamente al paso que ejecute.
- `docs/ROADMAP-JUEGO.md` §3: el J5 pasa a ✅.
- `docs/CONTEXT.md` §2.9: el archivo nuevo, la ejecución, la retirada de las
  órdenes de consola —el párrafo que las documenta deja de ser cierto— y qué
  quedó verificado en el navegador **con la ventana delante**, porque §2.9 ya
  avisa de que una ventana oculta suspende los frames sin que la página pueda
  enterarse.
- `docs/CONTEXT.md` §4.8: las medidas nuevas.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: dice «Ya se puede escribir
  un programa, pero todavía no ejecutarlo» y cuenta **diez** garantías. Las dos
  cosas dejan de ser ciertas, y **ningún delta transporta el Purpose**: se
  reescribe a mano **al archivar**.
- `openspec/config.yaml`: sólo si el bloque de convenciones o el de estructura
  cambian. Se comprueba con `npx openspec doctor`.
