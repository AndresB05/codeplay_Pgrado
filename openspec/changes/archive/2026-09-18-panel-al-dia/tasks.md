## 1. El store

- [x] 1.1 Exponer `refreshSilently` en `apps/web/src/context/ClassroomsContext.ts`, documentando para qué es y por qué no se expone `refresh`; verificar con `npx tsc --noEmit -p apps/web` que el contexto compila y que ningún consumidor existente se rompe
- [x] 1.2 Pasarlo al valor del contexto en `ClassroomsProvider.tsx`
- [x] 1.3 Añadir en el provider el oyente de `document.visibilitychange` que recarga en silencio al volver la pestaña a visible, sin consultar si no hay usuario, y que se retira al desmontar; verificar que no queda ningún oyente vivo tras desmontar

## 2. Las pantallas

- [x] 2.1 Que `teacher/TeacherPanelModule.tsx` pida el refresco silencioso al montarse, y comprobar que no encadena una segunda recarga por dependencias inestables
- [x] 2.2 Lo mismo en `teacher/TeacherGroupDetailModule.tsx`
- [x] 2.3 Lo mismo en la vista de salón del niño, que desde el paso 17 muestra el mundo y la actividad de sus compañeros

## 3. Tests

- [x] 3.1 Test del store: volver la pestaña a visible provoca una relectura, y esa relectura **no** declara espera — con el servidor falso reteniendo la lectura, para que el aserto caiga mientras la consulta está en vuelo, que es lo que el paso 18 aprendió
- [x] 3.2 Test del store: sin usuario autenticado, volver la pestaña a visible no consulta nada
- [x] 3.3 Test del store: si la relectura falla, lo que ya se mostraba sigue ahí y el error se declara
- [x] 3.4 Test de que el panel del tutor pide el refresco al montarse
- [x] 3.5 Comprobar que los tests nuevos tienen dientes rompiendo el código que prueban, no suponiéndolo
- [x] 3.6 Comparar los tests por el nombre de cada `it(` contra `HEAD` —decodificando la salida de `git show` como UTF-8— y confirmar que no se retiró ninguno

## 4. Verificación

- [x] 4.1 Con dos sesiones reales: el tutor abre el panel, un niño juega un nivel, el tutor **navega a otra sección y vuelve** y la cifra ha subido, sin recargar la página
- [x] 4.2 Con las mismas dos sesiones: el tutor cambia de ventana mientras el niño juega, vuelve, y la cifra ha subido sin haber navegado
- [x] 4.3 Comprobar en pantalla que ninguna de las dos recargas blanquea lo que ya estaba pintado
- [x] 4.4 `npm run lint`, `npm run test:run` y `npm run build`, los tres desde la raíz

## 5. Documentación

- [x] 5.1 Anotar en `docs/CONTEXT.md` la medición que descartó publicar `user_progress` —Realtime entrega según la política de la tabla, comprobado con tres sesiones y una escritura real— para que nadie vuelva a proponerlo sin saberlo, y el aviso de que confundir las cuentas comentadas del `.env` da un falso positivo en esa medición
- [x] 5.2 Actualizar en `docs/ROADMAP.md` la nota del paso 27 sobre `realtime.broadcast_changes()`: deja de ser sólo la salida para la telemetría y pasa a ser también la que daría tiempo real al panel
- [x] 5.3 Mover la entrada correspondiente en `docs/CONTEXT.md` y replicar en `openspec/config.yaml` lo que cambie de convenciones; comprobar con `npx openspec doctor` que el YAML sigue parseando
