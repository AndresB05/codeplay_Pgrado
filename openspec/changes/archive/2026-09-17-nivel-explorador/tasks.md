## 1. Medir el síntoma antes de tocar nada

- [x] 1.1 Jugar un nivel que conceda XP y mirar la barra sin recargar. Verificación: la base pasó a 693 y la barra siguió diciendo 683, también al volver a la lista de mundos.
- [x] 1.2 Comprobar quién usa el máximo provisional y quién calcula niveles de XP. Verificación: `PROVISIONAL_MAX_XP` en cuatro sitios, `WelcomeBanner` pasando `1000` a mano, y `WelcomeBanner.helpers.ts` con tres funciones de 1000 en 1000 **que no importa nadie**.

## 2. La cuenta del tramo

- [x] 2.1 Reescribir `apps/web/src/constants/progress.ts`: retirar `PROVISIONAL_MAX_XP` y dejar el tamaño del tramo, el número de Nivel Explorador y lo que se lleva dentro del tramo. Verificación: `PROVISIONAL_MAX_XP` no aparece en ningún archivo.
- [x] 2.2 Cubrirlo con `constants/progress.test.ts`: 0 XP es nivel 1 con la barra vacía, 299 sigue en 1, 300 pasa a 2 con la barra vacía, 900 es nivel 4, y un XP que no es número no rompe. Verificación: `npm run test:run -w @codeplay/web` en verde.

## 3. Lo que se ve

- [x] 3.1 Cambiar `components/ui/XPBar.tsx` para que reciba el XP y calcule su tramo, con la etiqueta «Nivel Explorador N» y lo que lleva dentro del tramo. Verificación: ninguna llamada le pasa ya un máximo.
- [x] 3.2 Actualizar las llamadas de `Sidebar.tsx`, `StudentTopBar.tsx` y `WelcomeBanner.tsx` —esta última sólo para que compile, sigue huérfana—. Verificación: `npm run build -w @codeplay/web` compila.
- [x] 3.3 Enseñar el Nivel Explorador junto al XP en `StudentSettingsModule.tsx`. Verificación: se ve al abrir Ajustes con la cuenta de pruebas.
- [x] 3.4 Dejar en `StudentRosterTable.tsx` la barra, el XP acumulado y el nivel, en las dos vistas. Verificación: con dos alumnos a distinto lado de un salto de tramo se ve cuál va delante.
- [x] 3.5 Borrar `WelcomeBanner.helpers.ts`. Verificación: `npm run build` y `npm run lint` siguen pasando, porque no lo importaba nadie.

## 4. El XP al día

- [x] 4.1 Añadir a `AuthContext.ts` y `AuthProvider.tsx` la acción que aplica el total de XP que devuelve el servidor, con la misma forma que `updateFullName`. Verificación: los tests de `AuthProvider` siguen en verde.
- [x] 4.2 Llamarla desde `StudentLevelModule.tsx` con el total de la partida, y no tocar nada si el guardado falló. Verificación: el caso de 5.2.
- [x] 4.3 Avisar de la subida de tramo en `LevelCompleteDialog.tsx`, comparando el tramo de antes con el de después. Verificación: los casos de 5.3.

## 5. Verificación jugando

- [x] 5.1 Comprobar la barra y el nivel con la cuenta de pruebas. Verificación: con 693 XP dice Nivel Explorador 3 y 93 de 300.
- [x] 5.2 Ganar XP jugando y volver al panel **sin recargar**. Verificación: la barra y el número se mueven solos; con el guardado caído, no se mueven.
- [x] 5.3 Provocar una subida de tramo jugando. Verificación: la ventana la anuncia, el panel enseña el número nuevo, y una partida que concede cero no anuncia nada.
- [x] 5.4 Mirar la tabla del tutor con el salón de pruebas. Verificación: se ven barra, XP y nivel en las dos vistas.
- [x] 5.5 Propagar a `docs/CONTEXT.md` —§2.7 y §3—, `docs/DISENO-DEL-JUEGO.md` §3, `docs/ROADMAP.md` §3.2, `docs/ROADMAP-JUEGO.md` y `openspec/config.yaml`. Verificación: `npx openspec doctor` sin errores.
- [x] 5.6 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz. Verificación: los tres pasan, lint con cero avisos.
