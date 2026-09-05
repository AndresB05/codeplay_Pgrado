## 1. La línea de partida

- [x] 1.1 `npm run build` **antes de tocar nada** y anotar las cifras. Deben salir las de `b602ff2`: principal **624,78 kB** (167,77 gzip), `BlockEditor` **644,50** (172,77), `GameScene` **825,21** (222,25), **219 módulos**. Si no cuadran, parar: la comparación del punto 6 no valdría
- [x] 1.2 `npm ls three` y verificar **una sola copia 0.170.0**. Es el chequeo que el J2 dejó escrito para quien tocara el ecosistema 3D y que nunca se ha ejecutado; aquí no se instala nada, así que sirve además de línea de partida por si algo lo mueve

## 2. El intérprete, puro

- [x] 2.1 Escribir `apps/web/src/game/interpreter.ts` con `readProgram(workspace)`, que baja por la cadena `next.block` del contrato §4.3 y devuelve `Order[]`, o `null` si encuentra un tipo de bloque desconocido o un `STEPS` que no sea entero positivo. **Sin importar Blockly, `three` ni JSX** — verificar leyendo los `import` del archivo y con `npx tsc --noEmit -p apps/web`
- [x] 2.2 En el mismo archivo, elegir el montón que se ejecuta cuando `workspace.blocks.blocks` trae varios: el de **`y` menor**, y `x` menor a igualdad de `y`, con los que falten tratados como 0 (§4.3 documenta esas coordenadas sólo en el bloque raíz)
- [x] 2.3 Escribir `runProgram(config, orders)`: pliega las órdenes sobre `config.start` con `turn` y `advance` de `movement.ts` —sin reimplementar ninguna regla— y devuelve `{ steps, success }`, con **una entrada por paso ordenado**, incluidas las bloqueadas, y `success` a `true` si alguna pose del recorrido pisa `config.goal`
- [x] 2.4 Dejar escrita en el encabezado del módulo **la frontera con `program.ts`**: aquél abre el sobre y se niega a saber qué hay dentro, éste lee la carta. Y por qué chocar no detiene el programa, con la referencia al contrato §4.4
- [x] 2.5 Escribir `apps/web/src/game/interpreter.test.ts` y verificarlo con `npm run test:run`. Como mínimo: el **PROGRAMA A del contrato §4.3 pegado tal cual** resuelve el tablero de pega (§4.2) y da `success`; `avanzar 4` contra un muro a dos casillas produce **cuatro** entradas, dos con `blockedBy`, y la ejecución continúa después; un programa que pisa la meta y se va da `success`; uno que no la pisa, no; un lienzo vacío (`{}`) da cero órdenes y ninguna entrada; un bloque de tipo desconocido devuelve `null`; con dos montones se ejecuta el de arriba
- [x] 2.6 Verificar que el recuento de §4.4 y el recorrido **coinciden** sobre el PROGRAMA A: diez pasos ordenados, diez entradas. Es la comprobación de que la forma del recorrido no rompe el recuento del J6 — sin escribir aquí ninguna función de contar, que es del J6

## 3. La escena: ejecutar y animar

- [x] 3.1 `GameScene.tsx`: recibir el programa como propiedad y guardarlo en una **referencia actualizada en cada render**, para leerlo al pulsar «Ejecutar» —el patrón que ya usa `BlockEditor` para publicar hacia arriba—, de modo que mover bloques a mitad de ejecución no altere el recorrido en marcha
- [x] 3.2 Añadir el estado de ejecución —el `Run` en curso y el índice del paso— y **derivar de ahí la pose que se pinta**, sin guardarla aparte. Verificar que sin ejecución el personaje está en `config.start`
- [x] 3.3 Animar el paso en `<Character>` con `useFrame`: interpolación lineal de la posición entre los dos centros de casilla, del ángulo **por el lado corto** (norte→oeste es un cuarto de vuelta, no tres) y, cuando el paso trae `blockedBy`, un **topetazo** de ida y vuelta a una fracción de casilla. Al terminar el tramo, avanzar el índice
- [x] 3.4 Montar la barra con «Ejecutar», «Reiniciar» y el resultado **fuera del `<Canvas>` pero dentro de `GameScene.tsx`** —dentro del lienzo los elementos son objetos de `three`—, con los estilos del sistema visual y sin hexadecimales sueltos. «Ejecutar» queda inhabilitado mientras hay una ejecución en curso
- [x] 3.5 El arranque de la ejecución cuelga **del evento del botón, nunca de un `useEffect`**: con `React.StrictMode` un efecto se dispara dos veces en desarrollo y duplicaría el recorrido
- [x] 3.6 Retirar `window.codeplayGame` y su `useEffect`, la declaración global de `Window` y el `import.meta.env.DEV` que lo gobernaba. Verificar con `grep -r codeplayGame apps/web/src` que no queda ninguna aparición

## 4. El cableado, sin mover la frontera

- [x] 4.1 `GameSceneLoader.tsx`: aceptar el programa y pasarlo al componente perezoso, importando **sólo el tipo** de `program.ts`, como hace `BlockEditorLoader.tsx`. Verificar que el archivo sigue sin importar `three` ni el intérprete
- [x] 4.2 `StudentGameLabModule.tsx`: bajar a `GameSceneLoader` el programa que ya tiene en estado. Verificar que la pantalla **no importa** `interpreter.ts` ni nada que arrastre `three` o Blockly
- [x] 4.3 `StudentGameLabModule.tsx`: quitar la tarjeta «Mover al personaje» con las órdenes de consola y reescribir los textos que dicen que los bloques «todavía no se ejecutan» y que las órdenes se dan a mano. El aviso de que la pantalla no existe fuera de desarrollo se queda; la frase sobre las órdenes, no

## 5. La verificación en el navegador

- [x] 5.1 `npm run dev`, abrir `/dashboard/game` **con la ventana delante** —una ventana oculta o minimizada suspende los frames aunque `document.hidden` diga `false`, `CONTEXT.md` §2.9— y resolver el tablero de pega de principio a fin con el PROGRAMA A: girar derecha, avanzar 4, girar izquierda, avanzar 4. Se ve el recorrido paso a paso y el resultado dice que se llegó
- [x] 5.2 Verificar el programa que **choca y sigue**: un `avanzar` que se topa con el muro y una orden más detrás. Se ve el topetazo, el personaje no lo atraviesa y la orden siguiente se ejecuta
- [x] 5.3 Verificar «Reiniciar» durante una ejecución y con el recorrido terminado, y que «Ejecutar» no lanza una segunda ejecución mientras hay una en curso
- [x] 5.4 Verificar un programa que **pisa la meta y se va**: el resultado dice que se llegó, que es la decisión del punto 4 de `design.md`. Y un lienzo vacío: no pasa nada y no hay error

## 6. Las medidas del bundle

- [x] 6.1 `npm run build` y comparar contra 1.1. El principal **no debe subir** de 624,78 kB —puede bajar, porque la tarjeta de las órdenes desaparece— y lo que crezca tiene que salir en el trozo de `GameScene`. Anotar las cuatro cifras y los módulos
- [x] 6.2 Contar una marca inequívoca del intérprete en el trozo principal con `grep -o … | wc -l` —nunca `grep -c`, que en un archivo minificado da 1— y verificar que sale **cero**: es la prueba de que el intérprete se quedó bajo la frontera

## 7. El contrato y la documentación

- [x] 7.1 `docs/CONTRATO-DE-INTEGRACION.md` §4.4: escribir que **pisar la meta y seguir cuenta como haber llegado**, con el argumento de coherencia con el choque —la ineficiencia se paga en la puntuación, no invalidando el nivel— y la nota de que el programa B de §4.4 no distinguía el caso
- [x] 7.2 `docs/CONTRATO-DE-INTEGRACION.md` §4.3: escribir qué montón se ejecuta cuando hay varios sueltos, que ese apartado deja explícitamente «al paso que ejecute»
- [x] 7.3 `docs/ROADMAP-JUEGO.md` §3: el J5 pasa a ✅
- [x] 7.4 `docs/CONTEXT.md` §2.9: `interpreter.ts` y su test en la tabla de archivos, la ejecución y su frontera, la **retirada de las órdenes de consola** —el párrafo que las documenta y la nota de que «siguen aunque ya haya bloques» dejan de ser ciertos—, las dos decisiones nuevas del contrato y qué quedó verificado en el navegador con la ventana delante. **Y el encargo para el J6**: el montón de más arriba falla en silencio —un bloque suelto arriba se ejecuta en lugar del programa y el niño no puede distinguirlo de un programa malo—, así que la pantalla de resultado es el sitio de «te sobraron bloques sueltos». Va aquí y no sólo en `design.md` porque §2.9 es lo que el J6 lee
- [x] 7.5 `docs/CONTEXT.md` §4.8: las medidas del punto 6
- [x] 7.6 `openspec/config.yaml`: repasar si el bloque de stack o el de convenciones cambian —no entra ninguna dependencia, así que probablemente no— y verificar con `npx openspec doctor` que el YAML sigue parseando

## 8. Verificación final

- [x] 8.1 `npm run lint` con 0 warnings, `npm run test:run` con los **134 de antes más 14 nuevos: 148 en 19 archivos** y `npm run build` sin error. Los tres pasan
- [x] 8.2 **PARADA antes de commitear.** No se commitea hasta que la sesión que revisa lo haya verificado contra el disco
- [x] 8.3 Enumerar las rutas en `git add`, nunca `git add -A`: con varios cambios vivos el árbol casi nunca contiene sólo lo que se está commiteando
- [ ] 8.4 **PARADA antes del commit del archivado**, y con dos cosas que leer en esa parada. Primera: el `## Purpose` de `openspec/specs/juego-3d/spec.md` dice «Ya se puede escribir un programa, pero todavía no ejecutarlo» y cuenta **diez** garantías; pasan a **once** —dos nuevas, una retirada— y **lo nuevo se añade al final, sin renumerar las referencias internas**. Segunda: el punto 8 de `ROADMAP.md` §1.3 aplica por primera vez en el proyecto, así que se leen las **líneas borradas** del spec principal y se confirma que lo suprimido es exactamente el requisito de las órdenes sueltas y sus tres escenarios, ni una línea más
