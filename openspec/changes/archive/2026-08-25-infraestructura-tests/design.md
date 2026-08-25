## Context

Ver `proposal.md` — Why. Aquí sólo el estado que condiciona el diseño, todo
verificado en el repo:

- **`npm run build` typechequea los tests.** `apps/web/tsconfig.json` declara
  `"include": ["src"]`, y el script `build` es `tsc && vite build`. Cualquier
  archivo de test colocado dentro de `src` pasa por `tsc` con `strict`,
  `noUnusedLocals` y `noUnusedParameters` activos.
- **`npm run lint` corre con `--max-warnings 0`** sobre `.` con `--ext ts,tsx`, y
  `.eslintrc.cjs` declara `env: { browser: true, es2020: true }`. No hay entorno
  de test declarado, así que cualquier global de runner (`describe`, `it`,
  `expect`) sería un `no-undef`.
- **`ClassroomsProvider` no puede renderizarse solo.** Llama a `useAuth()`, y
  tanto `useAuth` como `useClassrooms` lanzan si el contexto es `undefined`
  (`hooks/useAuth.ts:8`).
- **Pero la cadena de auth no toca la red.** `context/AuthContext.ts` importa
  únicamente tipos; quien importa `lib/supabase.ts` es `AuthProvider.tsx`. Y
  `config/env.ts` **lanza al importarse** si faltan las variables de entorno.
  Mientras los tests no importen `AuthProvider`, no hay nada que enchufar.
- **El estado inicial se lee una sola vez.** `useState(() => readPersistedState() ?? …)`
  sólo consulta `localStorage` en el primer render, así que sembrar el
  almacenamiento después de montar no tiene efecto.
- **Hay identificadores derivados del reloj.** `buildGroup()` y `requestJoin()`
  construyen ids con `Date.now().toString(36)`, y `generatePublicId()` usa
  `Math.random()`.

## Goals / Non-Goals

**Goals:**

- Tener un runner que se ejecute en un comando y sin configuración duplicada.
- Fijar el comportamiento observable de `ClassroomsProvider` **a través de
  `useClassrooms()`**, que es la superficie que P3 promete no cambiar.
- Que `npm run lint` y `npm run build` sigan pasando con los tests dentro.

**Non-Goals:**

- Cobertura como objetivo o umbral. Este cambio no fija ninguna métrica.
- Tests de las vistas (`StudentClassroomModule`, `TeacherGroupDetailModule`…),
  de rutas o de servicios de Supabase. Sólo store y funciones puras.
- Corregir nada de lo que los tests descubran. Si aparece un fallo, se anota en
  las tareas y se decide aparte; este cambio congela el comportamiento de hoy.
- Tests end-to-end o navegador real. No entra Playwright.

## Decisions

### 1. Vitest sobre Jest

Vitest reutiliza `apps/web/vite.config.ts` tal cual: el alias `@ → ./src`, el
plugin de React y la resolución de ESM ya están resueltos. Jest exigiría duplicar
esa configuración y añadir una capa de transformación (`babel-jest` o `ts-jest`)
para TSX y para `import.meta.env`, que el código usa en `config/env.ts`.

**Restricción de versión:** Vitest comparte el motor de Vite del proyecto, hoy
**5.4**. Hay que instalar la línea de Vitest compatible con Vite 5, no la última
sin mirar. La tarea de instalación lo verifica antes de seguir.

### 2. El bloque `test` vive en `vite.config.ts`, no en un `vitest.config.ts` aparte

Un `vitest.config.ts` separado no hereda plugins ni alias: habría que replicar el
alias `@` y el plugin de React, y quedarían dos sitios que se desincronizan en
silencio. Se cambia `apps/web/vite.config.ts` para que importe `defineConfig` de
`vitest/config` (superset del de `vite`) y añada el bloque `test`. El build de
producción no se ve afectado.

### 3. `globals: false`: los tests importan `describe`/`it`/`expect` de `vitest`

Con `globals: true` habría que declarar el entorno en ESLint y añadir
`"types": ["vitest/globals"]` al tsconfig, es decir, tocar dos configuraciones
compartidas para ahorrar una línea de import por archivo. Con imports explícitos,
lint y tsc funcionan sin cambios. Coincide además con el estilo del repo, que no
usa globals implícitos en ninguna parte.

### 4. El contexto de auth se falsea con el `AuthContext` real, sin `vi.mock`

Los tests envuelven el provider en `<AuthContext.Provider value={…}>` con un
objeto que cumple `AuthContextValue`. Como `AuthContext.ts` sólo importa tipos,
esto **no** arrastra `lib/supabase.ts` ni `config/env.ts`, y no hace falta ni
`vi.mock` ni variables de entorno de test.

Alternativa descartada: `vi.mock('../hooks/useAuth')`. Es más frágil —se rompe si
cambia la ruta del import— y esconde qué valor recibe el provider. Se descarta
también montar el `AuthProvider` de verdad: arrastraría el cliente de Supabase a
la suite entera.

El helper que monta esto (`renderClassrooms`) es el único punto que sabe de esta
estructura. Si P3 cambia las dependencias del provider, se toca ahí y no en
veinte tests.

### 5. Las aserciones van contra `useClassrooms()`, no contra el estado interno

Esta es la decisión que afecta a la frontera del store, y es la cara de este
diseño. `docs/CONTEXT.md` §4.3 fija que `ClassroomsProvider` es el único archivo
que cambia de raíz en P3 **porque todo el mundo lo consume vía
`useClassrooms()`**. Los tests se colocan del mismo lado de esa frontera que los
componentes: montan el provider, leen el contexto por el hook y actúan por sus
acciones. Un test escrito así sobrevive al refactor de P3 sin tocarse, que es
justo lo que se le pide a una red de seguridad puesta antes del refactor.

Lo contrario —exportar internos del provider para poder inspeccionarlos— haría
que los tests fueran el segundo consumidor privilegiado del store, y la frontera
dejaría de tener un solo lado. No se exporta nada nuevo.

### 6. Las aserciones sobre `localStorage` se aíslan y se marcan como mortales

Tres requisitos vivos de `openspec/specs/store-salones/spec.md` —persistencia
versionada, resiembra por versión distinta y resiembra por contenido corrupto—
sólo se pueden comprobar mirando el almacenamiento: son *sobre* el
almacenamiento. Esos tests tienen que sembrar y leer `localStorage`
directamente, con la clave `codeplay:classrooms` y `version: 1` escritas a mano,
porque el provider no las exporta y **no se van a exportar sólo para un test**.

La regla del repo dice que ningún *componente* lea el almacenamiento; un test que
verifica el contrato de persistencia no es un componente y no cruza esa frontera.
Pero sí queda acoplado a un detalle que P3 elimina. Por eso van en un `describe`
propio, «Persistencia en localStorage», con un comentario que diga que P3 los
sustituye por sus equivalentes contra Supabase o los borra. El resto de la suite
—la mayoría— no menciona `localStorage` en ninguna línea.

### 7. El reloj y el azar se congelan sólo donde el aserto lo exige

`vi.useFakeTimers()` + `vi.setSystemTime()` en los tests de `formatRelativeTime()`
y `formatLastActivity()`, que comparan contra `Date.now()`. Para
`generatePublicId()`, en vez de mockear `Math.random()` se comprueba la propiedad
que importa —que el id generado no colisiona con los existentes— pasando una
lista que ocupe parte del espacio y verificando el formato `CP-XXXX`. Mockear el
azar verificaría el mock; la propiedad verifica la función.

### 8. Tests colocados junto al archivo que prueban

`classroomsData.test.ts` junto a `classroomsData.ts`, `ClassroomsProvider.test.tsx`
junto a `ClassroomsProvider.tsx`. El repo no tiene ninguna carpeta `__tests__` ni
espejo de `src`, y la colocación evita inventar una convención nueva. Excepción:
`src/test/setup.ts`, que es infraestructura y no prueba ningún archivo concreto.

### 9. Se renderiza bajo `<StrictMode>`

`store-salones` tiene un requisito explícito sobre el doble disparo de los
actualizadores en StrictMode, y es un fallo que ya se corrigió una vez. Montar la
suite bajo `StrictMode` lo cubre en todos los tests en vez de en uno dedicado: si
alguien vuelve a meter un `Date.now()` dentro de un actualizador, los asertos de
identidad fallan solos.

## Risks / Trade-offs

- **Los tests entran en `npm run build` y pueden romperlo** → Es el riesgo
  principal, porque hoy pasa limpio. Se mitiga con las decisiones 3 y 4 (sin
  globals, sin tipos nuevos en el tsconfig) y con una tarea final que ejecuta
  `lint` y `build` de verdad. Si aun así molestara, la salida es añadir un
  `tsconfig.test.json`, pero **no** excluir los tests del typecheck: perderían la
  garantía de que compilan con el mismo `strict` que el resto.
- **La suite se acopla a `localStorage`, que P3 borra** → Acotado a un `describe`
  marcado (decisión 6). Se acepta a sabiendas: son requisitos vigentes hoy y
  merecen cobertura mientras lo sean.
- **`renderClassrooms` se rompe si P3 cambia las dependencias del provider** →
  Es un único helper, y que se rompa es señal útil: significa que el refactor
  cambió las dependencias del store, que es justo lo que hay que revisar.
- **Un test puede descubrir un fallo real y tentar a arreglarlo aquí** → El
  Non-Goal lo prohíbe. Lo esperable es que salte lo ya anotado en
  `docs/CONTEXT.md` §3 P3: `requestJoin()` no comprueba la pertenencia actual. El
  test debe **documentar el comportamiento de hoy**, no el deseado, y dejar
  constancia con un comentario que apunte a esa tarea.
- **`node_modules` crece con jsdom y Testing Library** → Sólo `devDependencies`;
  el bundle de producción no cambia.

## Migration Plan

No aplica: no hay datos que migrar, nada desplegado que revertir y ningún archivo
de producción modificado. Retroceder es revertir el commit y desinstalar las
dependencias.
