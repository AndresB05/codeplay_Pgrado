## Why

El J6.1 enseñaba, mientras el niño construye, lo que cuesta su programa **contra
el óptimo del nivel**. El usuario lo vio terminado y **lo retira**, el
7-sep-2026. Su motivo, literal:

> el niño se va a matar la cabeza pensando cómo llegar al final con sólo 10
> pasos en vez de llegar al final

Enseñar el número a batir **antes** de haber resuelto nada convierte el nivel en
un problema de optimización cuando todavía es un problema de **llegar**. Es un
juicio de producto, no un fallo de implementación, y manda. Éste es el **J6.2**
de `docs/ROADMAP-JUEGO.md` §3, «Y el coste al construir se retira».

**La pieza se montó separada exactamente para esto**, y hoy se cobra: el
`design.md` del J6.1 §4 dejó escrito qué se borraría, y este cambio es esa lista.

## What Changes

- **Se retira el coste del programa mientras se construye**, y con él el óptimo
  del nivel antes de jugar. Desaparece el requisito entero, no una parte.
- **Se va `programCost`** de `interpreter.ts`, con su bloque de siete tests, y en
  su sitio entra **`hasLooseStacks`**, que responde lo único que queda por
  preguntarle al lienzo: si hay secuencias de sobra. Sin pasos, sin óptimo y sin
  número.
- **Se van de `GameScene.tsx`** el `useMemo` del coste, `canvasCostLine` y
  `visibleCost`. **Se queda el aviso de bloques sueltos en presente**, que vivía
  dentro de esa pieza y sobrevive por decisión del usuario.
- **El contador de la ejecución se queda, y cambia de sitio**: deja el texto de
  la barra y pasa a estar **sobre la propia pantalla del juego, arriba a la
  derecha**, subiendo con cada paso que da el personaje.
- **Y va solo, sin el óptimo al lado.** «7 de 10» mientras corre es la misma
  presión que se acaba de retirar, con otra letra: el contador dice **cuántos
  pasos lleva dados**, y nada más.
- **El contador NO puede vivir dentro del `<Canvas>`**, donde los elementos son
  objetos de `three` y no etiquetas de HTML. Va **superpuesto** sobre el lienzo:
  posición relativa en el contenedor que ya existe, absoluta en el contador. Es
  maquetación, no escena.
- **La barra vuelve a decir «Ejecutando el programa…»** durante el recorrido, que
  es lo que decía antes del J6.1: el número se lo ha llevado la esquina.
- **NO se toca el resultado del J6.** Al terminar se siguen viendo los pasos
  usados contra los de la mejor solución, y su aviso de bloques sueltos en
  pasado. Ahí el número es una lección y no una exigencia, y el usuario no lo ha
  discutido.
- **NO se toca `countSteps`, ni el valor `Attempt`, ni `start()`, ni el `useRef`
  del programa.** Son la otra mitad de la lista del J6.1: lo que se quedaba. Si
  al borrar hiciera falta tocar alguno, la separabilidad no era tal, y eso se
  dice en vez de arreglarse por dentro.
- **NO se toca Supabase**, ni migración, ni `db push`. Esto es fase A.
- **El aviso de sueltos al construir SE CONSERVA**, y eso lo decidió el usuario el
  7-sep-2026 al retirar lo demás: no enseña números, no presiona, y evita que el
  niño crea que su programa está mal cuando lo que pasa es que **no se ejecutó**
  —el fallo en silencio que el J5 dejó anotado y el J6 cerró al terminar—. Vive
  ahora en un **requisito propio**, que es lo que permitió retirar el otro de una
  pieza.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `juego-3d`: cambia una garantía por otra y acota una tercera. Quince pasan a
  **quince**: se retira una y entra una.

  **Se retira «El coste del programa se ve mientras se construye»**, con sus
  siete escenarios. Es el **segundo `REMOVED` de esta capacidad** —el primero
  fueron las órdenes de consola del J5— y, a diferencia de aquél, no se retira
  porque estuviera mal montado: se retira porque **lo que garantizaba ya no se
  quiere**. La garantía duró un día.

  **Y entra «Los bloques sueltos se avisan mientras se construye»**, que es la
  mitad de aquélla que el usuario **sí** quiere: el aviso, solo y sin ninguna
  cifra. Va en un requisito propio y no pegado a otro, por lo mismo que permitió
  retirar el anterior de un tirón — una garantía, un requisito.

  **Y se modifica «El paso en curso se ve mientras se ejecuta»**, en dos cosas
  que el usuario pidió a la vez:

  - **deja de decir de cuántos pasos consta el recorrido**, y con eso deja de
    anunciar por adelantado el número que hay que batir;
  - **se ve sobre la propia pantalla del juego**, no en el texto que acompaña a
    los botones.

  Lo que **no** cambia de ese requisito es lo que lo sostiene: sale del programa
  que se está ejecutando y **no** de lo que haya en el lienzo, así que tocar los
  bloques con el recorrido en marcha sigue sin moverlo. Y **conserva sus seis
  escenarios**, con el del total reescrito para hablar del número **al que el
  contador llega** en vez del que anunciaba: la igualdad con el recuento del
  resultado sigue en pie, que es lo que ata este número al que puntúa el
  servidor. Se le añade uno más, el que comprueba que el contador **no** dice lo
  que falta.

## Impact

**Dependencias: ninguna.** No se instala ni se desinstala nada.

**Supabase: ninguna dependencia y NO hay `db push`.** No hay migración, no se
toca el esquema y no se lee ni se escribe nada de la base, así que **no hay
ninguna parada** de las de `ROADMAP.md` §1.3 punto 9.

**Código** — tres archivos, los mismos tres que tocó el J6.1

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/interpreter.ts` | Se va `programCost` y entra `hasLooseStacks`, que devuelve un booleano y no un recuento |
| `apps/web/src/game/interpreter.test.ts` | Se va el bloque `programCost` —**siete tests**— y entra el de `hasLooseStacks` |
| `apps/web/src/game/GameScene.tsx` | Se va el coste del lienzo; se queda el aviso de sueltos; el contador de la ejecución deja la barra y pasa a un elemento superpuesto sobre el lienzo, sin total |

**`StudentGameLabModule.tsx` no se toca**, por tercera vez: el contador es del
juego y vive bajo la frontera diferida, para que la pantalla del J8 lo herede.

**Bundle.** La línea de partida, **medida** sobre `866a114`: principal
**625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor` **644,43**
(172,75), `GameScene` **830,87** (224,43), **221 módulos**. Aquí `GameScene`
**debería bajar**: se borra más de lo que entra. El principal no puede subir.

**Tests.** Se van los siete de `programCost` y entran los de `hasLooseStacks`.
Lo que **no** se puede probar sigue sin probarse y se dice: el contador sobre el
lienzo es un elemento de la escena, y jsdom no implementa WebGL — el mismo motivo
por el que el J6 y el J6.1 no probaron `GameScene`. Por eso lo que decide el
aviso vive **fuera** del componente, donde sí se puede probar.

**Documentación**

- `docs/ROADMAP-JUEGO.md` §3: el J6.2 pasa a ✅.
- `docs/CONTEXT.md` §2.9: qué se retiró y por qué —con el motivo del usuario—,
  que la separabilidad del J6.1 se cobró y si aguantó, y dónde vive ahora el
  contador. El bloque del J6.1 no se borra: **se corrige lo que dejó de ser
  cierto**, porque es el registro de lo que pasó.
- `docs/CONTEXT.md` §4.8: las medidas nuevas.
- `docs/CONTRATO-DE-INTEGRACION.md` §4.2: la frase que el J6.1 corrigió —«desde
  el J6.1 lo ve antes de ejecutar»— **vuelve a ser falsa**. `optimalSteps` se ve
  otra vez sólo al terminar.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: cuenta **quince** garantías
  y describe el coste al construir en dos sitios. **Ningún delta transporta el
  Purpose**: se reescribe a mano **al archivar**.
- `openspec/config.yaml`: sólo si el stack o las convenciones cambian —no cambian—.
  Se comprueba con `npx openspec doctor`.
