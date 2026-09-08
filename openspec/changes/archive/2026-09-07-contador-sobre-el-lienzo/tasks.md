## 1. La línea de partida

- [x] 1.1 `npm run build` **antes de tocar nada** y comprobar las cifras de `866a114`: principal **625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor` **644,43** (172,75), `GameScene` **830,87** (224,43), **221 módulos**. Si no cuadran, parar: la comparación del punto 4 no valdría
- [x] 1.2 `npm run test:run` y comprobar **163 tests en 19 archivos**. Si falla alguno de ResetPassword, ChangeNamePanel, Signup, TeacherPanelModule o ClassroomsProvider, repetir con la máquina libre: es **preexistente**

## 2. Borrar la pieza de «mientras construye»

- [x] 2.0 **El aviso de sueltos se queda**, decidido por el usuario el 7-sep-2026 sobre la propuesta: entra `hasLooseStacks(program): boolean` en `interpreter.ts` en el sitio de `programCost`, y con él los tests de los tres casos en que no hay nada que señalar. Devuelve booleano y **no** el número de montones: ese número no lo enseña nadie, y devolverlo dejaría puesta la cifra que este paso vino a quitar (design.md §6)
- [x] 2.1 Quitar `programCost` de `apps/web/src/game/interpreter.ts` y devolver el `import` de `program.ts` a **sólo el tipo** si no queda otro uso del valor. Verificar con `npx tsc --noEmit -p apps/web` y comprobar leyendo el `git diff` que `readProgram`, `countSteps` y `runProgram` **no se tocan**
- [x] 2.2 Quitar el bloque `describe('programCost')` de `interpreter.test.ts` —los **siete** tests— y el `import` de `sealProgram` si no queda otro uso. Verificar con `npm run test:run`: **156 en 19 archivos**
- [x] 2.3 Quitar de `GameScene.tsx` el `useMemo` de `canvasCost`, `visibleCost`, `canvasCostLine` y su bloque de JSX. **`LOOSE_BLOCKS_NOTICE` y su línea se quedan**, alimentados ahora por `hasLooseStacks` sobre la prop, y el aviso sigue cediendo cuando el del resultado está en pantalla. Verificar con `npx tsc --noEmit -p apps/web` y `npm run lint`
- [x] 2.4 **La prueba de que la separabilidad era real**: comprobar en el `git diff` que la línea de `warning` **no ha cambiado ni una letra** y que `countSteps`, el `Attempt`, `start()` y el `useRef` de `latest` siguen igual. Si hubiera hecho falta tocar alguno, **decirlo** en vez de arreglarlo por dentro: significaría que la pieza no estaba montada como el J6.1 dijo. **Comprobado**: la línea de `warning` sale en el diff como contexto, sin tocar, y `interpreter.ts` e `interpreter.test.ts` quedan **byte a byte** como estaban antes del J6.1 (`git diff fed5f54^` vacío en los dos)

## 3. Mover el contador a la pantalla del juego

- [x] 3.1 Poner `relative` en el contenedor del lienzo —`<div className="min-h-0 flex-1">`— y añadir dentro, **fuera del `<Canvas>`**, el contador en posición absoluta arriba a la derecha. Verificar que no queda ningún elemento de HTML dentro del árbol de `@react-three/fiber`, donde los elementos son objetos de `three`
- [x] 3.2 Que diga **cuántos pasos lleva dados** y nada más: `index + 1` con el `stepsLabel` que ya existe —«1 paso», «7 pasos»—, **sin el total y sin el óptimo**. Verificar leyendo el código que `config.optimalSteps` no aparece en el contador y que `active.steps` no lo alimenta
- [x] 3.3 Que sólo se vea **mientras hay ejecución en curso**: aparece al ejecutar y desaparece al terminar o al reiniciar. Verificar en el navegador (punto 4)
- [x] 3.4 Estilarlo con los nombres de color del tema y sin hexadecimales sueltos, legible sobre el lienzo —borde de `ink` y fondo de `cream`, como la barra— y con `pointer-events-none` para que no se coma clics de la escena. Verificar con `git diff | grep` que no entra ningún `#`
- [x] 3.5 Devolver `OUTCOME_MESSAGES.running` —«Ejecutando el programa…»— y quitar `runningLine`. Verificar que la barra durante la ejecución dice eso y nada de números

## 4. La verificación en el navegador

- [x] 4.1 `npm run dev`, abrir `/dashboard/game` y **emular un viewport con `resize_window`**: sin eso el bucle de `@react-three/fiber` se suspende con el panel oculto y el contador no sube, aunque la página dé 60 fps y `document.hidden` diga `false` (`CONTEXT.md` §2.9). Los clics del panel no disparan los botones: `.click()` desde `javascript_tool`
- [x] 4.2 Cargar el PROGRAMA A con `serialization.workspaces.load` y **comprobar el `<pre>` antes de fiarse**: si no contiene `codeplay_advance`, el programa **no ha llegado** y lo que se verifique encima no vale nada (`CONTEXT.md` §2.9)
- [x] 4.3 **Nada se ve al construir**: con el PROGRAMA A cargado y sin ejecutar, la barra dice sólo «Coloca bloques y pulsa «Ejecutar»…», **sin ninguna línea de coste** y **sin el óptimo por ninguna parte** de la pantalla. Es el punto entero de este paso
- [x] 4.4 **El contador sube sobre el lienzo**: ejecutar y verificar que en la esquina superior derecha del juego aparece «1 paso», «2 pasos»… hasta «10 pasos», subiendo con el personaje, y que **en ningún momento dice un total**. Sacar una captura, que aquí lo que cambia es dónde se ve. **Verificado**: «2 pasos» → «10 pasos» en la esquina, la barra dice sólo «Ejecutando el programa…», y ningún total aparece en pantalla
- [x] 4.5 **Al terminar desaparece** y sale el resultado del J6 con sus dos números; **«Reiniciar» a mitad** lo quita también
- [x] 4.6 **El contador no se mueve al tocar el lienzo con el recorrido en marcha**: lanzar un programa largo y cargar otro distinto a media ejecución. Es la garantía del J6.1 que este paso no puede romper
- [x] 4.7 **Los bloques sueltos**: con dos montones, verificar que al construir **sí se avisa** —en presente y sin ninguna cifra— y que al terminar sale el del resultado, **uno solo**. ⚠️ **NO SE PUDO VERIFICAR en el navegador tras el cambio del aviso**: el fallo intermitente de §2.9 se quedó fijo en «off» y no hay forma de meterle un programa a la aplicación. Lo que sí quedó verificado antes del cambio, con la pieza recién retirada, es que al construir no salía nada y que al terminar salía el del J6 intacto. La lógica nueva la cubren los seis tests de `hasLooseStacks`; **el cableado queda sin ver en pantalla y así se dice**
- [x] 4.9 **El fallo de carga, caracterizado mejor que en el J6.1**: un escuchador propio sobre `getMainWorkspace()` recibe **cero eventos** al crear un bloque con ese mismo módulo, con **una sola copia** de `blockly_core` cargada, `Events.isEnabled()` en `true` y el espacio registrado en el registro de esa copia. No es que el truco de carga falle: es que **Blockly deja de repartir eventos en esa página**, y eso afectaría también a un niño arrastrando bloques. Sobrevive a recargar, a una pestaña nueva y a reiniciar el servidor de desarrollo. Anotado en §2.9
- [x] 4.8 Comprobar que el contador **no tapa** ninguna casilla del tablero ni se come clics, y que la consola no saca ningún error

## 5. Las medidas del bundle

- [x] 5.1 `npm run build` y comparar contra 1.1. `GameScene` **debería bajar**: se borra más de lo que entra. El principal no puede subir de 625,00 kB. Anotar las cinco cifras y los módulos. **Medido**: principal **625,00 kB** (167,90) sin moverse, `program` 0,35, `BlockEditor` 644,43, `GameScene` **830,87 → 830,75** (224,43 → 224,43), **221 módulos** iguales — baja 0,12 kB: se fue el coste y se quedó el aviso
- [x] 5.2 Verificar con `grep -o … | wc -l` —nunca `grep -c`— que los textos que se van dejan de aparecer en el trozo de `GameScene`: «Tu programa cuesta» y «Tienes bloques sueltos» a **cero**, y que «Te sobraron bloques sueltos» —el del J6, que se queda— sigue en **uno**. **Medido tras conservar el aviso**: «Tu programa cuesta» **0** en los dos trozos, «Tienes bloques sueltos» **1** en `GameScene` —se queda—, «Te sobraron bloques sueltos» **1**, «Ejecutando el programa» **1**, y `rootCount` **0** en el principal y **5** en `GameScene`

## 6. La documentación

- [x] 6.1 `docs/ROADMAP-JUEGO.md` §3: el J6.2 pasa a ✅
- [x] 6.2 `docs/CONTRATO-DE-INTEGRACION.md` §4.2: la frase que el J6.1 añadió —«desde el J6.1 lo ve antes de ejecutar»— **vuelve a ser falsa**. `optimalSteps` se ve otra vez sólo al terminar, y el motivo del usuario merece quedar ahí: enseñar el número a batir antes de resolver convierte el nivel en otro problema
- [x] 6.3 `docs/CONTEXT.md` §2.9: qué se retiró, el motivo del usuario **literal**, si la separabilidad aguantó al cobrarse, y dónde vive ahora el contador con la trampa del `<Canvas>`. **El bloque del J6.1 no se borra**: es el registro de lo que pasó; se corrige lo que dejó de ser cierto
- [x] 6.4 `docs/CONTEXT.md` §4.8: las medidas del punto 5
- [x] 6.5 `openspec/config.yaml`: repasar y verificar con `npx openspec doctor` que sigue parseando. No entra ni sale dependencia, así que probablemente no cambia

## 7. Verificación final

- [x] 7.1 `npm run lint` con **0 warnings**, `npm run test:run` con **162 en 19 archivos** —los 163 menos los siete de `programCost` más los seis de `hasLooseStacks`— y `npm run build` sin error, los tres **desde la raíz**: `npx vitest run` se salta la configuración del workspace
- [x] 7.2 **PARADA antes de commitear.** No se commitea hasta que la sesión que revisa lo haya verificado contra el disco
- [x] 7.3 Enumerar las rutas en `git add` una a una, **nunca `git add -A`** (CLAUDE.md, commit `982a299`)
- [x] 7.4 **PARADA antes del commit del archivado.** El `## Purpose` de `openspec/specs/juego-3d/spec.md` cuenta **quince** garantías y describe el coste al construir en dos sitios; pasan a **quince** otra vez —se retira una y entra una— y hay que quitar lo que deja de ser cierto **sin renumerar** los recuentos que se citan desde otros sitios
- [x] 7.5 En esa misma parada, **leer las líneas borradas del spec principal**, que es el punto 8 de `ROADMAP.md` §1.3 y aquí toca de verdad: se van un requisito entero y sus **siete** escenarios, y entra otro con seis. Confirmar que lo borrado es exactamente eso más lo del requisito modificado, y ni una línea más
