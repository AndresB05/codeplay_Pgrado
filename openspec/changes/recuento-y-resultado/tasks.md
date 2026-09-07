## 1. La línea de partida

- [x] 1.1 `npm run build` **antes de tocar nada** y comprobar que salen las cifras de `65593e1`: principal **625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor` **644,43** (172,75), `GameScene` **829,26** (223,90), **221 módulos**. Si no cuadran, parar: la comparación del punto 5 no valdría
- [x] 1.2 `npm run test:run` y comprobar **148 tests en 19 archivos**, y `npm ls three` con **una sola copia 0.170.0**. Si falla alguno de ResetPassword, ChangeNamePanel, Signup, TeacherPanelModule o ClassroomsProvider, repetir con la máquina libre antes de tocar nada: los cinco llevan `waitFor` de varios segundos y fallan de forma intermitente con la máquina cargada, y es **preexistente**

## 2. `interpreter.ts` — el recuento y el número de montones

- [x] 2.1 Escribir `countSteps(orders: Order[]): number` en `apps/web/src/game/interpreter.ts`: `avanzar N` suma N y `girar` suma 1, **sin tocar `config` ni ejecutar nada**. Verificar que la firma no recibe tablero y que el archivo sigue sin importar Blockly, `three` ni JSX, leyendo sus `import`
- [x] 2.2 Dejar en el encabezado de esa función **por qué existe pudiendo usarse `run.steps.length`**: §4.4 define el recuento como una lectura del programa, que es lo que el servidor hará en el J10. Comentario de *por qué*, no de *qué* (CLAUDE.md)
- [x] 2.3 Cambiar `readProgram` para que devuelva `{ orders, rootCount }` en vez de `Order[]`, conservando el `null` de programa ilegible tal cual. `rootCount` sale de `readRoots`, que ya lo tiene; `firstOnCanvas` no cambia. Verificar con `npx tsc --noEmit -p apps/web` que no queda ningún consumidor con la firma vieja
- [x] 2.4 Adaptar los **seis** tests de `readProgram` en `interpreter.test.ts` al retorno nuevo y añadir el `rootCount` esperado en cada uno: 1 con el PROGRAMA A, 2 con los dos montones sueltos, 0 con el lienzo vacío. Verificar con `npm run test:run`
- [x] 2.5 Añadir a `interpreter.test.ts` el recuento contra el ejemplo resuelto del contrato §4.4: el PROGRAMA A cuesta **10** pasos, un giro suelto **1**, un `avanzar 4` **4** y un programa sin órdenes **0**. Verificar con `npm run test:run`
- [x] 2.6 Añadir el test de que **las dos cuentas coinciden** —`countSteps(orders)` y `runProgram(board, orders).steps.length`— sobre el PROGRAMA A y sobre el programa que choca contra el muro de la fila 3, el de ocho pasos que ya está en el archivo. Con el comentario de para qué está: hoy no puede fallar, y se rompe el día que alguien haga que chocar detenga el programa

## 3. `GameScene.tsx` — la pantalla de resultado

- [x] 3.1 Sustituir `run` y `unreadable` por **un solo valor discriminado** —ilegible, vacío, o ejecución con su `Run`, su recuento y su `rootCount`—, dejando `index` como está. Verificar que el personaje sigue plantado en `config.start` sin ejecución y que «Reiniciar» vuelve a dejarlo todo sin resultado
- [x] 3.2 En `start()`, distinguir el **lienzo vacío** por `orders.length === 0` y **no** por el número de pasos, que es una invariante que nada declara (design.md §5). Verificar que el mismo camino cubre el caso de que el editor todavía no se haya montado, en el que `latest.current` es `null`
- [x] 3.3 Reescribir `OUTCOME_MESSAGES` y su derivación para pintar los **ocho** casos de la tabla de `design.md` §7: sin ejecutar, ejecutando, lienzo vacío, ilegible, llegó con los justos, llegó con menos, llegó gastando de más y no llegó. El recuento sale de `countSteps`, **no** de `run.steps.length`, y **no** se pinta en los casos de lienzo vacío e ilegible
- [x] 3.4 «Perfecto» es `success && pasos <= optimalSteps`, no `===`: un niño que bata el número significa que el nivel está mal sembrado, y eso se caza en el J7.1 resolviendo el puzle, no avisando a quien lo juega (design.md §6). Por eso «con los justos» y «con menos» son **dos textos**: el primero afirma una igualdad que en el segundo caso sería falsa
- [x] 3.5 Añadir el aviso de los montones sueltos cuando `rootCount > 1`, **junto** al resultado y sin sustituirlo. Verificar que no aparece con un solo montón ni con el lienzo vacío
- [x] 3.6 Mantener la barra **fuera del `<Canvas>` y dentro de `GameScene.tsx`**, con los estilos del sistema visual y sin hexadecimales sueltos, y comprobar que `StudentGameLabModule.tsx` **no ha hecho falta tocarlo**: si hubiera hecho falta, la barra está en el sitio equivocado

## 4. La verificación en el navegador

- [x] 4.1 `npm run dev`, abrir `/dashboard/game` y comprobar con `tabs_context` que **el panel está a la vista** antes de mirar nada animado: con el panel oculto son cero frames en 500 ms aunque la ventana esté al frente y `document.hidden` diga `false` (`CONTEXT.md` §2.9). Los clics del panel no producen eventos de puntero, así que colocar bloques pide despacharlos a mano; los botones de HTML sí responden
- [x] 4.2 Resolver el tablero con el **PROGRAMA A** —girar derecha, avanzar 4, girar izquierda, avanzar 4— y verificar que al terminar dice **10 pasos contra los 10 de la mejor solución** y que lo llama perfecto
- [x] 4.3 Verificar un programa que llega **gastando de más** y otro que **no llega**: los dos enseñan el recuento y el óptimo, y el primero sigue diciendo que se llegó
- [x] 4.4 Verificar el **lienzo vacío**: dice que no hay bloques, **no** enseña «0 pasos» y la consola no saca ningún error. La variante «antes de que el editor publique» **no se pudo provocar**: en desarrollo el editor publica antes de que «Ejecutar» sea pulsable, intentado dos veces con sondeo cada 5 ms. Es el mismo camino —`{}`— y queda **sin observar por separado**
- [x] 4.5 Verificar **dos montones sueltos**: se ejecuta el de arriba, sale el aviso de que sobraron bloques y el resultado del montón ejecutado se ve igualmente. Es el encargo que el J5 dejó en `CONTEXT.md` §2.9
- [x] 4.6 Verificar que durante la ejecución **no** se pinta resultado ni recuento, y que «Reiniciar» los quita
- [x] 4.7 **La fila «llegó con menos» no se verifica aquí, y se deja escrito por qué**: `debugLevel.optimalSteps` vale 10 y 10 es el óptimo real de ese tablero (§4.4 lo resuelve), así que ningún programa que llegue puede costar menos. El camino queda escrito y sin ejercitar; **no se dirá que se verificó**

## 5. Las medidas del bundle

- [x] 5.1 `npm run build` y comparar contra 1.1. El principal **no debe subir** de 625,00 kB y lo que crezca tiene que salir en el trozo de `GameScene`. Anotar las cinco cifras y los módulos
- [x] 5.2 Contar en el trozo principal con `grep -o … | wc -l` —nunca `grep -c`, que en un archivo minificado da 1— y verificar que sale **cero**. **`countSteps` NO sirve de marca**: sale cero también en `GameScene`, porque el minificador renombra los nombres locales. Las que sirven son `rootCount` —propiedad de objeto, sobrevive— y los textos de la barra, que no se pueden renombrar: 0 en el principal y 4, 1 y 1 en `GameScene`

## 6. El contrato y la documentación

- [x] 6.1 `docs/CONTRATO-DE-INTEGRACION.md` §4.2: añadir la frase que falta sobre `optimalSteps` **batido** —un niño que gaste menos pasos que el número sembrado significa que el número está por encima del óptimo real, y quien lo caza es quien siembra el nivel—. El caso contrario ya está escrito ahí; éste no
- [x] 6.2 `docs/ROADMAP-JUEGO.md` §3: el J6 pasa a ✅
- [x] 6.3 `docs/CONTEXT.md` §2.9: `countSteps` y el retorno nuevo de `readProgram`, los dos agujeros cerrados —lienzo vacío y montones sueltos—, y qué quedó verificado en el navegador **con el panel delante**. **Y tachar el «Encargo para el J6»**, que es la primera vez que un encargo de §2.9 se cierra: se reescribe como hecho, no se borra
- [x] 6.4 `docs/CONTEXT.md` §4.8: las medidas del punto 5, con el título del apartado revisado si alguna cifra cambia de kilobyte redondo
- [x] 6.5 `openspec/config.yaml`: repasar si el bloque de stack o el de convenciones cambian —no entra ninguna dependencia, así que probablemente no— y verificar con `npx openspec doctor` que el YAML sigue parseando

## 7. Verificación final

- [x] 7.1 `npm run lint` con **0 warnings**, `npm run test:run` con **156 en 19 archivos**: los 148 de antes más los 8 nuevos de `interpreter.test.ts` y `npm run build` sin error, los tres **desde la raíz**: `npx vitest run` se salta la configuración del workspace y da decenas de fallos falsos
- [x] 7.2 **PARADA antes de commitear.** No se commitea hasta que la sesión que revisa lo haya verificado contra el disco
- [x] 7.3 Enumerar las rutas en `git add` una a una, **nunca `git add -A`**: con varios cambios vivos el árbol casi nunca contiene sólo lo que se está commiteando (CLAUDE.md, commit `982a299`)
- [ ] 7.4 **PARADA antes del commit del archivado.** El `## Purpose` de `openspec/specs/juego-3d/spec.md` dice que «lo que todavía no hay es el recuento de pasos ni la pantalla de resultado» y cuenta **once** garantías; pasan a **trece** y **lo nuevo se añade al final, sin renumerar las referencias internas**. Ningún delta transporta el Purpose: se reescribe a mano
- [ ] 7.5 En esa misma parada, leer el **diff del requisito modificado** en el spec principal —«El juego sabe si el programa llegó a la meta»— y confirmar que lo que cambió es el acotamiento a «con órdenes que ejecutar», el escenario del programa sin órdenes y el párrafo de las dos magnitudes, **y ni una línea más**. Es el punto 8 de `ROADMAP.md` §1.3 aplicado a un `MODIFIED`: manda leer lo borrado ante un `REMOVED`, y un `MODIFIED` mal copiado pierde detalle exactamente igual y sin que nada lo delate
