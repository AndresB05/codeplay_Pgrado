## Context

Ver `proposal.md` — Why. Lo que hace falta saber aquí es el estado medido del
repositorio, no el motivo:

- **React 18.3.1**, y ningún plan de subir a 19. `@react-three/fiber` 9 exige
  React ≥ 19 en sus `peerDependencies`.
- **El build sale hoy en un solo trozo**: 623,18 kB (166,96 kB gzip), 177
  módulos, con el aviso de Vite de que se pasa de 500 kB. **No hay ni un
  `import()` dinámico en `apps/web/src`**, así que este cambio abre el primero.
- **`apps/web/tsconfig.json` declara `include: ["src"]` y `strict`**, y
  `npm run build` es `tsc && vite build`: un tipo que falte rompe el build, no
  sólo el editor.
- **El panel del niño monta sus pantallas por un `switch`** sobre la ruta activa
  en `pages/Dashboard/Dashboard.tsx`, no por un `<Route>` por módulo. Las rutas
  del panel se declaran en `router/AppRouter.tsx` apuntando todas al mismo
  `<Dashboard />`.
- **El precedente de «sólo en desarrollo» ya existe**: el bloque «Sin login» de
  `components/home/Navbar.tsx` va envuelto en `import.meta.env.DEV ? (…) : null`
  y `context/guest.helpers.ts` cierra sus funciones con la misma bandera.

## Goals / Non-Goals

**Goals:**

- Que la frontera de carga diferida quede puesta **con la primera dependencia**,
  no encima de código de juego ya escrito.
- Que **un solo módulo** importe `three`, para que mover esa frontera más
  adelante cueste tocar un archivo.
- Que la pantalla que se monta hoy sirva de banco de pruebas hasta el J8, sin
  rehacerla en cada paso.

**Non-Goals:**

- **No se elige el formato de `config` ni de `program`.** Es el J3, y el
  contrato manda que se decida ahí y no sobre la marcha.
- **No se decide cómo se verá el juego.** Cámara, luces, encaje con el tema
  selva y modelos son J7.4, J12.4 y J12.8, detrás de lo funcional.
- **No se fija el tamaño de paso de la rejilla.** Es la constante 1,0 y entra en
  el J2; aquí no hay rejilla.

## Decisions

### 1. `three` ^0.170 + `@types/three` ^0.170 + `@react-three/fiber` ^8.18

> **Corregido al implementar, y es el riesgo de esta ficha materializándose.** Se
> instaló primero `three` ^0.185, que era lo medido: typecheca limpio y `npm`
> no levanta ningún conflicto. **Pero no dibuja.** Con fiber 8.18.0 contra three
> 0.185.1 el lienzo se crea con su contexto WebGL vivo y del tamaño correcto, y
> la escena sale vacía; el único indicio en consola es
> `THREE.Clock: This module has been deprecated`, o sea fiber llamando a una API
> que three ya retiró de hecho. Se aplicó el remedio que esta ficha ya tenía
> escrito —**bajar `three`, nunca subir fiber**— y con **0.170.0** el cubo se ve.
>
> Y hubo una trampa por el camino que conviene dejar anotada: bajar `three` en el
> workspace dejó **dos copias** —0.185.1 izada en la raíz para fiber, 0.170.0 en
> `apps/web` para el código propio—, porque el lockfile tenía grabada la 0.185.1
> como peer de fiber. Dos copias de `three` son peores que cualquiera de las dos.
> Se resolvió restaurando el lockfile desde HEAD y reinstalando, no regenerándolo:
> **regenerar `package-lock.json` en Windows se lleva por delante los binarios
> opcionales de otras plataformas** —los `@supabase/cli-linux-*`—, y el CI corre
> `npm ci` sobre ubuntu-latest.

`@types/three` **no es opcional**: `three` no publica tipos propios, tampoco en
la 0.185, y sin ese paquete el `tsc` de `npm run build` falla. Es una
dependencia de desarrollo, no de ejecución.

Fiber se fija a `^8.18` porque la 9 exige React ≥ 19. **La alternativa —subir el
repositorio a React 19— se descarta**: arrastraría `react-dom`, `@types/react`,
`@types/react-dom`, Testing Library y los 109 tests, no está en ningún roadmap y
nada de este paso lo necesita. La decisión ya está tomada y escrita en
`DISENO-DEL-JUEGO.md` §5; aquí sólo se ejecuta.

Medido antes de proponer: la combinación three 0.185.1 + @types/three 0.185.4 +
fiber 8.18.0 sobre React 18.3.1 typechequea limpia contra el `tsconfig.json` de
`apps/web` con un componente real, y `npm install` no levanta ningún conflicto
de `peerDependencies`. **Lo que ese typecheck no cubría era el runtime**, y ahí
es donde falló: ver el aviso de arriba. La pareja que dibuja es
three 0.170.0 + @types/three 0.170.0 + fiber 8.18.0, verificada en el navegador.

**Y nada más.** `drei`, Blockly y `@react-spring/three` entran en el paso que
primero las importe (`DISENO-DEL-JUEGO.md` §5).

### 2. Dos módulos en `game/`, y el reparto no es cosmético

| Módulo | Qué importa | Por qué separado |
| --- | --- | --- |
| `game/GameScene.tsx` | `three` y `@react-three/fiber` | Es **el único** que los importa. Todo lo que se le cuelgue viaja en el trozo aparte |
| `game/GameSceneLoader.tsx` | `react` y nada más | Es la frontera. Si importara la escena de forma estática, no habría separación que valiera |

Juntar los dos en un archivo **anula el cambio entero**: quien importe el
cargador se llevaría el motor 3D con él, que es exactamente lo que este paso
existe para evitar.

### 3. `React.lazy` sobre una exportación con nombre

El repositorio prohíbe `export default` y `React.lazy` exige un módulo que lo
tenga. Se resuelve en la propia promesa, sin excepción a la convención:

    lazy(() => import('./GameScene').then((module) => ({ default: module.GameScene })))

**Alternativa descartada:** darle a `GameScene.tsx` un `export default` sólo para
que `lazy` esté contento. Sería la primera excepción a una convención que hoy no
tiene ninguna, y a cambio de tres palabras.

### 4. La bandera de desarrollo va en la entrada, no en la escena

`import.meta.env.DEV` gobierna **tres sitios**, todos de acceso: el registro de
la ruta en `router/AppRouter.tsx`, la entrada de navegación en
`components/dashboard/Sidebar/Sidebar.tsx`, y el caso del `switch` de
`pages/Dashboard/Dashboard.tsx`. En producción no hay enlace, y escribir la
dirección cae en el comodín `*` que ya existe.

**La dirección es `/dashboard/game`, y NO puede colgar de `/dashboard/worlds/`.**
`Dashboard.tsx` colapsa `location.pathname.startsWith(`${ROUTES.WORLDS}/`)` en
`ROUTES.WORLDS` **antes** del `switch`, así que una ruta bajo ese prefijo no
llegaría nunca al caso nuevo. Y el síntoma no sería un error: saldría la
pantalla de mundos, que es de las averías que más tardan en diagnosticarse.

Dentro de `<Routes>`, la ruta se cierra con `{import.meta.env.DEV && <Route …/>}`:
React Router ignora el `false`, y lo que no admite es que un `<Route>` vaya
envuelto en cualquier otra cosa que no sea un fragmento.

**No se gobierna con la bandera el interior de `game/`.** Ese código no es de
desarrollo: es el juego, y en el J8 lo monta la pantalla de nivel de verdad. Lo
provisional es la puerta, no la habitación.

### 5. Qué le hace la carga diferida al bundle, medido y no supuesto

Antes de proponer se montó una sonda —un `lazy` con su `import()` dinámico
detrás de una bandera `DEV`— y se compiló. Resultado:

| | Trozo principal | Trozos | Módulos |
| --- | --- | --- | --- |
| Línea de partida | 623,18 kB (166,96 gzip) | 1 | 177 |
| Con la sonda | 624,33 kB (167,59 gzip) | 2 | 180 |

Dos cosas que conviene tener escritas, porque las dos son contraintuitivas:

1. **El trozo principal crece ~1,15 kB, y crecería igual con cualquier frontera
   diferida.** Es el ayudante de precarga que Vite añade al aparecer el primer
   `import()` dinámico del proyecto, y se paga una sola vez para todo el
   repositorio. **No es motor 3D**: de eso, cero bytes en el principal, que es lo
   que este paso tiene que conseguir.
2. **El trozo aparte se emite también en la compilación de producción**, aunque
   allí la pantalla no exista. Rollup trata la llamada a `lazy()` en el cuerpo
   del módulo como un efecto, así que no descarta el cargador aunque su único
   uso quede en una rama muerta.
3. **Y nadie lo pide.** `index.html` **no precarga** el trozo diferido: su
   nombre aparece dentro del trozo principal porque es el especificador del
   `import()`, pero no hay ninguna etiqueta que lo descargue. Es la prueba que
   le faltaba al requisito «el código del juego no viaja en la carga inicial»:
   se cumple **también en producción**, donde la pantalla no existe pero el
   trozo sí. Sin esta comprobación, un `modulepreload` habría dejado el
   requisito incumplido sin que ninguna cifra lo delatara.

Lo segundo tiene una consecuencia que se acepta a sabiendas: **hasta el J8, la
compilación de producción incluye un trozo con el motor 3D que nadie puede
descargar**, porque ninguna pantalla lo pide. Se acepta por dos motivos. Uno,
que es lo que hace que la separación **se pueda comprobar en cada build** en vez
de fiarse de que funcione; el criterio de aceptación del J1 es precisamente ver
las dos cifras. Y dos, que el proyecto **todavía no se despliega** —eso es el
paso 27 del roadmap principal—, así que el coste hoy es un archivo en `dist/`,
no ancho de banda de nadie. En el J8 la pantalla de nivel lo pide de verdad y el
trozo deja de ser inalcanzable.

**Alternativa descartada:** marcar la llamada como pura —`/* @__PURE__ */`— para
que Rollup se lleve el cargador entero en producción. Deja el `dist/` más
limpio, y a cambio **la compilación de producción deja de emitir el trozo del
juego**, que es justo la prueba que se quiere ver. Comprar limpieza en un `dist/`
que nadie despliega a cambio de perder la verificación es mal cambio.

### 6. La pantalla: una tarjeta con la escena y un aviso de que es de desarrollo

`components/dashboard/student/StudentGameLabModule.tsx`, con la estructura de sus
hermanas —cabecera en `.card`, `title-xl`, `subtitle`— y los tokens del tema. La
escena vive en un contenedor de **altura fija**: `<Canvas>` se ajusta a su padre,
y un padre sin altura lo deja en cero.

Lleva escrito en pantalla que sólo existe en desarrollo. No es adorno: la
pantalla va a estar meses ahí y quien la abra tiene que saber que no es una
pantalla del producto.

### 7. Ningún test

**No se escribe ninguno**, y no por falta de ganas: jsdom no implementa WebGL,
así que un test que monte `<Canvas>` no probaría la escena. O falla al pedir el
contexto gráfico, o pasa contra un simulacro que confirma que el simulacro
funciona.

Lo que sí se comprueba es que los **109 tests de 15 archivos siguen pasando sin
tocarlos**, comparados por los nombres de los `it(` y no por el total
(`ROADMAP.md` §1.3 punto 7). El criterio de aceptación del J1 es ver el cubo en
el navegador, y eso se verifica abriendo el navegador.

## Risks / Trade-offs

**Fiber 8 contra un `three` de 2026** → Es lo único de este paso que no está
medido: el typecheck sí, el runtime no. Fiber 8 es la rama que quedó en React 18
y `three` sigue publicando. Si la escena sale en negro o la consola se queja de
internals de `three`, **se baja `three`** hasta que la pareja se entienda. **No
se sube fiber**, que es lo que arrastraría React 19.

**El trozo inalcanzable en producción** → Descrito y aceptado en la decisión 5.
Se cierra solo en el J8.

**La pantalla de pruebas sobreviviendo más de la cuenta** → Es el banco de
pruebas de la fase A entera, así que tiene que durar hasta el J8; el riesgo es
que dure **después**. Queda anotado aquí: cuando el J8 monte la pantalla de
nivel real, esta pantalla se revisa, y si no aporta nada que aquélla no dé, se
retira.

**El aviso de los 500 kB no desaparece** → El trozo principal sigue en 623 kB y
Vite seguirá avisando. Bajarlo de ahí no es este paso: es el resto de la
aplicación, no el juego.

## Migration Plan

No hay migración: no se toca la base de datos y no hace falta ningún `db push`.
Revertir el cambio es quitar las tres dependencias y borrar los archivos nuevos;
nada de lo que existía cambia de forma que haya que deshacer.
