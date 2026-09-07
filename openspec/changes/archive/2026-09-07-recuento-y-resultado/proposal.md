## Why

El J5 dejó al personaje recorriendo el tablero y una barra que sólo dice
«¡Llegaste a la meta!» o «No llegaste». Falta lo que el juego **puntúa**: los
pasos. Éste es el **J6** de `docs/ROADMAP-JUEGO.md` §3 y su criterio es «al
terminar dice cuántos pasos usó y cuántos eran óptimos», que es el primer momento
en que el niño ve la magnitud que `DISENO-DEL-JUEGO.md` §3 convierte en XP.

Y destapa **tres agujeros que hoy existen y no se ven** porque no hay recuento
delante: un lienzo vacío se pinta como intento fallido, un bloque suelto arriba
secuestra la ejecución sin que nadie lo diga, y el número de montones —que
`readProgram` **tiene y tira**— es justo lo que haría falta para decirlo. Los dos
primeros los dejó anotados el J5 en `docs/CONTEXT.md` §2.9.

## What Changes

- **Entra `countSteps(orders)`, pura, en `interpreter.ts`**: recorre las órdenes
  y suma —`avanzar N` son N, `girar` es 1— **sin tablero y sin ejecutar nada**.
  Es la tabla del contrato §4.4 escrita en código.
- **Y entra el test que impide que el cliente y el servidor dejen de contar
  igual**: `countSteps(orders)` y `runProgram(...).steps.length` dan lo mismo
  sobre el PROGRAMA A del contrato y sobre un programa que choca. Hoy coinciden
  **por construcción** —una entrada por paso ordenado—, y ése es exactamente el
  motivo de fijarlo: se rompería solo el día que alguien haga que chocar detenga
  el programa, y sin este test el síntoma sería un número distinto en la pantalla
  del niño y en la puntuación del servidor, meses después, en el J10.
- **El número que se enseña sale de `countSteps`, no de la ejecución.** Es el
  mismo número, y sale de ahí a propósito: es el que el servidor calculará
  leyendo el programa, así que la pantalla enseña la misma cuenta que puntúa y no
  una paralela que se le parece.
- **`readProgram` deja de tirar el número de montones**: pasa a devolver
  `{ orders, rootCount }` en vez de `Order[]`. La información **ya está** en
  `readRoots`, y `firstOnCanvas` la descarta al elegir uno; sin sacarla de ahí no
  hay forma de avisar desde la escena. Se adaptan los seis tests de `readProgram`.
- **La barra del J5 pasa a ser la pantalla de resultado**, en el mismo sitio:
  dentro de `GameScene.tsx`, debajo del `<Canvas>` y fuera de él. Al terminar
  dice **cuántos pasos costó y cuántos eran los buenos**, y dice cuándo el
  recorrido fue **perfecto** —llegó y no gastó más de `optimalSteps`—, que es el
  vocabulario del propio contrato §4.4.
- **Un lienzo vacío deja de contarse como intento fallido.** Hoy `readProgram({})`
  da cero órdenes, `runProgram` da cero pasos y la barra pinta «No llegaste a la
  meta»; con el recuento delante pintaría «0 de 10», que le dice a un niño que su
  programa fue malo cuando lo que pasó es que **no había programa**. Se separan
  los dos casos. El mismo camino se recorre cuando el editor todavía no se ha
  montado, y se arregla con él.
- **Se avisa de los bloques sueltos**, que es el encargo que el J5 dejó escrito
  en `CONTEXT.md` §2.9: la regla del montón de más arriba **falla en silencio**,
  y un bloque olvidado encima hace que el niño no pueda distinguir «mi programa
  está mal» de «mi programa no se ejecutó». El aviso **acompaña** al resultado,
  no lo sustituye: el montón de arriba sí se ejecutó.
- **NO se toca Supabase**, ni migración, ni `db push`. La fase A no lo toca ni
  una vez, y esto es fase A.
- **NO se diseña ningún puzle.** Se construye contra `debugLevel` y su
  `optimalSteps` de 10, que es el ejemplo resuelto del contrato §4.4 y trae de
  regalo dos programas contados a mano. El primer diseño de verdad es del
  **J7.1**, corregido por el usuario el 5-sep-2026 en `ROADMAP-JUEGO.md` §3.
- **NO se calcula puntuación, ni porcentaje, ni XP, ni estrellas.** Quien puntúa
  es el servidor contando el programa (`DISENO-DEL-JUEGO.md` §3), y eso es el
  **J10**. Aquí se enseñan dos números y su comparación, nada más.
- **NO se mueve la maquetación** del laboratorio: el editor al lado del juego es
  del **J8**, escrito en `ROADMAP-JUEGO.md` §3.
- **NO se acota el `STEPS` que acepta `readOrder`**, que es el otro encargo de
  §2.9 y es del **J8**: mientras el único productor sea nuestro editor no hay
  caso.
- **NO entra `repetir N veces`**, aunque la tabla de §4.4 lo cuente: no existe el
  bloque, y su fila del recuento se escribiría sin nada que la ejercite.

## Capabilities

### New Capabilities

Ninguna. `juego-3d` ya existe y es donde esto vive.

### Modified Capabilities

- `juego-3d`: gana **el recuento y el resultado**. Hasta hoy la capacidad
  garantizaba que el programa mueve al personaje y que el juego sabe si se llegó
  a la meta, pero **no cuántos pasos costó**, que es lo único que el juego
  puntúa. Se le añaden dos garantías: que **los pasos se cuentan leyendo el
  programa**, con las reglas del contrato y sin ejecutarlo, y que **al terminar
  se ve lo que costó y lo que costaba lo bueno**, con el lienzo vacío distinguido
  del intento fallido y con los bloques sueltos avisados. Once garantías pasan a
  **trece**. No se retira ninguna.

  **Y una se modifica**, que no se ve venir sola: «El juego sabe si el programa
  llegó a la meta» trae el escenario «el programa no pasa por la meta → se indica
  que no se llegó», y **el lienzo vacío cae dentro** —es el agujero (b) que este
  paso cierra—. Sin modificarla, el spec principal acabaría exigiendo y
  prohibiendo lo mismo para el mismo caso. Se acota a cuando hay órdenes que
  ejecutar, y se le añade la distinción que hoy falta entre las dos magnitudes:
  **la llegada se calcula ejecutando, el recuento se calcula leyendo**, y ninguna
  se calcula como la otra.

## Impact

**Dependencias: ninguna.** No se instala nada, así que el lockfile no se toca y
los binarios de plataforma de `@supabase/cli` no corren peligro. Se comprueba
igualmente `npm ls three`: una sola copia, 0.170.0.

**Supabase: ninguna dependencia y NO hay `db push`.** No hay migración, no se
toca el esquema y no se lee ni se escribe nada de la base. El proyecto sigue
enlazado y con el esquema aplicado; este cambio no le pide nada, así que no hay
ninguna parada de las de `ROADMAP.md` §1.3 punto 9.

**Código** — tres archivos, todos bajo `apps/web/src/game/`

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/interpreter.ts` | Entra `countSteps(orders)`, pura. `readProgram` pasa a devolver `{ orders, rootCount }`. Sigue **sin importar Blockly, `three` ni JSX** |
| `apps/web/src/game/interpreter.test.ts` | El recuento contra el ejemplo resuelto de §4.4, la igualdad con la ejecución y el número de montones. Se adaptan los seis tests de `readProgram` al retorno nuevo |
| `apps/web/src/game/GameScene.tsx` | La barra pasa a enseñar el recuento contra `optimalSteps`, separa el lienzo vacío del intento fallido y avisa de los bloques sueltos |

**`StudentGameLabModule.tsx` no se toca, y es la comprobación de que la frontera
del J5 aguantó**: el resultado vive dentro del juego, bajo la frontera diferida,
porque la pantalla de nivel del J8 tiene que heredarlo en vez de reescribirlo.
Por lo mismo, `countSteps` **no puede aparecer en el trozo principal**.

**Bundle.** La línea de partida, medida sobre `65593e1` antes de tocar nada:
principal **625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor`
**644,43** (172,75), `GameScene` **829,26** (223,90), **221 módulos**. El
principal **no debe subir**; lo que crezca sale en el trozo de la escena.

**Tests.** Los **148** de 19 archivos siguen pasando, y `interpreter.test.ts`
suma los del recuento. Se lanzan con `npm run test:run` **desde la raíz**:
`npx vitest run` se salta la configuración del workspace y da decenas de fallos
falsos.

**Documentación**

- `docs/CONTRATO-DE-INTEGRACION.md` §4.2: una frase que hoy falta —qué significa
  que un niño **bata** `optimalSteps`—. El apartado ya avisa del número escrito
  **por debajo** del óptimo real, que deja el 100 inalcanzable; el caso de
  enfrente no está, y este paso es el primero que tiene que decidir qué pinta la
  pantalla cuando ocurre.
- `docs/ROADMAP-JUEGO.md` §3: el J6 pasa a ✅.
- `docs/CONTEXT.md` §2.9: el recuento, el retorno nuevo de `readProgram`, los dos
  agujeros cerrados y qué quedó verificado en el navegador **con el panel
  delante** —§2.9 ya avisa de que un panel oculto suspende los frames sin que la
  página pueda enterarse—. **Y el encargo del J6 se tacha**, que es la primera
  vez que un encargo de §2.9 se cierra.
- `docs/CONTEXT.md` §4.8: las medidas nuevas.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: dice que «lo que todavía no
  hay es el recuento de pasos ni la pantalla de resultado» y cuenta **once**
  garantías. Las dos cosas dejan de ser ciertas, y **ningún delta transporta el
  Purpose**: se reescribe a mano **al archivar**.
- `openspec/config.yaml`: sólo si el bloque de stack o el de convenciones cambian
  —no entra ninguna dependencia, así que probablemente no—. Se comprueba con
  `npx openspec doctor`.
