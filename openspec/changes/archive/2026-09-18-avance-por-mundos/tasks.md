## 1. El catálogo

- [x] 1.1 Sustituir `getCatalogSize()` por `getCatalog()` en `apps/web/src/services/studentProgress.service.ts`: dos lecturas en paralelo —`worlds` y `levels`, las dos con `is_published` y ordenadas por `sort_order`— cruzadas en el cliente, devolviendo mundos con sus niveles
- [x] 1.2 Declarar los tipos del catálogo junto a los que ya hay en el servicio, y documentar por qué son dos consultas y no una con anidado
- [x] 1.3 Comprobar contra la base real, con la cuenta de tutor de `.env`, que la respuesta trae los 3 mundos y los 9 niveles en el orden esperado

## 2. El cruce

- [x] 2.1 Escribir `buildWorldProgress(catalog, detail)` en `teacher/classroomsData.ts`: un mundo por entrada, con superados sobre publicados y sus niveles en orden, cada uno con su progreso o `null` y sus intentos
- [x] 2.2 Que un nivel con progreso fuera del catálogo se añada al final de su mundo, y que un mundo entero fuera del catálogo se añada al final de la lista
- [x] 2.3 Que los recuentos del resumen —`getClassroomProgressSummary`— sigan saliendo del catálogo nuevo sin cambiar de valor

## 3. La ficha

- [x] 3.1 Agrupar la tabla de `TeacherPanelModule.tsx` por mundo, con cabecera y contador de superados sobre publicados
- [x] 3.2 Pintar los niveles sin empezar en fila apagada, con «Sin empezar» donde iría la marca y un guión en intentos y pasos, distinguibles de los empezados y no superados sin depender sólo del color
- [x] 3.3 Cambiar la cabecera de la ficha para que cuente sobre el catálogo: niveles superados de los publicados y mundos terminados de los publicados
- [x] 3.4 Mantener sobre la tabla la frase de que todavía no ha jugado cuando el explorador no tiene ningún intento, con el catálogo debajo

## 4. La dirección

- [x] 4.1 Registrar `${ROUTES.TEACHER_PANEL}/:groupId/:studentId` en `AppRouter.tsx`, junto a la que ya existe con salón
- [x] 4.2 Que `TeacherDashboard.tsx` lea `studentId` y pase los dos tramos al panel; comprobar que `activeSection` sigue resolviendo el panel con la ruta de dos tramos
- [x] 4.3 Que el panel navegue al elegir salón y al elegir explorador, con `all` en el tramo de salón sólo cuando el alcance es «Todos» y hay explorador
- [x] 4.4 Que cambiar de salón suelte al explorador, y que un explorador fuera del alcance no abra ficha ni produzca error
- [x] 4.5 Comprobar que «Ver progreso» desde el detalle del salón sigue llegando al panel con ese salón elegido

## 5. Tests

- [x] 5.1 Tests de `buildWorldProgress`: el caso de dos mundos empezados por el nivel 1 y ninguno terminado, el de nueve de nueve, y el de cero
- [x] 5.2 Test de que un nivel con progreso fuera del catálogo no se pierde
- [x] 5.3 Test de que el mundo terminado se cuenta con la misma regla que el servidor —superados `>=` publicados—, incluido el mundo sin niveles publicados
- [x] 5.4 Tests del panel: la ficha nombra el mundo intacto y los niveles sin empezar; la cabecera cuenta sobre el catálogo
- [x] 5.5 Tests del panel: elegir explorador escribe la dirección, abrirla directamente pinta la ficha, y una dirección con un explorador fuera del alcance no la pinta
- [x] 5.6 Adaptar los tests que hoy montan el panel sin enrutador y los que doblan `getCatalogSize`
- [x] 5.7 Comprobar que los tests nuevos tienen dientes rompiendo el código que prueban, no suponiéndolo
- [x] 5.8 Comparar los tests por el nombre de cada `it(` contra `HEAD` —decodificando la salida de `git show` como UTF-8— y confirmar que no se retiró ninguno

## 6. Verificación

- [x] 6.1 Con la cuenta de tutor de `.env`: la ficha de Axoluk enseña los tres mundos, «Selva 1 de 3», «Cordillera 0 de 3», «Costa 1 de 3», y los siete niveles que le faltan
- [x] 6.2 La ficha de six seven enseña los tres mundos completos, y la de Invitada Prueba los nueve niveles sin empezar con la frase encima
- [x] 6.3 Cuadrar lo que dice la pantalla con lo que dice la base para las tres cuentas, consultando las vistas con el mismo tutor
- [x] 6.4 Recargar con una ficha abierta y comprobar que vuelve la misma; abrir a mano una dirección con un explorador fuera del alcance y comprobar que no rompe
- [x] 6.5 Comprobar que las cuatro tarjetas del resumen siguen diciendo lo mismo que antes del cambio
- [x] 6.6 `npm run lint`, `npm run test:run` y `npm run build`, los tres desde la raíz

## 7. Documentación

- [x] 7.1 Anotar en `docs/CONTEXT.md` §2.10 qué enseña ahora la ficha y por qué el catálogo manda el orden, con la medición de las tres cuentas
- [x] 7.2 Anotar que el alcance y el explorador viven en la dirección, y el tramo `all`
- [x] 7.3 Pasar el paso 31 a hecho en `docs/ROADMAP.md`, con lo que quedó fuera
- [x] 7.4 Replicar en `openspec/config.yaml` lo que cambie de estado o convenciones, y comprobar con `npx openspec doctor` que el YAML sigue parseando
- [x] 7.5 Archivar el cambio dentro del mismo commit, enumerando las rutas en `git add`
