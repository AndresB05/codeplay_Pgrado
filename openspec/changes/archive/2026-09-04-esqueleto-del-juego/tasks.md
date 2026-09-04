## 1. Línea de partida

Se mide **antes** de instalar nada, porque después ya no se puede.

- [x] 1.1 Guardar la salida de `npm run build`: trozo principal, gzip, número de trozos y de módulos. Verificación: coincide con lo escrito en `design.md` decisión 5 —623,18 kB / 166,96 kB gzip / 1 trozo / 177 módulos—; si no coincide, **parar y decirlo**, porque la comparación final se hace contra esta cifra y no contra la del documento.
- [x] 1.2 Guardar los nombres de los `it(` de los 15 archivos de test, no sólo el total (`ROADMAP.md` §1.3 punto 7). Verificación: la lista tiene 109 entradas y queda en un archivo para comparar al final.

## 2. Dependencias

- [x] 2.1 Instalar en `apps/web` `three`, `@react-three/fiber@^8.18` y `@types/three` como dependencia de desarrollo (design, decisión 1). Verificación: `npm install` termina **sin ningún aviso de conflicto de peers**, y `apps/web/package.json` declara fiber con el rango `^8.18`, no `^9`.
- [x] 2.2 Comprobar que no ha entrado nada más: ni `@react-three/drei`, ni `blockly`, ni `@react-spring/three` (design, decisión 1). Verificación: `git diff apps/web/package.json` enseña exactamente tres líneas nuevas.
- [x] 2.3 No tocar `package.json` de la raíz ni crear ningún workspace nuevo: el juego vive dentro de `apps/web` (`DISENO-DEL-JUEGO.md` §6). Verificación: `git diff` no incluye el `package.json` de la raíz.

## 3. La escena, en `apps/web/src/game/`

- [x] 3.1 Crear `apps/web/src/game/GameScene.tsx` con `<Canvas>`, una luz y un cubo, exportado como `export const GameScene` (design, decisión 2). Verificación: el archivo compila con `npx tsc --noEmit` desde `apps/web` y es el **único** de `src/` que importa `three` o `@react-three/fiber`, comprobado con una búsqueda sobre `apps/web/src`.
- [x] 3.2 **Sin lógica de juego**: ni rejilla, ni personaje, ni configuración de nivel, ni carga de ningún `.glb` de `apps/web/public/models/`. Verificación: el archivo no menciona ninguna de esas cosas y `git status` no muestra cambios bajo `public/models/`.
- [x] 3.3 Crear `apps/web/src/game/GameSceneLoader.tsx` con `React.lazy` sobre la exportación con nombre y un `Suspense` con su aviso de carga (design, decisiones 2 y 3). Verificación: el archivo **no importa `three` ni `@react-three/fiber`**, ni directa ni indirectamente; su única entrada al juego es el `import()` dinámico.

## 4. La pantalla del banco de pruebas

- [x] 4.1 Crear `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` montando `GameSceneLoader` dentro de un contenedor de **altura fija**, con la cabecera y los tokens del tema como sus hermanas (design, decisión 6). Verificación: la escena se ve; con el padre sin altura `<Canvas>` sale a cero, así que si no se ve, el contenedor es el sospechoso.
- [x] 4.2 Escribir en la propia pantalla que sólo existe en desarrollo y para qué sirve —banco de pruebas del juego hasta el J8— (design, decisión 6). Verificación: el aviso se lee sin abrir el código.
- [x] 4.3 Usar sólo nombres de color del tema y clases ya existentes (`CLAUDE.md`, estilos). Verificación: el archivo no contiene ningún hexadecimal suelto fuera de los iconos SVG, que es como ya lo hacen las demás pantallas del panel.

## 5. La puerta, y sólo en desarrollo

- [x] 5.1 Añadir la ruta del banco de pruebas a `apps/web/src/constants/routes.ts` con la dirección **`/dashboard/game`**, que **NO cuelga de `/dashboard/worlds/`** (design, decisión 4). Verificación: la clave nueva es la única línea que cambia del archivo, la dirección no empieza por `${ROUTES.WORLDS}/` —si colgara de ahí, `Dashboard.tsx` la colapsaría en `ROUTES.WORLDS` antes del `switch` y saldría la pantalla de mundos en vez de un error—, y **no** se añade ninguna ruta de nivel `:levelId`, que es del paso 20 / J8.
- [x] 5.2 Registrar esa ruta en `apps/web/src/router/AppRouter.tsx` **dentro de `import.meta.env.DEV`**, apuntando al `<Dashboard />` como las demás del panel (design, decisión 4). Verificación: en desarrollo la dirección abre la pantalla; sin la bandera cae en el comodín `*` que ya existe. El `<Route>` se cierra con `{import.meta.env.DEV && <Route …/>}` y no va envuelto en nada que no sea un fragmento, que es lo único que `<Routes>` no admite.
- [x] 5.3 Añadir el caso al `switch` de `apps/web/src/pages/Dashboard/Dashboard.tsx`, gobernado por la misma bandera (design, decisión 4). Verificación: `activeRoute` resuelve la ruta nueva y el módulo se monta.
- [x] 5.4 Añadir la entrada de navegación en `apps/web/src/components/dashboard/Sidebar/Sidebar.tsx`, visible **sólo** en desarrollo y señalada como tal (design, decisión 4). Verificación: en desarrollo aparece junto a Mundos, Sala de Trofeos y Salón de clases; el resto de la barra no cambia.
- [x] 5.5 No tocar `PrivateRoute`, `PublicRoute`, `AuthProvider` ni `ClassroomsProvider`. Verificación: `git diff` no los incluye.

## 6. La carga diferida, comprobada en el build

Es la mitad del criterio de aceptación del J1 (`ROADMAP-JUEGO.md` §4).

- [x] 6.1 `npm run build` y comparar contra la cifra guardada en 1.1. Verificación: aparece **un trozo aparte** con el motor 3D, y el principal **no crece más que el ayudante de precarga** descrito en `design.md` decisión 5 —del orden de 1 kB—. Si el principal sube cientos de kB, la frontera no está donde debe: revisar qué importa `GameSceneLoader`.
- [x] 6.2 Confirmar que `three` está en el trozo aparte y no en el principal. Verificación: buscar una marca inequívoca de `three` en los archivos de `apps/web/dist/assets/`; sale en el trozo del juego y **no** en el principal.
- [x] 6.3 Comprobar que `apps/web/dist/index.html` **no precarga** el trozo del juego (design, decisión 5, punto 3). Verificación: `index.html` no lleva ninguna etiqueta que pida ese archivo; su nombre aparece dentro del trozo principal sólo como especificador del `import()`. Un `modulepreload` incumpliría el requisito «el código del juego no viaja en la carga inicial» sin que ninguna cifra lo delatara.
- [x] 6.4 Dejar escritas las dos cifras, antes y después, para el informe del paso. Verificación: las dos aparecen en el resumen final, no sólo la de después.

## 7. Ver el cubo

**Es el criterio del J1 y no vale ninguna otra prueba** (`ROADMAP-JUEGO.md` §3).

- [x] 7.1 Levantar el preview con la configuración `codeplay-web` de `.claude/launch.json`, puerto 5173, entrar al panel del niño y abrir el banco de pruebas. Verificación: **se ve el cubo**.
- [x] 7.2 Leer la consola del navegador con la escena montada (design, Risks). Verificación: ni un error. Si se queja de internals de `three`, **bajar `three`** y repetir; **no** subir fiber, que arrastra React 19.
- [x] 7.3 Comprobar que el código del juego llega en su propia petición y sólo al abrir esa pantalla (spec, «El código del juego no viaja en la carga inicial»). Verificación: en el panel de red, recorrer el resto del panel no lo pide, y abrir el banco de pruebas sí.
- [x] 7.4 Guardar una captura de la escena. Verificación: la captura enseña el cubo dentro del panel, con la barra lateral y la superior alrededor.

## 8. Verificación final

- [x] 8.1 `npm run lint`. Verificación: 0 errores y 0 warnings.
- [x] 8.2 `npm run test:run`. Verificación: 109 tests en 15 archivos, **sin tocar ninguno**, y la lista de nombres de 1.2 idéntica. Un total que cuadra puede esconder uno retirado y otro añadido.
- [x] 8.3 `npm run build`. Verificación: termina sin errores, incluido el `tsc` de delante.
- [x] 8.4 `npx openspec validate esqueleto-del-juego --strict`. Verificación: el cambio es válido.

## 9. Documentación

- [x] 9.1 Marcar el **J1 en ✅** en `docs/ROADMAP-JUEGO.md` §3. Verificación: la fila del J1 cambia de estado y ninguna otra se toca.
- [x] 9.2 Actualizar `docs/CONTEXT.md` según el flujo de `CLAUDE.md`: el juego gana su primera entrada de capacidad aplicada, con las rutas reales. Verificación: las rutas que nombra existen en el disco.
- [x] 9.2.1 Añadir `game/` a la tabla de carpetas de `docs/CONTEXT.md` §1.3, la que enumera `components/`, `context/`, `hooks/`… Verificación: `game/` aparece ahí; `openspec/config.yaml` ya lo nombra en su bloque ESTRUCTURA y CONTEXT.md era el que faltaba.
- [x] 9.3 Propagar el stack a `openspec/config.yaml`: el bloque STACK todavía no nombra `three` ni `@react-three/fiber`. La ESTRUCTURA ya está al día y no hace falta tocarla. Verificación: `npx openspec doctor` no reporta errores de parseo.
- [x] 9.4 Al preparar el commit, **enumerar las rutas** en `git add` (`CLAUDE.md`, flujo de trabajo punto 4). Verificación: no se usa `git add -A`, y lo que entra al índice es exactamente lo de este cambio.
