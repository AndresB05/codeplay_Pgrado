## 1. La lista de niveles

- [x] 1.1 En `apps/web/src/components/dashboard/student/StudentWorldLevelsModule.tsx`, quitar la regla «el anterior completado» y con ella `isLocked`, el `disabled` del botón, `LockIcon`, el fondo `#E3D9F7` de la cabecera y las clases `cursor-not-allowed opacity-70`. Reescribir el comentario de la regla con el porqué nuevo: provisional hasta la prueba preliminar, candado pendiente de decidir (`docs/CONTEXT.md` §4.11). Verificación: `grep -n "isLocked\|LockIcon\|disabled" ` sobre el archivo no devuelve nada y `npm run lint` sigue en cero avisos.
- [x] 1.2 Sacar «Aquí vas» del **primer nivel sin completar**, no de «desbloqueado y sin completar», que sin candado marcaría todos. Verificación: con una cuenta sin progreso sólo el nivel 1 lleva la marca; con todos completados, ninguno.
- [x] 1.3 **Añadida al aplicar, con el usuario delante:** el botón de vuelta de la pantalla de rechazo salía **en blanco y sin texto**. `btn-primary` no existe en `main.css` —las variantes son `grape`, `mint`, `sun`, `coral`, `sky`, `ghost`, `leaf`, `slate` y `papaya`—, así que quedaba el `.btn` base: texto blanco sin fondo. Pasa a `btn-grape` en las dos pantallas que lo usaban, `StudentLevelModule.tsx` y el «mundo no disponible» de `StudentWorldLevelsModule.tsx`. Verificación: `grep -rn "btn-primary" apps/web/src` no devuelve nada, y el botón se lee en pantalla.

## 2. Verificación en el navegador

- [x] 2.1 Con la cuenta de niño de «Sin login», abrir la Selva Algorítmica y comprobar que los tres niveles se ven iguales de disponibles, sin candado. Pulsar el nivel 3 con `.click()` desde `javascript_tool` —los clics del panel no disparan botones, `CONTEXT.md` §2.9— y comprobar que se abre su pantalla con el aviso «Este nivel todavía no se puede jugar» y sin tablero. Verificación: la dirección cambia a la del nivel 3 y la pantalla dice ese texto, leído con `read_page`, no supuesto por una captura.
- [x] 2.2 Pulsar el nivel 1 desde la lista y comprobar que sigue abriendo su tablero. Verificación: la pantalla muestra «Nivel 1 - Siempre adelante» y no el aviso de rechazo.

## 3. Documentación y cierre

- [x] 3.1 Actualizar `docs/CONTEXT.md`: en §2.6 la fila «Niveles de un mundo, con bloqueo por progresión» pasa a decir que no bloquea hasta la prueba preliminar; §4.11 se reescribe entero contra lo que hoy es verdad —ya no hay candado ni en la lista ni en la pantalla, y se decide después de esa prueba—, releyendo la frase completa y no sólo cambiando el título. Verificación: `grep -n "candado" docs/CONTEXT.md` no devuelve ninguna frase que diga que la lista bloquea.
- [x] 3.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` y pegar la salida cruda. Verificación: lint en cero avisos, ningún test roto y el build termina.
- [x] 3.3 Preparar el commit enumerando las rutas en `git add`, nunca `-A`, y pedir al usuario que lo autorice. Verificación: `git status` enseña que lo que entra es sólo lo de este cambio. **El usuario pidió un solo commit para este cambio y `nivel-2-desde-la-base`**, que comparten `CONTEXT.md`, `config.yaml` y `StudentLevelModule.tsx`, con los dos ya archivados dentro.
