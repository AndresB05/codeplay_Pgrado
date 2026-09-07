## Why

El J6 enseña el recuento **al terminar**, y su `design.md` puso «ningún recuento
en vivo» entre los **Non-Goals** con un argumento propio —«el criterio del
roadmap es al terminar»— **sin consultárselo al usuario**. Al ver el paso
terminado lo pidió: el niño tiene que ver lo que cuesta su programa **sin contar
los pasos a ojo**, y esperar a que termine la animación para saber el número no
es directo. Éste es el **J6.1** de `docs/ROADMAP-JUEGO.md` §3, decidido el
7-sep-2026 y escrito ahí en «El recuento se ve mientras se juega, no sólo al
final».

Son **dos piezas, y las dos están pedidas**: lo que cuesta el programa
**mientras se construye**, y por qué paso va el recorrido **mientras se
ejecuta**.

## What Changes

- **Entra el coste del lienzo mientras se construye.** La barra enseña lo que
  cuesta el programa que hay puesto, contra `optimalSteps`, y cambia al arrastrar
  un bloque. Sale de `countSteps`, que **ya existe y no ejecuta nada**: es la
  lección de eficiencia sin tener que ejecutar.
- **Entra el paso en curso mientras se ejecuta.** Donde hoy pone «Ejecutando el
  programa…» pasa a poner por qué paso va el recorrido, subiendo con el
  personaje.
- **Y son DOS NÚMEROS DE DOS FUENTES DISTINTAS, que no se mezclan nunca.** El del
  lienzo sale de la **prop `program` en el render**; el de la ejecución sale del
  **intento congelado** —`attempt.steps` y el `index` que la escena ya lleva—,
  **jamás de la prop**. Si el segundo saliera de la prop, mover un bloque a mitad
  de recorrido cambiaría el contador que el niño está viendo correr, que es el
  fallo exacto que el J5 evitó sacando el programa del estado de React.
- **Las dos piezas se montan independientes, y eso es requisito del usuario.**
  Enseñar el coste **antes** de ejecutar es una elección pedagógica y **puede
  cambiar si la profesora lo dicta**; en ese caso se queda sólo el contador de la
  ejecución. Quitar la de construcción tiene que ser **borrar una pieza**, no
  rehacer la barra. Lo único que comparten es `countSteps`.
- **Entra `programCost(program)`, pura, en `interpreter.ts`**: del sobre al
  número, o `null` cuando no hay nada que enseñar. Los cuatro casos que muerden
  —sin programa, ilegible, lienzo vacío y montones sueltos— quedan **dentro de
  una función que sí se puede probar**, en vez de repartidos por un componente
  que no.
- **El coste del lienzo se recalcula con `useMemo` sobre `program`**, no en cada
  render suelto: `openProgram` + `readProgram` + `countSteps` corren con cada
  cambio del editor, y son baratos, pero no hay motivo para repetirlos cuando lo
  que cambió es el índice del paso.
- **Mientras se ejecuta, el coste del lienzo NO se pinta.** Durante el recorrido
  el niño no construye, y un número del lienzo que puede cambiar bajo una
  ejecución que no gobierna es un número que se contradice a sí mismo en
  pantalla. Es una condición **dentro** de la pieza que se borraría con ella.
- **El lienzo vacío y el ilegible no pintan «0 pasos»**, igual que el J6 decidió
  para el resultado: cero contra los del nivel le diría al niño que su programa
  es malo cuando lo que pasa es que no hay programa.
- **Con montones sueltos, el número que se enseña es el del montón que se
  ejecutaría**, no la suma, y **se dice ahí mismo y en presente**. Sin decirlo, el
  coste en vivo **reabre mientras se construye** el fallo silencioso que el J6
  cerró al terminar: el niño ve un número que no es el de lo que tiene delante.
- **NO se toca la maquetación** del laboratorio: el editor al lado del juego es
  del **J8** (`ROADMAP-JUEGO.md` §3).
- **NO se toca Supabase**, ni migración, ni `db push`. Esto es fase A.
- **NO se calcula puntuación, ni XP, ni estrellas.** Eso es el **J10**.
- **NO entra la tercera combinación** —coste al construir sin contador durante la
  ejecución—: **el usuario la descartó** por poco práctica, y no se recupera sin
  volver a preguntárselo.
- **NO se toca `runProgram`, ni `readProgram`, ni el valor `Attempt`.** Este paso
  no cambia lo que se ejecuta ni lo que se dice al terminar: sólo añade lo que se
  ve mientras tanto.

## Capabilities

### New Capabilities

Ninguna. `juego-3d` ya existe y es donde esto vive.

### Modified Capabilities

- `juego-3d`: gana **el contador en vivo**, en **dos requisitos separados y no
  uno**, y esa separación es la que hace cumplir el requisito del usuario:
  retirar la pieza de construcción es borrar **un requisito entero**, no
  reescribir uno que hable de las dos. Trece garantías pasan a **quince**. No se
  retira ninguna.

  - **«El coste del programa se ve mientras se construye»**: lo que cuesta el
    lienzo contra lo que cuesta la mejor solución, actualizándose al arrastrar,
    sin ejecutar nada, y callado cuando no hay programa que contar.
  - **«El paso en curso se ve mientras se ejecuta»**: por dónde va el recorrido,
    sacado del intento que se está ejecutando y **no** de lo que haya en el
    lienzo en ese momento.

  **Y una se modifica**: «Al terminar se ve lo que costó y lo que costaba lo
  bueno» dice hoy que mientras la ejecución está en curso «no se muestra ningún
  resultado ni recuento **final**». Esa palabra ya deja sitio al contador en
  vivo, pero deja al lector la tarea de notarla, y con el requisito nuevo al lado
  el spec principal parecería decir una cosa y la contraria. Se acota a lo que de
  verdad prohíbe —el **resultado**— y se dice qué sí se ve.

## Impact

**Dependencias: ninguna.** No se instala nada, así que el lockfile no se toca y
los binarios de plataforma de `@supabase/cli` no corren peligro.

**Supabase: ninguna dependencia y NO hay `db push`.** No hay migración, no se
toca el esquema y no se lee ni se escribe nada de la base. El proyecto sigue
enlazado y con el esquema aplicado; este cambio no le pide nada, así que **no hay
ninguna parada** de las de `ROADMAP.md` §1.3 punto 9.

**Código** — tres archivos, todos bajo `apps/web/src/game/`

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/interpreter.ts` | Entra `programCost(program)`, pura: abre el sobre, lee el programa y devuelve `{ steps, rootCount }`, o `null` cuando no hay nada que enseñar. Pasa a importar el **valor** `openProgram` de `program.ts`, del que hoy sólo importa un tipo. Sigue **sin importar Blockly, `three` ni JSX** |
| `apps/web/src/game/interpreter.test.ts` | Los cuatro casos que muerden, contra el PROGRAMA A del contrato §4.3: sin programa, versión de formato desconocida, lienzo vacío, un montón y dos montones. Y el test de que **las dos cadenas dan lo mismo** —la de `programCost` y la que `start()` recorre a mano—, que hoy no puede fallar y se rompe el día que alguien toque una sin la otra |
| `apps/web/src/game/GameScene.tsx` | El coste del lienzo en la barra, con `useMemo` sobre `program`; el paso en curso donde hoy va «Ejecutando el programa…» |

**`StudentGameLabModule.tsx` no se toca**, y es la misma comprobación que en el
J6: el contador vive dentro del juego, bajo la frontera diferida, porque la
pantalla de nivel del J8 tiene que heredarlo en vez de reescribirlo.

**Bundle.** La línea de partida, **medida** sobre `e3daa4d` antes de tocar nada:
principal **625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor`
**644,43** (172,75), `GameScene` **830,27** (224,28), **221 módulos**. El
principal **no debe subir**; lo que crezca sale en el trozo de la escena. El
punto a vigilar es la importación nueva `interpreter.ts` → `program.ts`: hoy es
sólo de tipo, y pasa a ser de valor.

**Tests.** Los **156** de 19 archivos siguen pasando —comprobado sobre `e3daa4d`
antes de escribir esto—, y `interpreter.test.ts` suma los de `programCost`. Se
lanzan con `npm run test:run` **desde la raíz**: `npx vitest run` se salta la
configuración del workspace y da decenas de fallos falsos.

**Lo que NO se puede probar con tests, y se dice en vez de inventar uno.** Las
dos piezas nuevas son de componente, y jsdom no implementa WebGL: un test que
monte `<Canvas>` prueba el simulacro, no la escena. Es el motivo por el que el J6
no añadió tests de `GameScene`, y sigue valiendo. Por eso los cuatro casos que
muerden se sacan a `programCost`, que **sí** se prueba; lo que queda sin test es
que la barra los pinte, y eso se verifica en el navegador.

**Documentación**

- `docs/ROADMAP-JUEGO.md` §3: el J6.1 pasa a ✅.
- `docs/CONTRATO-DE-INTEGRACION.md` §4.2: la frase «el niño lo ve en pantalla **al
  terminar**» deja de ser cierta —`optimalSteps` pasa a verse **antes** de
  ejecutar—. El argumento del apartado no cambia y es el que autoriza esto: **un
  número no es una solución**; decir que la mejor ruta son diez pasos no dice
  cuáles son. Se corrige el cuándo, no el porqué.
- `docs/CONTEXT.md` §2.9: las dos piezas, las dos fuentes que no se mezclan, por
  qué la de construcción es retirable, `programCost` y qué quedó verificado en el
  navegador.
- `docs/CONTEXT.md` §4.8: las medidas nuevas, si alguna cambia.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: cuenta **trece** garantías y
  dice que el recuento se ve «al terminar». Las dos cosas dejan de ser ciertas, y
  **ningún delta transporta el Purpose**: se reescribe a mano **al archivar**.
- `openspec/config.yaml`: sólo si el bloque de stack o el de convenciones cambian
  —no entra ninguna dependencia, así que probablemente no—. Se comprueba con
  `npx openspec doctor`.
