# CodePlay — Contexto y especificaciones

> **Fuente de verdad del estado del proyecto.** Este archivo se mantiene
> sincronizado entre sesiones de Claude Code y OpenSpec.
> Última verificación contra el código: **2 de septiembre de 2026**.

---

## 0. Cómo usar este documento

### 0.1 Relación con los demás documentos

| Documento | Qué contiene | Cuándo leerlo |
| --- | --- | --- |
| [`CLAUDE.md`](../CLAUDE.md) | Punteros y reglas mínimas. Claude Code lo carga solo al empezar cada sesión | Automático — mantenerlo delgado |
| **`docs/CONTEXT.md`** (este) | Qué está aplicado, qué falta, con qué prioridad y bajo qué convenciones | Siempre, al empezar una sesión |
| [`docs/ESTADO-DEL-PROYECTO.md`](ESTADO-DEL-PROYECTO.md) | **Guía de estilos completa** (paleta, tipografía, componentes, espaciado) y los flujos de usuario en detalle | Al tocar UI o al implementar un flujo de salones |
| [`docs/DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) | Qué es el juego, cómo se juega y cómo se puntúa. Fuente de verdad del diseño desde el 3-sep-2026 | Al construir el juego, o al tocar el modelo de XP |
| [`docs/ROADMAP-JUEGO.md`](ROADMAP-JUEGO.md) | En qué orden se construye el juego, en cuatro fases | Al empezar cualquier paso del juego |
| [`docs/CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) | Qué debe cumplir el juego para integrarse y qué le garantiza la plataforma. **Es el único documento del proyecto escrito para quien NO conoce este repositorio**: se sostiene solo y no remite a ningún otro | Al construir el juego, o al implementar el puente del lado web |
| [`README.md`](../README.md) | Puesta en marcha, comandos y convenciones de integración del juego | Al configurar el entorno |
| [`supabase/README.md`](../supabase/README.md) | Detalle migración por migración del esquema SQL | Al tocar la base de datos |
| [`openspec/config.yaml`](../openspec/config.yaml) | Versión resumida de §1 que OpenSpec inyecta a la IA al crear artefactos | Al cambiar stack, convenciones o prioridades — **hay que actualizarlo a la vez que este documento** |

`ESTADO-DEL-PROYECTO.md` **no se elimina ni se reemplaza**: sigue siendo la
referencia larga de diseño visual y de flujos. Este documento es la capa de
especificaciones y prioridades. Cuando ambos se contradigan, **manda este**, que
es el verificado más recientemente — las discrepancias detectadas están anotadas
en §5.

### 0.2 Mapeo a OpenSpec

OpenSpec **ya está inicializado**, versión **1.10.0**, esquema `spec-driven`
(artefactos: proposal → specs → design → tasks).

`openspec init` no crea ningún `project.md` ni `AGENTS.md`. Lo que dejó es:

| Ruta | Qué es |
| --- | --- |
| `openspec/config.yaml` | Configuración y **contexto del proyecto**, que OpenSpec inyecta a la IA al crear artefactos |
| `.claude/commands/opsx/` | Comandos `/opsx:propose`, `apply`, `archive`, `explore`, `sync`, `update` |
| `.claude/skills/openspec-*/` | Las skills que ejecutan esos comandos |

#### Cómo se reparte este documento

| Sección | Destino en OpenSpec | Estado |
| --- | --- | --- |
| §1 Contexto general | Clave `context:` de `openspec/config.yaml` (versión resumida) | ✅ **Integrado** |
| §1.4 Convenciones | Claves `rules:` y `operations:` de `config.yaml` | ✅ **Integrado** |
| §2 Especificaciones aplicadas | `openspec/specs/<capability>/spec.md` — 8 capacidades. El recuento de requisitos ya no se escribe aquí: caducaba en cada cambio y llegó a decir 40 cuando eran 71. El vivo lo da `npx openspec list --specs` | ✅ **Sembrado** |
| §3 Especificaciones por aplicar | `openspec/changes/<id>/` vía `/opsx:propose` | ⛔ Pendiente |

A partir de aquí, **`openspec/specs/` es la verdad sobre el comportamiento** y §2
queda como su lectura en prosa. Si ambos se contradicen, manda el spec.

Los identificadores de capacidad de §2 (`sistema-visual`, `auth-sesion`,
`salones-tutor`, …) y los de §3 (`backend-supabase-real`, `auth-real`, …) están
elegidos para usarse tal cual como `<capability-path>` en OpenSpec.

#### Formato que exige la versión 1.10.0

Los **specs principales** (`openspec/specs/<capability>/spec.md`) nunca llevan
encabezados de operación; todos sus requisitos van bajo un único `## Requirements`:

```markdown
# <capability> Specification

## Purpose
Para qué existe esta capacidad.

## Requirements

### Requirement: Nombre del requisito
El sistema SHALL hacer algo concreto.

#### Scenario: Caso básico
- **WHEN** ocurre una condición
- **THEN** el sistema responde así
```

Los **deltas** (dentro de `openspec/changes/<id>/specs/<capability>/spec.md`) sí
usan `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`
y `## RENAMED Requirements`. Un cambio sin deltas (refactor puro, tooling, docs)
necesita `skip_specs: true` en su `.openspec.yaml` o `openspec validate` lo rechaza.

**Convención de idioma acordada:** los identificadores de OpenSpec van en inglés
—`### Requirement:`, `#### Scenario:`, y las palabras clave SHALL, WHEN, THEN—
porque son parte del formato que la herramienta valida. El texto de requisitos y
escenarios va en español, como el resto de la documentación. Esta regla está
escrita en `config.yaml` bajo `rules.specs`.

#### Comprobaciones útiles

```bash
npx openspec doctor
```

| Comando | Para qué |
| --- | --- |
| `npx openspec doctor` | Verifica la raíz y que `config.yaml` parsea |
| `npx openspec list --specs` | Lista las capacidades registradas |
| `npx openspec validate --specs` | Valida los specs principales |
| `npx openspec view` | Panel interactivo de specs y cambios |

### 0.3 Reglas de mantenimiento

1. Al terminar un cambio, actualiza este documento según lo que el cambio sea:
   - **Afecta a una capacidad del producto** → **mueve la entrada de §3 a §2**
     con la ruta real de los archivos.
   - **Herramienta, documentación o limpieza** → **no toca §2 ni §3**. Esas dos
     secciones son el mapa de las prioridades P1-P6 y un cambio de herramienta
     no sale de ahí; meterlo inventa una capacidad que no existe. Propaga lo
     que corresponda a §1 (stack, estructura o convenciones) y aplica la regla
     4. La infraestructura de tests de Vitest es el ejemplo: vive en §1.2, §1.3
     y §5, y en ningún punto de §2.
2. No des nada por hecho: si algo no se ha verificado ejecutando el código,
   márcalo como no verificado en vez de suponerlo.
3. Actualiza la fecha de «Última verificación» sólo cuando se hayan vuelto a
   correr `npm run build` y `npm run lint`.
4. Si cambias §1 —stack, estructura, convenciones o prioridades—, **replica el
   cambio en `openspec/config.yaml`**. Es el único punto de duplicación
   deliberada del proyecto: aquí vive la versión larga para personas, allí la
   resumida que consume OpenSpec. Comprueba con `npx openspec doctor` que el
   YAML sigue parseando.

---

## 1. Contexto general del proyecto

### 1.1 Qué es

CodePlay es una plataforma web para enseñar pensamiento computacional a niños.
Es un **proyecto de grado**. Consta de tres piezas: un front-end en React, un
backend en Supabase y un juego 3D en el navegador. **Desde el 3-sep-2026 el
juego NO se hace con Unity**: se construye con librerías de JavaScript dentro de
la propia aplicación web. Ver `docs/DISENO-DEL-JUEGO.md`.

**Punto de partida imprescindible:** el backend **está conectado**. El esquema
vive en un proyecto real de Supabase, los salones dejaron de estar en
`localStorage` en el paso 10, y desde el paso 12 el acceso y el registro son
reales: cada rol entra al panel que le corresponde según el perfil que devuelve
el servidor. Lo que queda por conectar es el progreso del niño, que llega con el
juego. La sesión de invitado sobrevive **sólo en desarrollo** y sólo como atajo.

### 1.2 Stack

Entorno de referencia: **Node.js 22.17.1**, **npm 10.9.2** (`engines` exige `>=18.18`).

| Capa | Herramienta | Versión |
| --- | --- | --- |
| Interfaz | `react` / `react-dom` | 18.3.1 |
| Enrutado | `react-router-dom` | 6.30.6 |
| Tipado | `typescript` | 5.9.3 (modo estricto) |
| Build | `vite` + `@vitejs/plugin-react` | 5.4.21 / 4.7.0 |
| Estilos | `tailwindcss` + `postcss` + `autoprefixer` | 3.4.19 |
| Juego 3D | `three` + `@react-three/fiber` + `@react-three/drei` | 0.170.0 / 8.18.0 / 9.122.0 |
| Backend | `@supabase/supabase-js` | 2.112.3 |
| Validación | `zod` | 3.25.76 |
| Calidad | `eslint` 8.57.1 (config heredada) + `prettier` 3.9.6 | — |
| Tests | `vitest` + `jsdom` + `@testing-library/react` | 3.2.7 / 30.0.1 / 16.3.2 |
| CI | GitHub Actions (`ubuntu-latest`) | Node fijado a 22.17.1 |

Monorepo con **npm workspaces**, un solo `node_modules` compartido en la raíz.
Sin Turborepo ni Nx: se descartaron por sobredimensionados para dos apps.

`lint`, `test:run` y `build` se ejecutan además en CI en cada push a `main` y
en cada pull request contra `main`. El workflow fija Node 22.17.1 en vez de
heredar la del runner, e instala con `npm ci` para que el `package-lock.json`
mande. Al build se le pasan los valores de relleno de `apps/web/.env.example`:
`.env` no está en el repositorio y sin esas variables el bundle se genera con
`undefined` y revienta al abrirlo.

### 1.3 Estructura de carpetas

```
codeplayPGrado/
├── apps/
│   └── web/                  Front-end (@codeplay/web). El juego vive DENTRO,
│                             en src/game/: decidido el 4-sep-2026, ver
│                             DISENO-DEL-JUEGO.md §6. `apps/game/` no existe y
│                             ya no existirá — no hay Unity.
│                             public/models/ guarda los 482 .glb de Kenney
│                             (5,96 MB, CC0), con su propio README
├── packages/                 Código compartido — vacío (.gitkeep)
├── supabase/
│   └── migrations/           22 migraciones SQL (la siembra vive en la 0012,
│                             no hay seed.sql suelto)
├── docs/                     CONTEXT.md (este), ESTADO-DEL-PROYECTO.md,
│                             ROADMAP.md, ROADMAP-JUEGO.md,
│                             CONTRATO-DE-INTEGRACION.md y DISENO-DEL-JUEGO.md
├── .github/workflows/ci.yml  CI: lint, tests y build en push y pull request
├── .claude/launch.json       Config del preview: npm run dev, puerto 5173
├── package.json              Raíz del monorepo (workspaces + scripts proxy)
├── .eslintrc.cjs             ESLint compartido
├── .prettierrc               Prettier compartido
└── .gitattributes            Fin de línea + reglas de Unity ya inservibles
```

#### Dentro de `apps/web/src`

| Carpeta | Contenido |
| --- | --- |
| `components/dashboard/teacher/` | Panel del tutor (11 archivos) y `classroomsData.ts` (semilla + funciones puras) |
| `components/dashboard/student/` | Módulos del alumno: salón, buscador, mundos, niveles, trofeos, ajustes |
| `components/dashboard/shared/` | Componentes de ambos roles (`ConfirmDialog`, `StatCard`, `StudentRosterTable`, `GroupBadge`) y `groupThemes.ts` |
| `components/decor/` | `JungleDecor.tsx`: SVG decorativos del tema selva |
| `game/` | El juego (J1 en adelante). `GameScene.tsx` es el **único** módulo que importa `three`; `GameSceneLoader.tsx` es la frontera de carga diferida y no importa ninguno de los dos |
| `components/home/` | Navbar, secciones de la landing y `shared.tsx` (contenedores y huecos de mascota) |
| `components/auth/`, `components/ui/` | Formularios de acceso y primitivas antiguas |
| `context/` | `AuthProvider` (Supabase), `ClassroomsProvider` (store local), helpers de rol y de invitado |
| `hooks/` | `useAuth`, `useClassrooms`, `useActiveRole` + hooks de datos (`useWorlds`, `useProgress`, `useAchievements`, `useLeaderboard`, `useProfile`) |
| `services/` | 8 servicios de Supabase, todos con la forma `{ data, error }` |
| `types/` | `classroom.types.ts` es el modelo vivo; `database.types.ts` se **genera** con la CLI (§4.1) |
| `router/` | `AppRouter` + guardas `PrivateRoute` / `PublicRoute` |
| `pages/` | Un componente por pantalla de nivel superior |
| `constants/`, `config/`, `lib/`, `errors/` | Rutas, entorno validado con zod, cliente de Supabase, tipos de error |
| `test/` | Infraestructura de tests: `setup.ts` y `renderClassrooms.tsx` |

### 1.4 Convenciones a respetar

**Idioma.** Código en inglés (identificadores, tipos, nombres de archivo).
Comentarios, documentación y **toda la interfaz** en español.

**Comentarios.** Se explica *por qué*, nunca *qué*. Los tipos de dominio llevan
JSDoc por campo (ver `types/classroom.types.ts`). No añadir comentarios
redundantes: el código de este repo es deliberadamente parco en ellos.

**Componentes.** Función flecha exportada como constante nombrada
(`export const Foo = () => {}`), sin `export default`. Props tipadas con
`interface` o `type` declarado justo encima del componente.

**Servicios.** Todo servicio devuelve `{ data, error }` con `AppError`
(`errors/AppError.ts`, construido con `createAppError.ts`). Nunca lanzan.

**Estilos.** Tailwind con los **nombres de color del tema**, nunca hex sueltos.
Los tokens viven duplicados a propósito en `src/main.css` (variables CSS) y en
`tailwind.config.js` (nombres de Tailwind). Las clases de componente (`.btn`,
`.card`, `.chip`, `.field`) están en `main.css` bajo `@layer components`.
El detalle completo de paleta y tipografía está en `ESTADO-DEL-PROYECTO.md` §2.

**Ilustraciones.** Los SVG decorativos van en `components/decor/`, con
`aria-hidden="true"`, `focusable="false"` y sin capturar el puntero. Contorno de
tinta `#2A1B45` de unos 3 px, relleno saturado y esquinas redondeadas.

**Huecos de mascota.** Los espacios reservados para la ilustración definitiva
(un leopardo) se marcan con contorno discontinuo y **se dejan vacíos a
propósito**: `.mascot-slot` en CSS, o `ImagePlaceholder` de
`components/home/shared.tsx`. No rellenarlos con imágenes genéricas.

**Origen de las imágenes.** Las ilustraciones definitivas —mascota, escenarios,
portadas de mundo— serán **generadas por IA con Higgsfield, a través de su MCP
conectado a Claude**. Decisión tomada, ejecución **aplazada a propósito**: el
foco actual son las funcionalidades, no el apartado gráfico. Ver §3 → P6.
Esto no cambia nada de lo anterior: los adornos SVG de `components/decor/` se
siguen escribiendo a mano (son geometría, no ilustración) y los huecos siguen
vacíos hasta que haya imágenes reales.

**El formato del juego lo fija el contrato, no el código.** `config` y el sobre
del programa están escritos campo por campo en
[`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) §4, decididos en el
J3. `game/level.ts` declara **ese mismo objeto sin traducirlo**: a diferencia de
las filas de la base, que tienen `mapLevelRow` porque una fila y un tipo de
dominio son cosas distintas, `config` viaja entero en un solo hueco `jsonb`. No
inventar una segunda forma ni un traductor — lo que hace falta en la frontera es
validar.

**Store de salones.** Ninguna vista habla con Supabase ni con el almacenamiento
del navegador: todo pasa por `useClassrooms()`. Esa frontera aguantó el cambio
de origen —de `localStorage` a la base— sin tocar más que la espera en cuatro
pantallas, y por eso se mantiene (§4.3).

**El `loading` global de la sesión es para la resolución inicial, y nada más.**
Las dos guardas de ruta sustituyen su subárbol entero por un spinner cuando esa
bandera sube, así que levantarla por un evento que **no cambia quién está
dentro** desmonta lo que haya en curso: formularios a medias y mensajes recién
mostrados. `AuthProvider` compara el **id** del usuario antes de levantarla y
`ClassroomsProvider` depende de `userId`/`userRole`, no del objeto `user`.
Cualquier acción nueva que ocurra **dentro** de una sesión ya resuelta —como las
tres de contraseña— lleva su propio indicador de envío en su pantalla. Ver §2.2
y §2.5.

**Comandos** (desde la raíz):

```bash
npm run dev
```

| Comando | Qué hace | Estado |
| --- | --- | --- |
| `npm run dev` | Vite en el puerto 5173 | ✅ |
| `npm run build` | `tsc && vite build` | ✅ verificado 25-ago-2026 |
| `npm run lint` | ESLint, 0 warnings permitidos | ✅ verificado 25-ago-2026 |
| `npm run test` | Vitest en modo watch | ✅ |
| `npm run test:run` | Vitest, una pasada | ✅ verificado 25-ago-2026 |
| `npm run preview` | Sirve el build de producción | ✅ |
| `npm run format` | Prettier sobre `src` | ✅ |

Para un workspace concreto: `npm run <script> -w @codeplay/web`.
Para instalar sólo en el front: `npm install <paquete> -w @codeplay/web`.

**Variables de entorno.** `apps/web/.env` (plantilla en `.env.example`):
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. `config/env.ts` las valida con
zod **y lanza en tiempo de importación si faltan o son inválidas**, así que la
app no arranca sin ellas. El `.env` local **ya apunta al proyecto real** desde el
paso 6, y desde el 11 lleva además las cuatro `VITE_DEV_*` de las cuentas de
prueba del botón «Sin login»; lo que trae valores de relleno es `.env.example`,
que es lo que consume el workflow de CI.

---

## 2. Especificaciones aplicadas

Estado de cada requisito:

| Símbolo | Significado |
| --- | --- |
| ✅ | Implementado y operativo. Al conectar el backend seguirá funcionando igual |
| 🟡 | La interfaz existe y responde, pero no produce el efecto real |

### 2.1 `sistema-visual` — Sistema de diseño y tema selva

**Propósito.** Dar a toda la plataforma un aspecto tangible e infantil,
inspirado en CodeCombat, CodeMonkey y Scratch, sobre un bioma de selva tropical.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Paleta, tipografías y clases de componente como tokens | ✅ | `src/main.css` + `tailwind.config.js` |
| Botones con relieve inferior sólido (`.btn` + variante de color) | ✅ | `main.css` |
| Tarjetas de pegatina (`.card`, `.card-flat`) | ✅ | `main.css` |
| Etiquetas de estado (`.chip` + variante) | ✅ | `main.css` |
| Campos de formulario (`.field`, `.field-label`) | ✅ | `main.css` |
| **Capa de selva:** colores `jungle` y `papaya`, `.btn-leaf`, `.btn-papaya`, `.chip-leaf`, `.chip-papaya` | ✅ | `main.css` + `tailwind.config.js` |
| **Superficies de selva:** `.jungle-surface` (luz entre hojas) y `.jungle-band` (franja de tierra) | ✅ | `main.css` |
| **Adornos SVG:** `MonsteraLeaf`, `PalmFrond`, `TropicalFlower`, `Toucan`, `VineDivider`, `Canopy`, `LeafCorner` | ✅ | `components/decor/JungleDecor.tsx` |
| Huecos reservados para la mascota (`.mascot-slot`, `ImagePlaceholder`) | ✅ | `main.css`, `components/home/shared.tsx` |
| Identidad visual automática por salón: 6 temas por hash del id | ✅ | `components/dashboard/shared/groupThemes.ts` + `GroupBadge.tsx` |

**Decisiones de diseño**

- Los neutros llevan **tinte violeta deliberado**: el gris apagado haría la
  interfaz menos infantil.
- Las sombras **nunca se difuminan**: siempre desplazamiento vertical sólido
  (`0 8px 0`). Eso es lo que produce el relieve.
- El fondo del `body` no es plano: dos capas superpuestas, el resplandor verde
  del dosel cayendo desde arriba más los lunares de `line`.
- El tema de cada salón se calcula por hash del id y **no se guarda en base de
  datos**: el mismo salón obtiene siempre el mismo tema, sin columna extra.
- Los nombres de color antiguos (`primary`, `secondary`, `tertiary`, `neutral`)
  se conservan en `tailwind.config.js` **a propósito**, para no romper pantallas
  que aún no se han migrado.
- El tucán de `JungleDecor` es **provisional**: ocupa el sitio hasta que exista
  la mascota definitiva (un leopardo), que ya se nombra en el copy del registro
  y que se generará con IA (P6).

**Alcance del tema selva.** Aplicado en: landing completa (héroe, mundos,
tutores, cómo se aprende, pie), login, registro, panel del alumno, panel del
tutor y ambas barras laterales. Ninguna pantalla en uso quedó fuera.

### 2.2 `auth-sesion` — Acceso, sesión y roles

**Propósito.** Distinguir a los dos tipos de usuario —niño (`child`) y tutor
(`tutor`)— y llevar a cada uno a su panel. El rol `tutor` cubre tanto a padres
como a profesores; en la interfaz se etiqueta «Tutor» y el nombre del profesor
se muestra por salón.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Enrutado con guardas por rol | ✅ | `router/AppRouter.tsx`, `PrivateRoute.tsx`, `PublicRoute.tsx` |
| Quien entra en un panel ajeno es devuelto al suyo | ✅ | `PrivateRoute.tsx` + `getHomeRouteForRole()` |
| Rol efectivo unificado (perfil real o invitado) | ✅ | `hooks/useActiveRole.ts` |
| Sesión de invitado, **sólo en desarrollo** (`import.meta.env.DEV`) | ✅ | `context/guest.helpers.ts` |
| Acceso «Sin login» que **autentica de verdad** con cuentas de prueba | ✅ | `guest.helpers.ts` (`getDevCredentials`) + `components/home/Navbar.tsx` |
| Salir cierra también la sesión de Supabase, por los cuatro caminos | ✅ | Las dos barras laterales y las dos pantallas de Ajustes |
| Formularios de login y registro con validación zod | ✅ | `pages/Login/`, `pages/Signup/`, `components/auth/*.schema.ts` |
| Registro por pasos con selección de rol | ✅ | `components/auth/steps/`, `SignupRoleCard.tsx` |
| **Acceso con Google, real y de punta a punta** | ✅ | `pages/AuthCallback/`, `context/oauthRole.helpers.ts`, `services/auth.service.ts`, `services/profile.service.ts` |
| **El rol se fija en el primer registro y no cambia nunca** | ✅ | migración `202606030018` (`is_role_declared` + `set_my_role`) |
| **Registrarse con un correo que ya tiene cuenta avisa en genérico** | ✅ | `auth.service.ts` (`ACCOUNT_ALREADY_EXISTS`) + `pages/Signup/` |
| Sincronización sesión ↔ perfil de Supabase | ✅ | `context/AuthProvider.tsx` |
| **El destino tras entrar lo decide el rol del perfil**, en los tres sitios que autentican | ✅ | `hooks/useRoleHomeRedirect.ts` + `pages/Login/`, `pages/Signup/`, `components/home/Navbar.tsx` |
| Un registro que no abre sesión pide confirmar el correo en vez de fallar mudo | ✅ | `context/AuthProvider.tsx` (`SignUpOutcome`) + `pages/Signup/Signup.tsx` |
| Una sesión sin perfil no da acceso a ningún panel: se cierra y se dice por qué | ✅ | `services/profile.service.ts` (`PROFILE_NOT_FOUND`) + `AuthProvider.tsx` + `router/` |
| **Cambiar la contraseña desde Ajustes**, pidiendo la actual y verificándola contra el servidor | ✅ | `shared/ChangePasswordPanel.tsx` (lo montan las dos pantallas de Ajustes) + `components/auth/ChangePasswordForm.schema.ts` + `authService.changePassword()` |
| **Recuperar la contraseña olvidada**: se pide por correo y se fija desde el enlace | ✅ | `pages/ForgotPassword/`, `pages/ResetPassword/` + `authService.requestPasswordReset()` y `updatePassword()` |
| La pantalla de contraseña nueva exige **sesión y ningún rol** | ✅ | `router/AppRouter.tsx` — `PrivateRoute` sin prop `role` |
| El indicador de carga se reserva a la **resolución inicial** de la sesión | ✅ | `context/AuthProvider.tsx` (comparación de id en `onAuthStateChange`) |
| **Cambiar el propio nombre desde Ajustes**, con las siete superficies al día sin recargar | ✅ | `shared/ChangeNamePanel.tsx` (lo montan las dos pantallas de Ajustes) + `components/auth/fullName.schema.ts` + `AuthProvider.updateFullName()` |

**Decisiones de diseño**

- **EL ROL DEL REGISTRO LO ELIGE EL NAVEGADOR, y es una decisión tomada, no un
  descuido.** `authService.signUp()` envía el rol en los metadatos del alta y el
  disparador de la migración `202606030011` lo lee de ahí, así que cualquiera
  puede llamar a `/auth/v1/signup` con la clave anónima —pública por diseño— y
  darse de alta como `tutor`. Lo que sí está acotado: el disparador sólo acepta
  `child` o `tutor` y degrada cualquier otra cosa a `child` sin abortar el alta
  —comprobado enviando `role: "superadmin"`, el perfil sale `child`—, y el enum
  `user_role` es la última defensa. Y un tutor falso no alcanza a un niño
  cualquiera: el niño busca el salón por su identificador público y solicita
  entrar, así que hace falta que un niño se ofrezca; lo que obtiene es su propio
  salón y, de quien entre, nombre, avatar, XP y racha. **Cerrarlo cuesta**, de
  menos a más: (1) revisión manual —todos se dan de alta `child` y el rol
  `tutor` se concede desde el panel de Supabase, cero código—; (2) **código de
  institución**, que es la opción proporcionada: tabla de códigos, RPC
  `security definer` que asciende el perfil al canjearlo, un campo más en el
  registro, y el disparador deja de leer el rol; (3) dominio de correo
  institucional, que hoy no aplica porque no hay ninguno que poner en la lista.
  **Decidido: se queda así mientras no haya usuarios reales, y la opción 2 es lo
  que hay que implementar antes de que los haya.** Ver el `design.md` del cambio
  `auth-real`.
- **EL ROL SE FIJA EN EL PRIMER REGISTRO Y NO CAMBIA NUNCA (paso 15), y eso NO
  cierra el agujero de arriba: son dos cosas distintas.** La migración 0018 añade
  `profiles.is_role_declared` y hace que `set_my_role` rechace por **dos**
  motivos: si el rol ya se declaró (`ZC001`) o si el perfil tiene **lazos de
  salón** —membresía, solicitud `pending` o salón propio— (`ZC002`). **Lo que
  impide es CAMBIAR de rol. Lo que sigue abierto es registrarse como `tutor` de
  entrada**, que es el agujero de la decisión anterior y que cierra el código de
  institución.
- **Por qué hicieron falta las dos condiciones y no bastaba la marca.** Una
  cuenta creada con el botón de Google de `/login` nace `child` y **sin
  declarar**, y así se queda: si esa persona se une a un salón y meses después va
  a `/signup` y elige «Tutor», la marca sigue en `false` y el ascenso se
  aplicaría. Los lazos cortan a quien **ya construyó algo** con el rol que tiene;
  la marca corta a quien **ya eligió**. Una cuenta recién creada no tiene
  ninguno de los tres lazos, así que su primera declaración legítima sigue
  funcionando: la reja sólo muerde cuando el cambio rompería algo.
- **El daño que motivó la regla está medido, no supuesto.** Un niño con membresía
  en un salón entró con Google desde `/signup` eligiendo «Tutor» y quedó `tutor`:
  **fuera de su propio salón y sin vuelta atrás por la interfaz**, mientras su
  tutor lo seguía viendo listado como alumno. El rol es la reja de
  `class_groups_insert_own` y `join_requests_insert_own`, así que cambiarlo no es
  editar un campo: es dejar una cuenta sin sitio. Con la 0018 aplicada, el mismo
  camino paso por paso **ya no escribe nada** y la cuenta conserva su salón.
- **SUPABASE ENLAZA IDENTIDADES POR CORREO VERIFICADO, y eso no se lee en ninguna
  parte del repositorio.** Entrar con Google con un correo que ya tiene cuenta de
  contraseña **no crea un usuario**: le añade el proveedor al que existe, y la
  fila pasa a mostrar `Email + Google`. Como no hay alta, **el disparador no
  corre**, y por tanto nada vuelve a decidir el rol de esa cuenta. Es el hecho del
  que cuelga toda la regla de arriba.
- **La ruta de vuelta de OAuth no lleva guarda, y es la única ruta del proyecto
  así.** `/auth/callback` resuelve **cuatro** estados: error del proveedor —lo
  muestra—, sin sesión —a `/login`—, rol bloqueado —aviso neutro— y rol por fijar
  —lo aplica y navega—. Una guarda sólo sabe que no hay sesión, y con ese único
  dato **no distingue «el proveedor falló» de «alguien escribió esta
  dirección»**: redirigir en el primer caso descarta el fragmento donde viaja el
  motivo, y el fallo aparece como un regreso mudo a la pantalla de acceso. Eso
  ocurrió de verdad durante el paso, y fue esta pantalla la que dio el
  diagnóstico. `PrivateRoute` y `PublicRoute` **no se tocaron**.
- **La llamada a la RPC se hace SIEMPRE que hay intención de rol, coincida o no
  con el rol actual**, y esto es una corrección de algo que parecía obviamente
  correcto. La primera versión sólo llamaba «si el rol difiere», y como el
  disparador crea todo perfil de Google como `child`, **quien se registraba
  eligiendo «Niño» coincidía y la marca no se ponía nunca**: esa cuenta quedaba
  indistinguible de la de quien sólo pulsó Google en `/login`, y seguía siendo
  promocionable. La regla se incumplía en el camino más común de todos.
  «Hace falta escribir» no es «el rol difiere», es «hay intención y el rol aún no
  está declarado», **y ese segundo dato sólo lo tiene el servidor**. El cliente
  reenvía la intención; el servidor decide.
- **La intención de rol viaja en `localStorage` y se lee borrando.**
  `context/oauthRole.helpers.ts` centraliza su clave como hace `guest.helpers.ts`.
  La función de lectura **borra en la misma llamada**: con `get` y `clear`
  separados, cualquier camino que devuelva antes de la segunda deja una intención
  viva que se aplicaría al viaje siguiente, y en un computador de aula ese viaje
  puede ser el de otra persona. El botón de `/login` además la borra al partir.
- **La asimetría de las dos direcciones la impone la tecnología, no el gusto.**
  Formulario y después Google con el mismo correo: se enlaza, **se abre sesión**,
  y el aviso neutro **sí nombra el rol** —es su propia cuenta y su propia
  sesión—. Google y después el formulario: el registro falla, **no se abre
  sesión**, y el aviso es **genérico y no nombra el rol**, porque quien está
  delante no está identificado. Nombrarlo le diría a un desconocido si detrás de
  ese correo hay un niño o un tutor, que es lo que §2.2 ya decidió evitar en
  `/forgot-password`.
- **`signUp()` con un correo ya registrado responde 422 `user_already_exists`, y
  NO la señal que documenta Supabase.** El `user` con `identities` vacío es la
  respuesta de cuando la confirmación por correo está **encendida**, para no
  revelar que la cuenta existe; aquí está apagada, así que el servidor responde en
  claro. **La detección va por ese código.** Y está medido que **no toca la cuenta
  existente**, ni siquiera una que sólo tenga Google y ninguna contraseña: el
  aviso es sólo un aviso, sin efecto.
- **El diagnóstico del Client Secret, que no es deducible y costó horas.** Si la
  autorización **funciona** —Google enseña su pantalla y devuelve un código— pero
  el **canje** falla con «Unable to exchange external code», el `client_id` está
  probado bueno y **lo único que entra en juego en ese segundo tramo es el
  secreto**: está mal pegado en el panel. Y un correo que falte en la lista de
  usuarios de prueba de Google Cloud recibe «Acceso bloqueado», que también parece
  un fallo del código y tampoco lo es.
- **El invariante del paso 12 se vio ocurrir de verdad, y hasta ahora sólo estaba
  descrito en condicional.** Borrar una cuenta en el panel mientras esa persona
  tiene el portal abierto la saca del portal y la lleva a `/login`: perfil
  ausente, sesión cerrada, guarda. Es correcto y es la respuesta a «¿por qué me
  ha echado?».
- **Sólo la ausencia de perfil cierra la sesión**, nunca otro fallo al cargarlo.
  `profile.service.ts` distingue los dos con el código `PROFILE_NOT_FOUND`
  porque `maybeSingle()` sólo devuelve `null` sin error cuando la fila de verdad
  no existe. Colgar el cierre de la rama común de error echaría a un usuario
  legítimo en un corte de red.
- **Las dos guardas se ajustan a la vez o se produce un bucle.** `PrivateRoute`
  manda a `/login` a quien tenga sesión y no tenga rol; si `PublicRoute`
  apartara a todo el que tiene sesión, lo devolvería a
  `getHomeRouteForRole(null)` —que es `/dashboard/worlds`, ruta de niño— y de ahí
  otra vez a `/login`. Por eso `PublicRoute` exige sesión **y** rol.
- `guest.helpers.ts` **centraliza** las claves de `localStorage` de la sesión de
  invitado; ningún componente las toca directamente.
- La sesión de invitado se apaga sola fuera de desarrollo: `isGuestModeAvailable()`
  comprueba `import.meta.env.DEV`. En producción no hay puerta trasera.
- `useActiveRole()` prioriza el perfil autenticado y cae en el rol de invitado.
  Cuando el login real entre, esta función es el único punto que hay que revisar.
- **El botón «Sin login» ya no simula la sesión: inicia sesión de verdad** con la
  cuenta de prueba del rol pulsado, si hay credenciales en `apps/web/.env`. Sin
  ellas cae en la marca local, para que quien clone el repositorio sin
  configurarlas pueda entrar igual. Un fallo de autenticación **no** cae en el
  invitado: entrar con una sesión simulada dejaría la aplicación aparentando
  funcionar mientras `auth.uid()` sigue vacío.
- El rol con el que se navega es **el del perfil que devuelve el servidor**, no
  el del botón pulsado. Si no coinciden, se ve el desajuste en vez de un rebote
  de `PrivateRoute` sin explicación.
- Las cuatro variables `VITE_DEV_*` **no pasan por `config/env.ts`**: ese módulo
  valida al importarse y se ejecuta también en producción, así que declararlas
  allí metería correo y contraseña en el paquete publicado. Se leen tras
  `import.meta.env.DEV` y como accesos de miembro, nunca copiando
  `import.meta.env`. Comprobado con `grep` sobre `dist/`: cero coincidencias.
- **Los 400 y 403 que aparecen en consola al entrar y salir varias veces son de
  autenticación, no del panel.** Un 400 sale al refrescar un token ya revocado o
  en un `signIn` fallido; un 403, al cerrar sesión cuando ya estaba cerrada. Se
  comprobó con sesión válida que las ocho tablas responden 200, así que **no es
  el panel leyendo Supabase**: es una secuela del ciclo de sesión, y aparece
  justo al probar los cuatro caminos de salida uno detrás de otro. No es un
  fallo que el paso 10 herede.

- **Salir tiene que llamar a `signOut()`, no sólo borrar la marca de invitado.**
  Las dos barras laterales sólo hacían lo segundo, lo que bastaba mientras la
  marca era la única sesión; con sesión real dejaban entrar de vuelta al panel
  escribiendo la dirección, porque `isAuthenticated(session)` seguía siendo
  cierto.

- **El cambio desde Ajustes pide la contraseña actual y la verifica contra el
  servidor.** `supabase.auth.updateUser({ password })` no la exige: la sesión
  abierta le basta. Aquí no basta. Esto son computadores de aula compartidos, y
  quien se siente ante la sesión de un compañero podría cambiarle la contraseña
  y dejarlo fuera de su propia cuenta; la salida que este mismo paso construye
  —el correo de recuperación— es justo la que **un niño puede no tener o no
  controlar**. Así que `authService.changePassword()` llama primero a
  `signInWithPassword` con el correo de la sesión y la contraseña escrita, y
  sólo si esa llamada sale bien llama a `updateUser`. Dos propiedades de esa
  secuencia: la verificación emite una sesión nueva **del mismo usuario**, que
  es inocua, y un `signInWithPassword` fallido **no toca** la sesión ya
  almacenada, así que con la actual equivocada la persona sigue dentro viendo el
  motivo. Por eso la llamada vive en el servicio y no pasa por el `signIn` del
  contexto, que mueve `loading` y `error` globales y trataría un tecleo
  equivocado como un fallo de sesión.
- **Lo que esa comprobación NO cubre.** Protege a quien usa la aplicación, no a
  quien tenga el token de una sesión robada y llame a la API directamente: ése
  se salta la pantalla entera. Eso sólo lo cierra «Secure password change» en el
  panel de Supabase, que hace que el propio servidor exija reautenticación
  reciente. Son capas distintas, y las dos están puestas.
- **«Secure password change» está ENCENDIDO desde el 27-ago-2026, y no hizo
  falta ni una línea de código.** Se comprobó con una cuenta nueva, por la API y
  otra vez desde la pantalla de Ajustes: `updateUser` respondió 200, la pantalla
  confirmó el cambio, la contraseña anterior dejó de entrar y la nueva entra.
  **El servidor no pidió ningún nonce por correo**, que era la duda: la
  reautenticación que hace `changePassword` con `signInWithPassword` emite una
  sesión de segundos, y esa frescura es lo que el servidor acepta. Defensa en
  profundidad gratis, así que el interruptor se queda encendido.
- **El otro camino, `/reset-password`, también está comprobado con el
  interruptor encendido, y no era deducible.** Ése **no** reautentica: llama a
  `updatePassword()` sobre la sesión que abre el enlace del correo, así que
  dependía de que el servidor considerase reciente **esa** sesión, y es
  precisamente el camino de quien se quedó fuera de su cuenta —un error en
  inglés ahí llegaría en el peor momento posible—. Medido de punta a punta con
  la cuenta del correo del dueño del proyecto: el enlace aterrizó en la pantalla
  de contraseña nueva sin rebotar a ningún panel, el cambio se guardó **sin que
  el servidor pidiera nonce**, y después se entró por `/login` con la contraseña
  nueva. Lo verificado es que **la sesión que abre el enlace cuenta como
  reciente**, igual que la que emite `signInWithPassword`.
- **Lo que satisface al servidor es la frescura de la sesión, no el formulario**,
  y de ahí sale la cautela que queda, que sigue sin poder fabricarse para
  medirla: si alguna vez se cambiara la contraseña desde una sesión **ya vieja**
  —sin inicio de sesión ni enlace inmediatamente anteriores—, el servidor podría
  exigir el nonce por correo, y su mensaje llegaría **en inglés**. El correo de
  fábrica no daría para un envío en cada cambio de contraseña, así que si esa
  exigencia apareciera, la respuesta es traducir el mensaje en el servicio o
  apagar el interruptor, nunca implementar el nonce.
- **La única decisión abierta que queda en acceso es la del rol elegido por el
  navegador**, arriba. La de la contraseña actual dejó de estarlo: el paso 13 la
  cierra pidiéndola y verificándola.
- **Un solo panel de cambio de contraseña para las dos pantallas de Ajustes**,
  en `shared/`, donde ya viven `StoreErrorNotice` y `ConfirmDialog`. Los dos
  módulos tienen marcos distintos pero el formulario es la misma función; dos
  copias divergirían al primer arreglo, como pasó con el `signOut` de las dos
  barras laterales. El panel trae su propio botón desplegable, que es el que
  antes estaba muerto. `/reset-password` **no** lo monta: vive fuera del
  dashboard y comparte lo que de verdad se comparte —el esquema de zod y
  `updatePassword()`—, no el marcado.
- **Dos esquemas de zod, una regla compartida.** `changePasswordSchema` pide
  actual + nueva + repetición; `resetPasswordSchema`, sólo las dos nuevas. Quien
  llega por el enlace del correo es exactamente quien no sabe su contraseña:
  pedírsela sería exigirle el dato que vino a recuperar. El mínimo de 6 y la
  igualdad entre las dos nuevas se declaran **una vez** y los usan los dos, para
  no acabar con dos mínimos distintos sin que nadie lo decida.
- **Las dos pantallas nuevas caen en guardas distintas, y ninguna guarda se
  tocó.** `/forgot-password` va tras `PublicRoute`: es para quien no ha entrado,
  y a quien ya tiene sesión y rol lo lleva a su panel, que es correcto —esa
  persona puede cambiarla desde Ajustes—. `/reset-password` va tras
  `PrivateRoute` **sin prop `role`**: el enlace del correo abre una sesión real,
  así que `PublicRoute` apartaría a esa persona a su panel y la pantalla no se
  vería nunca; y declarar un rol rebotaría a la mitad de la gente al panel del
  otro. Sin sesión de ninguna clase, `PrivateRoute` manda a `/login`, que es la
  respuesta correcta: sin el enlace no hay nada que fijar. **Que este caso
  exista es la prueba de que la prop `role` opcional estaba bien puesta**; no es
  código muerto que limpiar.
- **El aviso de la pantalla de recuperación no dice si la dirección tiene
  cuenta.** El texto es el mismo exista o no, como responde Supabase: la
  interfaz no puede ser quien convierta esa pantalla en un comprobador de
  cuentas dadas de alta.
- **La URL de vuelta del correo se construye como la de Google**, con
  `new URL(ROUTES.RESET_PASSWORD, window.location.origin)` y no con una cadena
  escrita a mano, que se desincronizaría de `routes.ts` en cuanto alguien
  renombrara la ruta — y el fallo aparecería **sólo dentro del correo**, que es
  el sitio más caro de depurar del proyecto. Tiene test (`auth.service.test.ts`).
- **`AuthProvider` sigue sin leer `_event`.** El cliente establece la sesión solo
  al detectar los tokens del enlace y `syncSessionProfile()` la recoge como
  cualquier otra, así que distinguir `PASSWORD_RECOVERY` no aportaba nada: el
  `redirectTo` ya deposita a esa persona donde tiene que estar. Lo que sí hereda
  la recuperación es el invariante del paso 12: si la cuenta que abre el enlace
  no tuviera fila en `profiles`, esa sesión se cierra con el mensaje de cuenta
  sin perfil. Es correcto, y es la respuesta a «¿por qué no puedo recuperar esta
  cuenta?» si alguien borra un perfil a mano en el panel.
- **El indicador de carga se blanquea sólo cuando cambia QUIÉN está dentro, y
  eso era un defecto anterior.** Las dos guardas sustituyen su subárbol entero
  por un spinner en cuanto sube `loading`, y el subscriptor de
  `onAuthStateChange` lo subía en **cada** evento, refrescos de token incluidos:
  la aplicación ya se blanqueaba sola cada cierto tiempo, y nadie lo había visto
  porque ningún evento caía en mitad de una interacción. El cambio de contraseña
  es la primera que dura lo suficiente —el panel se desmontaba antes de enseñar
  el resultado—. Hoy el subscriptor compara el **id** del usuario
  (`null→id`, `id→null`, `id→otro`) y sólo entonces levanta la bandera; por
  identidad, `_event` sigue sin leerse. Por lo mismo, **las tres acciones de
  contraseña no tocan el `loading` global**: esa bandera significa «la sesión se
  está resolviendo» y una contraseña se cambia dentro de una sesión ya resuelta.
  Cada pantalla lleva su propio indicador de envío. `PrivateRoute`, `PublicRoute`
  y `TeacherDashboard` no se tocaron: el arreglo está en quien levanta la
  bandera, no en quien reacciona a ella.

#### Estado del panel de Supabase que condiciona el código

Nada de esto se ve leyendo el repositorio, y todo cambia lo que la aplicación
puede hacer. Los tres primeros se leen con la clave anónima en
`GET /auth/v1/settings`; los dos últimos los comprobó el usuario en el panel.

| Ajuste | Estado | Qué implica |
| --- | --- | --- |
| **Confirm email** | **APAGADO** (`mailer_autoconfirm: true`) | Un alta devuelve sesión inmediata. Por eso `/auth/v1/signup` con un correo nuevo **crea la cuenta y no es una sonda de existencia**: preguntar si una cuenta existe se le pide al usuario, que ve el panel |
| **Google** | **`true` desde el 28-ago-2026** | Era la puerta del paso 15 y **ya está abierta**. El usuario dio de alta el cliente en Google Cloud —pantalla de consentimiento externa en modo prueba— y pegó las credenciales. Comprobado, no relatado: `/auth/v1/authorize?provider=google` redirige a Google con `redirect_uri` igual al callback de Supabase y `scope=email profile`, y Google devuelve su pantalla de acceso, no `invalid_client` ni `redirect_uri_mismatch`. Lo que queda es de la aplicación: **la ruta de vuelta todavía no está en Redirect URLs**, porque la decide el paso 15 |
| Altas abiertas | `disable_signup: false` | Cualquiera puede registrarse con la clave anónima; ver arriba la decisión del rol elegido por el navegador |
| **Site URL** | `http://localhost:5173` | Sin él, el enlace del correo no vuelve a la aplicación |
| **Redirect URLs** | `/reset-password`, `/auth/callback` y el comodín `http://localhost:5173/**` | Sin la entrada, Supabase **no da error**: devuelve en silencio al Site URL y el fallo parece del código. **Al desplegar (paso 27) hay que hacer DOS cosas, no una: añadir las del dominio real Y RETIRAR EL COMODÍN.** El comodín enmascara errores de ruta —una vuelta equivocada casa igual— y, con el flujo `implicit` que usa este cliente, sobre el dominio real dejaría que **cualquier** ruta reciba un refresh token en el fragmento de la URL |

#### Quién decide el destino tras autenticarse

**Lo decide `resolveLandingRoute()` en `context/auth.helpers.ts`, y la llaman
tres**: `PublicRoute`, `AuthCallback` y `useRoleHomeRedirect`. Una
implementación y tres puntos de llamada, para que gane quien gane la carrera el
destino sea el mismo.

**Hasta el paso 19 este documento decía que lo resolvía un único hook, y era
falso desde antes.** `PublicRoute` también decidía, y **el hook no gana nunca**:
`useActiveRole()` devuelve `user?.role`, así que el rol llega en el mismo render
que el usuario y la guarda —el padre— devuelve `<Navigate>` sin llegar a
renderizar a su hijo, de modo que el efecto del hook no corre porque el hook ya
no existe. No se notaba porque los tres calculaban el mismo destino; el enlace de
invitación fue lo primero que los hizo discrepar.

**Medido en las dos mitades, no razonado.** El inicio de sesión queda fijado en
`router/PublicRoute.test.tsx`. El **registro** —el único caso donde el hook podría
ganar, porque la sesión llega antes que el perfil y durante esa ventana
`user?.role` es nulo y la guarda no aparta— se midió instrumentando las dos vías
con un log temporal y dando un alta real desde un enlace: **sólo registró
`PublicRoute`**, dos veces por StrictMode, y el hook no navegó ni una vez.

**La llamada del hook parece código muerto y NO lo es.** Es alcanzable sólo por
`/reset-password`, que va tras `PrivateRoute` y donde `PublicRoute` no
interviene. Sin ella, quien abre el enlace del correo con una invitación
pendiente aterriza en su panel y **el token se queda vivo para la siguiente
persona que use ese navegador**.

**`resolveLandingRoute()` es PURA, y tiene que serlo:** `PublicRoute` la llama
durante el render. La primera versión consumía el token allí y el test la tumbó
—StrictMode invoca el render dos veces, así que la primera pasada lo gastaba y la
segunda ya no lo encontraba: el token se consumía **y** la persona acababa en su
panel—. Consume quien llega, no quien decide: el borrado vive en `pages/Invite`,
único destino al que ese token puede llevar.

#### Rutas

| Ruta | Rol | Pantalla |
| --- | --- | --- |
| `/` | Público | Landing |
| `/login`, `/signup` | Público | Acceso y registro |
| `/forgot-password` | Público | Pedir el correo de recuperación |
| `/reset-password` | **Sesión, sin rol** | Fijar la contraseña nueva; es donde aterriza el enlace del correo |
| `/auth/callback` | **Sin guarda** | Vuelta del proveedor de OAuth. Resuelve error, ausencia de sesión, rol bloqueado y rol por fijar |
| `/dashboard`, `/dashboard/worlds` | Alumno | Mundos |
| `/dashboard/worlds/:worldId` | Alumno | Niveles de un mundo |
| `/dashboard/trophies` | Alumno | Sala de trofeos |
| `/dashboard/classroom` | Alumno | Salón / buscador / espera |
| `/dashboard/settings` | Alumno | Ajustes |
| `/teacher` | Tutor | Redirige a `/teacher/groups` |
| `/teacher/groups` | Tutor | Mis salones |
| `/teacher/groups/:groupId` | Tutor | Detalle del salón |
| `/teacher/panel`, `/teacher/panel/:groupId` | Tutor | Panel de información |
| `/teacher/settings` | Tutor | Ajustes de cuenta |

Cualquier otra ruta redirige a `/`. Todas las rutas del alumno montan el mismo
`Dashboard`, que decide el módulo según la URL; lo mismo hace `TeacherDashboard`
con las del tutor.

### 2.3 `salones-tutor` — Gestión de salones (rol tutor)

**Propósito.** Que el tutor cree salones, admita alumnos y siga su progreso.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Listado de salones con métricas agregadas | ✅ | `teacher/TeacherGroupsModule.tsx` |
| Crear salón (nombre, grado, profesor, cupos 1–60) con validación en cliente | ✅ | `teacher/CreateGroupForm.tsx` |
| ID público único por salón (`CP-XXXX`) | ✅ | `generatePublicId()` en `teacher/classroomsData.ts` |
| Detalle del salón con estadísticas | ✅ | `teacher/TeacherGroupDetailModule.tsx` |
| Tabla de seguimiento (mundo, última actividad, racha) | ✅ | `shared/StudentRosterTable.tsx` |
| Eliminar alumno con confirmación en línea | ✅ | `shared/StudentRosterTable.tsx` |
| Eliminar salón con diálogo y recuento de afectados | ✅ | `shared/ConfirmDialog.tsx` |
| Bandeja «Alumnos en espera» | ✅ | `teacher/PendingRequestsSection.tsx` |
| Aceptar o rechazar solicitud; aceptar se bloquea sin cupos | ✅ | `context/ClassroomsProvider.tsx` |
| Reportes de 5 competencias con semáforo de dominio | ✅ | `getSkillReports()` en `classroomsData.ts` |
| Selector de alcance: todos los salones o uno | ✅ | `teacher/TeacherPanelModule.tsx` |
| Asignación de misiones | ✅ | `teacher/TeacherPanelModule.tsx` + `services/missions.service.ts` — persiste en la base y obedece al selector de alcance. La capacidad entera está en §2.8, **incluida la advertencia de que una misión todavía no se puede jugar** |
| Sumar alumnos compartiendo el ID público del salón | ✅ | `teacher/AddStudentsPanel.tsx` |
| Generar un enlace de invitación canjeable, copiarlo y retirarlo | ✅ | `teacher/AddStudentsPanel.tsx` + `services/invitations.service.ts` + `hooks/useInvitations.ts` — paso 19, mitad A |
| Lista de enlaces con sus **tres** estados y purga de los caducados | ✅ | `useInvitations.ts` + `readState()` en `invitations.service.ts` |
| Recursos educativos | 🟡 | Tarjetas informativas sin destino |
| Ajustes de cuenta: salir y cambiar contraseña | ✅ | `teacher/TeacherSettingsModule.tsx` + `shared/ChangePasswordPanel.tsx` — desde el paso 13, ver §2.2 |

**Decisiones de diseño**

- **La invitación por correo se retiró, y no es una funcionalidad aplazada: era
  un dato personal que no debía estar.** `invitations.email` guardaba la
  dirección de **un tercero sin cuenta** —la escribía el tutor, no su dueño, y
  en una plataforma para niños ese tercero puede ser un menor—: nadie la había
  autorizado, a nadie se le había informado, **nada la borraba nunca** —la
  aplicación sólo insertaba, y `expires_at` y `status` no los evaluaba ninguna
  consulta— y encima **la finalidad no se ejecutaba**, porque el envío real es
  el paso 19. La columna se eliminó en la migración `202606030016` y el panel
  pasó a explicar la vía que sí funciona: compartir el ID público. **Si alguien
  quiere «recuperar» el formulario, esto es lo que tiene que resolver antes.**
- **La tabla `invitations` se quedó en pie a propósito**, sin la columna: el
  token, la caducidad, las tres políticas y la cascada de la 0013 sirven tal
  cual para el paso 19. **Desde el paso 19 ya recibe escrituras**, y sirvieron
  tal cual: no hizo falta añadirle ni una columna.
- **El enlace canjeable NO sustituye al ID público, lo complementa.** El ID
  público es la vía para muchos a la vez —el mismo código sirve para todo un
  curso— y pasa por la bandeja de solicitudes; el enlace es la vía para uno y
  **entra sin pasar por la bandeja**, porque el tutor ya consintió al generarlo
  y pedirle que apruebe otra vez sería aprobar dos veces lo mismo. Los dos
  conviven en `AddStudentsPanel.tsx`, y **ninguno pide ni guarda una dirección
  de correo**: el envío real sigue sin existir y es la mitad B del paso 19.
- **Los tres estados del enlace se calculan de DOS datos**, `status` y
  `expires_at`, nunca de uno. El panel anterior a `invitaciones-sin-correo`
  pintaba `status === 'pending' ? 'Pendiente' : 'Aceptada'` y una invitación
  caducada habría salido como «Aceptada»; estaba dormido porque nada escribía
  filas. `status` admite `expired` desde la 0013 pero **nada lo escribe ni va a
  escribirlo**, así que la caducidad la decide la fecha.
- `classroomsData.ts` reúne los datos de ejemplo **y las funciones puras de
  cálculo** (`getSkillReports`, `buildGroup`, `generatePublicId`…). Al conectar
  el backend, los datos se van y las funciones puras se quedan.
- Semáforo de dominio de habilidades: ≥ 70 % `lime` (dominado), 45–69 % `sun`
  (en camino), < 45 % `coral` (a reforzar).
- `StudentRosterTable` sólo muestra la columna de acciones si recibe
  `onRemoveStudent`. Así la reutiliza la vista del alumno sin poder borrar a nadie.

### 2.4 `salones-alumno` — Ingreso a un salón (rol niño)

**Propósito.** Que el niño encuentre su salón y entre en él con aprobación del tutor.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Buscador global de salones | ✅ | `student/StudentClassroomSearch.tsx` |
| Búsqueda por nombre (coincidencia parcial) | ✅ | `matchesGroupSearch()` |
| Búsqueda por ID exacto: muestra sólo ese salón | ✅ | `matchesGroupSearch()` + `isExactIdSearch()` |
| Solicitar ingreso | ✅ | `requestJoin()` en `ClassroomsProvider.tsx` |
| Pantalla de espera con opción de cancelar | ✅ | `student/StudentClassroomModule.tsx` |
| Ver el salón propio y a los compañeros | ✅ | `student/StudentClassroomModule.tsx` |
| Bloqueo de solicitud si el salón está lleno | ✅ | `student/StudentClassroomSearch.tsx` |
| Entrar a un salón canjeando un enlace de invitación | ✅ | `pages/Invite/Invite.tsx` + `redeemInvitation()` en `ClassroomsProvider.tsx` — paso 19, mitad A |

#### Máquina de estados del alumno

| Estado | `membership.status` | `groupId` | Qué ve |
| --- | --- | --- | --- |
| Sin salón | `none` | `null` | Buscador global |
| En espera | `pending` | id del salón | Pantalla de espera |
| En un salón | `member` | id del salón | Su salón y compañeros |

| Desde | Hacia | Disparador | Quién |
| --- | --- | --- | --- |
| Sin salón | En espera | `requestJoin()` | Alumno |
| En espera | Sin salón | `cancelJoinRequest()` | Alumno |
| En espera | Sin salón | `rejectRequest()` | Tutor |
| En espera | En un salón | `acceptRequest()` | Tutor |
| En un salón | Sin salón | `removeStudent()` / `leaveGroup()` | Tutor / Alumno |
| En espera o en un salón | Sin salón | `deleteGroup()` | Tutor |
| Sin salón | **En un salón** | `redeemInvitation()` | Alumno |
| En espera | **En un salón** | `redeemInvitation()` | Alumno |

No existe transición directa de «En un salón» a «En espera» en otro salón: hay
que quedar sin salón primero. **Un alumno pertenece como máximo a un salón.**

**Las dos últimas transiciones las trajo el paso 19 y saltan la espera**: el
enlace mete al niño directo, sin crear solicitud, porque el tutor ya consintió al
generarlo. La segunda es la que obligó a decidir algo que nadie había decidido:
si quien canjea tiene una **solicitud pendiente** —en el salón del enlace o en
otro—, esa solicitud **se cancela** en la misma transacción que crea la
pertenencia. No se marca `accepted` ni `rejected`: ningún tutor la resolvió, y
con `accepted` en otro salón además contradiría a la pertenencia. Borrarla es
exactamente la cancelación que el niño podía hacer él mismo, y la alternativa
—dejarla viva— es media violación de «un alumno, un salón».

Los diagramas y el detalle paso a paso de cada flujo están en
`ESTADO-DEL-PROYECTO.md` §1.4 y §1.5.

### 2.5 `store-salones` — Los salones, contra Supabase

**Propósito.** Ser el único punto por el que la aplicación lee y escribe
salones. Desde el paso 10 lo hace contra la base real: la solicitud que envía el
niño le llega al tutor desde otro dispositivo, no desde el mismo navegador. Y
desde el paso 18 le llega **sin que el tutor recargue**.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Store de salones con API de acciones tipada, ahora asíncrona | ✅ | `context/ClassroomsContext.ts` + `ClassroomsProvider.tsx` |
| Servicio de salones con la forma `{ data, error }` | ✅ | `services/classrooms.service.ts` |
| Identidad del niño y del tutor tomada de la sesión | ✅ | `ClassroomsProvider.tsx` (se fue `CURRENT_STUDENT_ID`) |
| Se recarga por **quién** está dentro, no por cada evento de sesión | ✅ | `ClassroomsProvider.tsx` — los callbacks dependen de `userId` y `userRole` |
| Carga declarada y error **mostrado** a quien hizo la acción | ✅ | `loading` y `error` del contexto + `shared/StoreErrorNotice.tsx` en las tres vistas que escriben |
| Motivos de la base traducidos al español | ✅ | `ERROR_MESSAGES` en `services/classrooms.service.ts` |
| Guarda de «un alumno, un salón» antes de escribir | ✅ | `requestJoin()` en `ClassroomsProvider.tsx` |
| Acceso único desde componentes | ✅ | `hooks/useClassrooms.ts` |
| Suscripción en vivo, cancelable, por el servicio | ✅ | `subscribeToClassrooms()` en `services/classrooms.service.ts` |
| Recarga silenciosa al llegar un cambio ajeno | ✅ | `runLoad(silent)` + `refreshSilently()` en `ClassroomsProvider.tsx` |

**Decisiones de diseño**

- **Después de cada escritura se recarga el estado entero del rol.** Un salón
  tiene decenas de filas y la consulta es barata; recargar evita una familia de
  errores de sincronía, como una aceptación que falla por cupo y deja al alumno
  pintado dentro. La actualización optimista se añadiría encima; al revés no.
- **Lo que decide recargar es la identidad, no el número de eventos de sesión.**
  Los seis callbacks dependen de `user.id` y `user.role` —extraídos arriba como
  `userId` y `userRole` para no chocar con `exhaustive-deps`—, no del objeto
  `user`, que se reconstruye en cada evento. Dependiendo del objeto, un refresco
  de token regeneraba los seis callbacks y recargaba el store entero, y la
  pantalla del tutor, que se sustituye por un indicador mientras carga,
  parpadeaba y se llevaba por delante lo que hubiera a medias. Es la misma
  enfermedad que el `loading` global de §2.2 y se arregló en el paso 13; los 29
  tests del provider pasaron sin tocarlos.
- Las lecturas compuestas se cruzan **en JavaScript**: `class_memberships.student_id`
  y `join_requests.student_id` apuntan a `auth.users`, no a `profiles`, así que
  sin clave ajena PostgREST no puede incrustar el perfil.
- La situación del niño sale de su **última** solicitud por fecha, con
  `maybeSingle()`. `single()` está prohibido aquí: en cuanto un niño rechazado
  vuelve a pedir entrar hay dos filas y revienta con `PGRST116`.
- La guarda de «un alumno, un salón» en el store es **de cortesía**: la garantía
  siguen siendo la restricción, el índice parcial y el `with check`. Sin ella el
  niño vería un `42501` crudo donde antes la vista no le ofrecía el botón.
- `ClassGroup` tiene **`memberCount` además de `students`**, y no sobra: del
  salón ajeno el niño conoce cuántos hay dentro pero no quiénes son, así que
  contar la lista daría siempre cero cupos ocupados.
- El progreso por alumno —mundo actual, última actividad, habilidades— **viaja
  vacío**, porque ninguna tabla de progreso conoce los salones. La tabla del
  tutor muestra «Sin actividad» y los reportes 0 %. Es el dato verdadero
  sustituyendo a uno inventado; conectarlo es el paso 17.
- `ClassroomStudent` lleva `xp`, que llega del roster y **todavía no se pinta**:
  dónde se muestra el XP es del paso 21. Sin el campo, la columna de la vista
  moriría en el servicio y habría que volver a pasar el cable entero.
- **El error se pinta donde se pulsó, y no sólo se expone.** El primer intento
  dejaba el motivo en el contexto sin que ninguna vista lo mostrara: la pantalla
  no cambiaba y el botón parecía roto. Lo montan las tres vistas que escriben.
- **Los mensajes de la base vienen en inglés** («Classroom is full») y se le
  enseñan al tutor tal cual, así que el servicio los traduce por código y
  conserva el original como causa. Sin eso, la interfaz deja de estar en
  español en el peor momento, que es cuando algo falla.
- `ClassroomsProvider` acepta una prop `service` que **sólo usan los tests**.
  Es lo que deja la lista de dependencias del provider en un único archivo,
  `test/renderClassrooms.tsx`, en vez de repartirla por cada test.
- **La suscripción en vivo entra por el servicio, no por `supabase`** (paso 18).
  Un `supabase.channel(...)` dentro del provider habría roto la frontera de §4.3
  y dejado los tests sin forma de disparar un evento, porque montan un servidor
  falso sin red. `subscribeToClassrooms(userId, onChange)` devuelve su
  cancelación, y el falso gana un `emit()`.
- **El aviso no trae el cambio, sólo la noticia de que lo hubo.** El store vuelve
  a consultar y se queda con lo que devuelva esa consulta, que es la que pasa por
  la RLS. De ahí sale que un `delete` ajeno sin filtrar sólo cueste una relectura
  de más (§2.7), y que no haga falta un segundo camino de actualización.
- **Nunca se abre un canal sin `userId`.** Con la clave anónima pasaría la
  autorización con las manos vacías y no se reintenta solo cuando después llega
  la sesión: quedaría mudo para siempre.
- **Una recarga que no pidió quien mira NO declara espera, pero sí la apaga.** Es
  la misma enfermedad del `loading` global de §2.2, entrando por otra puerta:
  `refresh()` levantaba `loading` en cada recarga, así que cada evento habría
  blanqueado el panel del tutor entero —con su desplazamiento y sus diálogos—,
  puesto un spinner sobre la pantalla del salón y hecho **desaparecer** el panel
  de misiones, que devuelve `null` mientras carga. La regla es estrecha a
  propósito: **se quita el `setLoading(true)`, se conservan todos los
  `setLoading(false)`**. Al revés sería peor que un parpadeo: la guarda `loadId`
  descarta la carga inicial que llega tarde sin apagar la espera, así que el
  indicador se quedaría encendido para siempre. Hay un test por hook que lo fija,
  y los dos **fallan al revertir el arreglo**: se comprobó, no se supuso.

#### Claves de `localStorage`

Los salones **ya no se guardan en el navegador**. `codeplay:classrooms` dejó de
escribirse; la que quede de una sesión anterior es inerte y puede borrarse.

| Clave | Contenido |
| --- | --- |
| `dev:skipAuth` | Marca de sesión de invitado. Sólo en desarrollo |
| `dev:guestRole` | Rol de la sesión de invitado: `child` o `tutor` |

### 2.6 `contenido-mundos` — Mundos, niveles y trofeos (rol niño)

**Propósito.** Presentar el contenido educativo por mundos y niveles, y el
progreso conseguido.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Listado de mundos con filtros (dificultad, tema, categoría) | 🟡 | `student/StudentWorldsModule.tsx` |
| Lectura desde Supabase con repliegue a datos locales | 🟡 | `useWorlds()` + `fallbackWorlds` (`student/worlds/worldsData.ts`) |
| Recuento de niveles completados por mundo | 🟡 | `worldsService.getLevelsByWorld()` + `useProgress()` |
| Niveles de un mundo, con bloqueo por progresión | 🟡 | `student/StudentWorldLevelsModule.tsx` |
| Sala de trofeos | 🟡 | `student/StudentTrophiesModule.tsx` + `AchievementList/` |
| Ajustes de cuenta del alumno | 🟡 | `student/StudentSettingsModule.tsx` |

**Decisiones de diseño**

- El patrón es **Supabase primero, repliegue local después**: si `useWorlds()`
  no devuelve nada (hoy, siempre), se pintan los mundos de `worldsData.ts`. Al
  conectar el backend, la pantalla cambia de fuente sin tocar el componente.
- El repliegue local usa el tono de tarjeta (`forest` / `volcano` / `ocean`) como
  identidad visual del mundo, no un color guardado en base de datos.

### 2.7 `backend-supabase` — Esquema de base de datos

**Propósito.** Definir el esquema, las políticas de seguridad y las operaciones
seguras del backend.

**Estado global: aplicado.** El proyecto de Supabase existe, está enlazado con la
CLI y **las 22 migraciones** se ejecutaron contra la base real. Las quince
primeras entraron con `backend-supabase-real` (25-ago-2026) y `tablas-salones`
(26-ago-2026); las siete restantes las fueron añadiendo los pasos 15, 16, 18, 19
y 28. Verificado por HTTP: ninguna tabla devuelve `PGRST205`, `worlds` y `levels`
responden con los 3 mundos y los 9 niveles de la siembra, y las cuatro tablas de
salones responden 401 a la clave anónima.

**La 0013 salió con un fallo, y conviene que quede en el registro.** Sus
políticas formaban un ciclo: la de inserción de `join_requests` consulta
`profiles` para comprobar el rol, y `profiles_select_own_students` consultaba a
su vez `join_requests`. Insertar una solicitud moría con
`42P17: infinite recursion detected in policy`, es decir que **ningún niño podía
pedir entrar a un salón**. La migración 0014 lo corrige moviendo la condición a
una función `security definer`, que no expande políticas.

**Sólo era observable con sesión autenticada.** La verificación de la 0013 llegó
hasta donde llega una clave anónima —las tablas existen, `anon` no lee ninguna— y
por eso el fallo pasó dos revisiones. La lección está en `ROADMAP.md` §1.3: el
análisis de ciclos entre políticas se hace desde cada **escritura**, no sólo
desde las lecturas.

**Qué está verificado con sesión real, a 26-ago-2026.** Con las tres cuentas de
prueba del paso 11 —una `tutor` y dos `child`— y sus tokens, contra el proyecto
real:

| Comprobado | Resultado |
| --- | --- |
| El tutor crea un salón; el niño lo intenta | 201 y `42501`: la política exige rol `tutor` |
| El tutor ve el perfil del solicitante, con su nombre | Sí, por las dos ramas: solicitud pendiente y pertenencia |
| El niño lee `profiles` | Una sola fila, la suya |
| El niño intenta inscribirse solo | `42501`: no hay política de inserción sobre `class_memberships` |
| `accept_join_request` | Crea la pertenencia con `joined_at`; el disparador rellena `resolved_at` con el **mismo instante**, o sea que las dos tablas se escriben en una transacción |
| Siendo miembro, pedir otro salón | `42501`: lo corta el `with check` que consulta `class_memberships` |
| El niño sale de su salón y vuelve a solicitar | Permitido: sin `unique (group_id, student_id)`, se acumulan filas |
| El tutor rechaza; el niño intenta borrar y reescribir su rechazo | 0 filas y 0 filas: el rechazo sobrevive |
| El tutor intenta marcar `accepted` una solicitud **pendiente**, sin la RPC | `42501`: lo corta `with check (status = 'rejected')` |
| Salón de cupo 1 lleno, aceptar a un segundo niño | `23514 Classroom is full`, y la solicitud sigue `pending`: la RPC aborta antes de escribir |
| Borrar un salón | Se lleva por delante sus solicitudes y sus pertenencias |

**Las dos vistas de la 0015, verificadas a 26-ago-2026.** Con las mismas cuentas:

| Comprobado | Resultado |
| --- | --- |
| El niño miembro consulta `classroom_roster` | Ve sólo el roster de su salón |
| El niño pide el roster de un salón ajeno | Cero filas |
| El tutor consulta `classroom_roster` | Ve los de sus salones, no los de otro |
| `class_group_directory` | Devuelve `member_count` correcto |
| Las dos vistas con la clave anónima | 401 en ambas |
| Qué columnas trae el roster | Las siete previstas y ninguna más: sin correo, sin país, sin nombre de usuario |

**La 0020, verificada con sesión real a 29-ago-2026.** Con las tres cuentas y
casos negativos, catorce comprobaciones sin ninguna fallida:

| Comprobado | Resultado |
| --- | --- |
| El tutor asigna en su salón | 201 |
| La misma misión en otro salón suyo | 201: la unicidad es del par, no de la clave |
| El tutor asigna en un salón que no es suyo | `42501` |
| La misma misión dos veces en el mismo salón | `23505` |
| Lo mismo con `resolution=ignore-duplicates` | 201 y **una sola fila**: es lo que usa el servicio para que «Todos» no muera por un salón que ya la tenía |
| El niño lee las de su salón | Sólo las suyas |
| El niño pide las de un salón ajeno | Cero filas |
| Un niño **sin salón** consulta | Cero filas, con el contraste medido: el que sí tiene salón ve las dos asignadas |
| El niño intenta asignar, incluso en su salón | `42501` |
| El niño intenta retirar la de su salón | Cero filas borradas |
| La clave anónima | 401 |
| El tutor retira la suya | Una fila borrada, y el niño deja de verla |
| Se borra el salón | Se van sus asignaciones |

**Lo que NO se probó, y conviene saberlo:** que un tutor no pueda asignar en el
salón **de otro tutor**. Sólo existe una cuenta de tutor, así que el caso se
midió contra un salón **inexistente**, que la política rechaza por la misma
condición. Discrimina más de lo que parece —una política mal correlacionada
habría respondido `23503` y no `42501`—, pero no es el caso literal.

**CERRADO EN EL PASO 18, con las dos cuentas de tutor.** Medido el 2 de
septiembre de 2026: el tutor 1 asigna y retira `m5` en su salón mientras el tutor
2 escucha, y **al tutor 2 no le llega ni el sobre del `insert`**. Es el caso
literal —dos tutores de verdad, un salón que existe y es de otro— y no el que se
midió en el paso 16 contra un salón inexistente. Se comprobó por Realtime y no
por REST, que discrimina **más**: la RLS del `insert` se evalúa por suscriptor
sobre una fila que sí existe, así que un `[]` por «no hay nada» está descartado
por construcción. El positivo emparejado ocurrió en la misma ventana: al tutor 1
sí le llegó.

**La 0021, verificada con sesión real a 2-sep-2026.** Cuatro oyentes a la vez
sobre las tres tablas publicadas, y los negativos con su positivo ocurriendo en
la misma ventana:

| Comprobado | Resultado |
| --- | --- |
| La publicación lista las tres tablas | `join_requests`, `class_memberships`, `mission_assignments`; system id 16430, con las cuatro operaciones ya activas de antes |
| El dueño del salón escucha un `insert` suyo | Recibe la fila entera |
| Un tutor ajeno escucha ese mismo `insert` | **No recibe ni el sobre**: la RLS del `insert` sí se evalúa por suscriptor |
| Un niño sin salón escucha ese `insert` | Tampoco recibe nada, con su positivo emparejado en la misma ventana |
| La clave anónima escucha un `insert` | Recibe el **sobre vacío**, con `errors: ["Error 401: Unauthorized"]` y cero columnas |
| Cualquiera escucha un `delete` | Le llega. Al autenticado ajeno con la clave primaria dentro; a la clave anónima, **sin siquiera eso** |
| El niño pide entrar al salón del tutor 2 | Lo reciben el tutor 2 y el propio niño; el tutor 1, nada |

**El `delete` sin filtrar es del sistema, no un defecto del cliente.** Realtime no
puede comprobar quién tenía acceso a una fila que ya no existe, así que reparte el
borrado a todos los suscriptores de esa tabla. No se corrige con
`replica identity full`: eso haría viajar la fila entera en vez de un uuid, o sea
más filtración y no menos. Se acepta porque el store **no lee el payload** —vuelve
a consultar, y esa consulta sí pasa por la RLS—, y la salida, si algún día
importa, es `realtime.broadcast_changes()` desde disparadores.

**Lo que gana quien escucha sin sesión es saber que algo cambió**, nunca qué.
Mientras la base tenga un salón de pruebas eso es ruido; desplegada y con salones
reales pasa a ser telemetría de uso visible para cualquiera, porque la clave es
pública por diseño. Anotado como cabo suelto del paso 27 en `ROADMAP.md` §3.

**Los tres casos del paso 18, verificados desde la interfaz con dos sesiones.**
El tutor con el panel abierto ve entrar la solicitud; el niño ve que lo aceptan,
que lo rechazan y que lo retiran; y ve aparecer y desaparecer la misión que su
tutor asigna y quita. **Cero apariciones del indicador de carga en todos los
casos**, medidas con un observador de mutaciones y no a ojo, y sin que se cerrara
el panel que el tutor tenía abierto.

**El cupo lleno, verificado desde la interfaz con los dos niños.** Salón de cupo
1 con dos solicitudes pendientes: al aceptar la primera, los cupos libres pasan
a 0, el botón «Aceptar» de la segunda queda deshabilitado con su `title`, y
aparece el aviso de salón lleno. La solicitud sigue `pending`.

**Qué sigue sin verificar.** La carrera del `for update`: dos aceptaciones
simultáneas sobre el mismo salón no se reproducen a mano. El cupo está
comprobado **funcionalmente**, no bajo concurrencia.

**La 0022, verificada con sesión real a 2-sep-2026.** Trece comprobaciones por
`curl` en el grupo 6, cada negativo con su positivo emparejado en la misma
ventana, y ninguna fallida:

| Comprobado | Resultado |
| --- | --- |
| El niño hace `select` sobre `invitations` | **Cero filas** —200, no 403: lo filtra la RLS, no el permiso— |
| El niño hace `update` sobre `invitations` | `42501` |
| **El tutor** hace `update` sobre `invitations` | `42501` **también él**: es el muro que obliga a la RPC incluso al dueño |
| Canje de un token inexistente | `ZC010` |
| Canje con la clave anónima | 401 |
| Canje desde una sesión de **tutor** | `42501` |
| `preview_invitation` sin sesión | 401 — no se concede a `anon` |
| `preview_invitation` con sesión de niño | 200 con el salón: el positivo emparejado |
| **Canje bueno** | 200, pertenencia creada, invitación `accepted` con `accepted_at` |
| Canje sobre un salón **lleno** | `23514`, sin pertenencia, y **la invitación sigue `pending`** |
| Canje de un enlace ya canjeado | `ZC012` |
| Canje de un enlace **caducado** | `ZC011`, y `preview` devuelve `state=expired` sin levantar excepción |
| Canje estando ya en un salón, con cupo libre en el del enlace | `23505`, y **el enlace no se gasta** |

**La transacción está probada por las fechas, en los tres canjes que hubo:**
`class_memberships.joined_at` y `invitations.accepted_at` coinciden **al
microsegundo** en todos ellos. Es la misma prueba que se usó con
`accept_join_request` y su disparador de `resolved_at`.

**La cancelación de la solicitud pendiente, medida en sus dos variantes.** Con
pendiente en **otro** salón: el niño queda inscrito en el del enlace y la
pendiente desaparece. Con pendiente en **el mismo**: inscrito una sola vez. En
los dos casos la solicitud ya `accepted` del niño conservó su `resolved_at`
**idéntico al microsegundo** (`15:30:07.886963`), antes y después de las trece
comprobaciones: el `delete` que corre como definer **no rozó el historial
resuelto**, que es lo que sostiene el `where status = 'pending'` escrito a mano.

**Verificado además desde la interfaz, a 2-sep-2026:**

| Comprobado | Resultado |
| --- | --- |
| El tutor genera un enlace | Recibe el token **en la misma llamada** del `insert`: 48 hex, o sea los 24 bytes de `gen_random_bytes` |
| La lista de enlaces | Los **tres** estados con datos reales, y sólo el activo ofrece «Copiar» y «Retirar» |
| Retirar un enlace sin usar | La fila desaparece de la base, y después `preview` y `redeem` responden `ZC010` |
| La purga | Con una invitación vencida sembrada, abrir el panel **la borra de la base**, no sólo deja de pintarla |
| **El token sobrevive el viaje a Google** | Con la cuenta **axoluk**, dada de alta con Google: enlace abierto sin sesión, vuelta por `/auth/callback`, y **el canje ocurre solo al terminar**, sin reabrir el enlace |
| El token sobrevive un registro con contraseña | Cuenta nueva desde el enlace: `/signup/child` → `/invite/…` → canje |
| Abrir la pantalla y no pulsar | El enlace **sigue sin gastarse**: el canje es un acto, no una consecuencia de cargar |
| La invitación no alcanza al siguiente | Consumida, otra cuenta entra en el mismo navegador y **aterriza en su propio panel** |
| El tutor mirando mientras alguien canjea | De 2 a 3 exploradores **sin recargar y con cero apariciones del indicador de carga**, contadas con un observador de mutaciones |
| Sesión de tutor abriendo un enlace | Se le explica que los salones se canjean desde una cuenta de niño; **no** un «no tienes permiso» |

**`expires_at` no lo acota nada, y eso importa más allá de este paso.** La tabla
no tiene ningún `check` sobre esa columna —el único de `invitations` es el de
`status`— y `invitations_insert_own_groups` sólo comprueba `invited_by` y que el
salón sea del tutor. **Quien inserta elige la fecha**, y puede ponerla en el
pasado o **en 2126**. Se usó a propósito para sembrar el caso `ZC011` y el
fixture de la purga.

**Los catorce días NO los garantiza el esquema:** los sostienen el `default` de
la columna y que el cliente no mande ese campo. Alargar no es simétrico con
acortar, y por eso queda anotado en vez de darse por menor:

1. **La purga nunca se la lleva**, porque se apoya en esa misma fecha. Vuelve la
   fila que nada borra, que es justo lo que `invitaciones-sin-correo` vino a
   quitar y por lo que el roadmap pedía la purga «desde el primer día».
2. **Un enlace que no caduca es otra cosa que uno de catorce días**: si se
   filtra, no deja de servir.

Hoy sólo puede insertar el tutor del salón, y sólo en el suyo, así que el daño se
lo hace a sí mismo, y **no se migró en este paso a propósito**. Pero **ningún
requisito puede prometer los catorce días como propiedad del sistema**, y quien
llegue al paso 14 o a la mitad B del 19 tiene que saber que ahí no hay barrera:
ponerla sería acotar la columna en el esquema.

**Estado de la base de pruebas: limpia otra vez, RECOGIDA EN EL PASO 18.** El
residuo del paso 16 —el salón `CP-5J6H` «salon sigma», con dos miembros, las
misiones `m1` y `m3` y su historial de solicitudes— se conservó a propósito
mientras duró el paso 18, porque era el escenario poblado que hacía falta para
ver llegar eventos, y se borró al terminar. Comprobado el 2 de septiembre de 2026
con la sesión del tutor 1: `class_groups`, `class_memberships`, `join_requests`,
`invitations` y `mission_assignments` devuelven **cero filas**. Las tres cuentas
siguen existiendo, ninguna con salón.

Borrar el salón bastó para todo: las claves ajenas de las migraciones 0013 y 0020
son `on delete cascade`, así que se llevó por delante miembros, solicitudes,
invitaciones y asignaciones con una sola sentencia.

**Lo que cuesta, y conviene saberlo antes del paso 17:** los reportes de
habilidades sobre progreso real necesitan alumnos dentro de un salón, así que ese
paso tendrá que volver a montar el escenario. Es barato —crear salón, solicitar,
aceptar— y se prefirió a arrastrar un residuo que cada paso siguiente tendría que
distinguir de los datos de siembra.

**ESTADO QUE DEJA VIVO EL PASO 19, y esta vez NO se recogió.** Al revés que el
18, aquí queda escenario dentro a propósito, porque es justo el que al paso 17 le
va a hacer falta. Medido el 2 de septiembre de 2026:

| Qué queda | Detalle |
| --- | --- |
| Salón `CP-PJE6` «salon pinpon», del tutor 1 | **2 de 30**, con una misión asignada y una solicitud `accepted` en el historial |
| Sus dos miembros | **Axoluk**, dada de alta con Google, y **Invitada Prueba** |
| Tres invitaciones, las tres `accepted` | Ninguna sirve ya; se las llevará la purga el 16 de septiembre |
| El niño de `.env` | **Sin salón**, con su solicitud `accepted` intacta desde `15:30:07.886963` |
| El salón `CP-CUP1` «cupo uno» | Borrado con su cascada al terminar el grupo 6 |

**Dos cuentas sintéticas creadas para el paso 19**, las dos con contraseña
`Selva2026Prueba` y correo que no existe —la confirmación por correo está
apagada en este proyecto, así que no hacía falta bandeja—:

- `invitacion-7-4@codeplay.test` («Invitada Prueba»), **dentro de `CP-PJE6`**.
  Borrarla desde Authentication → Users se lleva su pertenencia por la cascada
  de la 0013.
- `invitacion-7-4b@codeplay.test` («Carrera Prueba»), sin salón. Se creó para
  medir quién gana la carrera del destino en el registro; ver §2.2.

Quien llegue al paso 17 o al 20 se va a encontrar esto, y **conviene no
confundirlo con los datos de siembra**: los mundos y niveles de la 0012 sí lo
son; este salón y estas cuentas, no.

**Arista de privacidad que hereda el paso 14.** Desde el paso 10, un niño ve de
cada compañero de su salón el nombre completo, el avatar, el XP y la racha. Es
decisión del usuario y su motivo es que se comparen dentro del salón, lo que
cierra media pregunta del ranking (`ROADMAP.md` §3.2). Comparar dentro del salón
y publicar la identidad de un menor son decisiones distintas: sólo está tomada
la primera.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Extensión `pgcrypto` y trigger de `updated_at` | ✅ escrito | `migrations/202606030001_base_extensions.sql` |
| Tabla `profiles` | ✅ escrito | `…0002_create_profiles.sql` |
| Tablas `worlds` y `levels` | ✅ escrito | `…0003_create_learning_content.sql` |
| Tablas `user_progress` y `level_attempts` | ✅ escrito | `…0004_create_progress_tracking.sql` |
| Tabla `achievements` | ✅ escrito | `…0005_create_achievements.sql` |
| RPCs `update_my_profile`, `create_level_attempt`, `upsert_my_progress` | ✅ escrito | `…0006_create_rpc_functions.sql` |
| Trigger `on_auth_user_created` que crea el perfil | ✅ escrito | `…0007_create_profile_trigger.sql` |
| Vista `leaderboard_weekly` | ✅ escrito | `…0008_create_weekly_leaderboard_view.sql` |
| RLS, políticas y permisos | ✅ aplicado | `…0009_enable_rls_and_policies.sql` |
| Columna `profiles.role` y disparador que la rellena | ✅ aplicado | `…0010_add_profile_role.sql` |
| Enum `user_role` y retirada del check redundante | ✅ aplicado | `…0011_profile_role_enum.sql` |
| Siembra de mundos y niveles | ✅ aplicado | `…0012_seed_learning_content.sql` |
| Tablas de salones, sus políticas, sus `grant` y `accept_join_request` | ✅ aplicado | `…0013_create_classroom_tables.sql` |
| Arreglo de la recursión entre `profiles` y `join_requests` | ✅ aplicado | `…0014_fix_profiles_policy_recursion.sql` |
| Vistas `class_group_directory` y `classroom_roster` | ✅ aplicado | `…0015_create_classroom_read_views.sql` |
| Tabla `mission_assignments`, sus políticas y sus `grant` | ✅ aplicado | `…0020_create_mission_assignments.sql` |
| Tres tablas publicadas en `supabase_realtime` | ✅ aplicado | `…0021_publish_realtime_tables.sql` |
| `redeem_invitation` y `preview_invitation`, el canje de enlaces | ✅ aplicado | `…0022_create_invitation_redemption.sql` |
| Cliente y 8 servicios tipados contra el esquema real | ✅ | `lib/supabase.ts`, `services/*.ts` |
| `database.types.ts` generado con la CLI | ✅ | `types/database.types.ts` |

**Las tres RPC de la 0006, medidas por fin (2-sep-2026).** Hasta este paso sólo
`update_my_profile` se había ejercitado de verdad: `create_level_attempt` y
`upsert_my_progress` estaban escritas desde el 25-ago-2026 y **no las había
llamado nadie nunca**, ni la aplicación ni un `curl`. El paso 23.1 no podía
describirlas en el contrato del juego sin medirlas antes. Comprobadas con la
cuenta `userkid2`, que partía de `total_xp: 0`, sin progreso y sin intentos:

| Comprobación | Resultado |
| --- | --- |
| `create_level_attempt` con los **seis** parámetros | Fila creada; `metadata` y `runtime_ms` **sí llegan** por la RPC |
| Con un `input_level_id` inexistente | `P0002 Level not found or unavailable` |
| Con `input_score: 200` | Guarda **100**: recorta en silencio, no rechaza |
| Con `input_submitted_code: "x"`, que no es JSON | Se guarda tal cual. La columna es `text` **sin `check`**: nada valida lo que entra |
| `upsert_my_progress` en `in_progress` | Fila creada, `total_xp` sigue en 0 |
| El mismo nivel a `completed` | `total_xp` pasa a **100**, el `xp_reward` de ese nivel |
| `completed` **por segunda vez** | `total_xp` **sigue en 100**; `best_score` no baja de 90 a 50; `completed_at` congelado; `attempt_count` sí sube |
| Con un estado que no es de los dos | `22023 Invalid completion status` |
| `insert` directo en `level_attempts`, autenticado | `42501` |
| `insert` directo en `achievements`, autenticado | `42501`: **no hay `grant insert` para ningún rol** |
| Cualquiera de las dos RPC con la clave anónima | `42501 permission denied for function` |
| `levels` con la clave anónima | `validation_rules` y `starter_code` **se leen sin sesión** |

**Dos consecuencias que el paso 22 hereda.** La primera: `attempt_count` cuenta
llamadas a `upsert_my_progress`, no filas de `level_attempts`. Son dos contadores
independientes y **nada los sincroniza**; quien escriba el puente tiene que
llamar a las dos. La segunda: como `achievements` no concede `insert` a nadie, la
única vía para otorgar un logro es una función `security definer`, que **no
existe**. No es una preferencia de diseño, es la única puerta abierta.

**Quedaron filas de prueba** en la cuenta `userkid2`: dos en `level_attempts`,
una en `user_progress` y `total_xp: 100`. No se pueden borrar desde el cliente
—la 0009 revoca `delete`—; se limpian desde el panel si estorban.

**Decisiones de diseño**

- **Plazo de conservación, decidido por el usuario el 28-ago-2026:** los datos
  personales viven **mientras exista la cuenta**, y se van con ella. No hace
  falta maquinaria nueva para eso: las claves ajenas de las migraciones 0002,
  0004, 0005 y 0013 ya son `on delete cascade` contra `auth.users`, así que borrar la
  cuenta en el panel se lleva perfil, progreso, intentos, logros, pertenencia,
  solicitudes e invitaciones. La excepción son **las invitaciones, que se purgan
  a los 14 días** por su `expires_at`; hoy no hay nada que purgar porque nadie
  escribe filas, así que esa purga es **una obligación que hereda el paso 19**,
  no algo implementado. Es lo que exige decir un plazo en la política de
  privacidad, que **se redacta más adelante**: ver §3 y `ROADMAP.md` §3.4.
- **Ninguna tabla guarda el correo de alguien sin cuenta.** Lo hacía
  `invitations.email` hasta la migración `202606030016`, que lo eliminó. Ver
  §2.3: es una decisión de privacidad, no una funcionalidad pendiente.
- Las escrituras principales quedan encapsuladas en **RPCs** en vez de permitir
  escritura directa desde el cliente, para reducir la manipulación.
- `achievements` es de sólo lectura para el cliente autenticado; otorgarlos
  requerirá lógica segura adicional. **Medido el 2-sep-2026: no hay `grant
  insert` para ningún rol**, así que la única vía posible es una función
  `security definer` —no una Edge Function: `supabase/functions/` no existe—. Es
  el **registro de logros concedidos**, no un catálogo: no existe la tabla que
  enumere los posibles, así que la sala de trofeos sólo lista lo conseguido
  (§4.2).
- **Las misiones no pueden montar sobre `achievements`, decidido en el paso
  23.1.** Su `unique (user_id, achievement_key)` significa «una vez en la vida»,
  que es lo correcto para un logro y un accidente para una misión: el propio
  `unique (group_id, mission_key)` de la 0020 declara que la misma misión en dos
  salones es lo normal, y reasignarla a otra cohorte también lo es. Misma
  maquinaria de concesión, cardinalidad distinta. El cumplimiento además debe
  **guardar el salón, no derivarlo**: derivarlo por `class_memberships` haría
  desaparecer lo cumplido de los informes en cuanto el niño cambie de salón. La
  tabla la crea el paso 22.
- `role` es un **enum** `user_role`, no un `text` con `check`: sólo el enum llega
  a los tipos generados, y una unión escrita a mano junto a un check de la base
  volvería a abrir la brecha entre tipo y realidad.
- Las escrituras del cliente pasan por RPC también en progreso e intentos, no
  sólo en el perfil: la migración 0009 revoca `insert/update/delete` sobre las
  tres tablas.
- `leaderboard_weekly` es una vista que expone únicamente campos seguros.
- `levels` guarda `starter_code`, `validation_rules` y `programming_language`:
  el esquema se diseñó para un **editor de código en el navegador**, no para un
  juego de Unity. **Se reinterpreta, decidido en el paso 23.1**, porque con
  codificación por bloques sigue habiendo programa: `validation_rules` lleva la
  definición del puzle, `starter_code` la disposición inicial de bloques y
  `programming_language` —hoy `'javascript'` en las nueve filas, y **sin
  `check`**— se reaprovecha como versión del formato de serialización. Ninguna
  columna sobra y ninguna hace falta. Ver `CONTRATO-DE-INTEGRACION.md`.
- **En `validation_rules` va la definición del puzle, nunca su solución ni la
  condición de un logro sorpresa.** La columna la lee cualquiera **sin sesión**
  —medido—, por el `grant select ... to anon` y la política de la 0009. Para una
  rejilla de A a B es inofensivo; para un logro secreto lo revela, así que esas
  condiciones van al catálogo del paso 22, que no necesita ser público.
- `supabase/` está en la raíz del repo siguiendo la convención del CLI, para que
  `supabase db push` y `supabase db reset` funcionen sin flags.
- **Los salones escriben por RLS, no por RPC**, al revés que perfil y progreso.
  La excepción es aceptar una solicitud: escribe dos tablas y comprueba a la vez
  el cupo, la propiedad del salón y «un alumno, un salón», así que es la única
  RPC del módulo. Bloquea la fila del salón con `for update` **antes** de contar
  alumnos; sin ese bloqueo, dos aceptaciones simultáneas se pasan del cupo.
- **«Un alumno, un salón» vive en tres sitios**: `unique (student_id)` en
  `class_memberships`, un índice único **parcial** sobre las solicitudes
  pendientes, y el `with check` de la política de inserción, que impide pedir
  entrar a otro salón siendo ya miembro. Ninguno sobra.
- **El historial de solicitudes se acumula en filas.** Una solicitud resuelta es
  inmutable y volver a pedir entrar inserta una fila nueva, así que un mismo par
  `(student_id, group_id)` puede tener varias. No hay `unique (group_id,
  student_id)` a propósito: impedía tanto reintentar tras un rechazo como volver
  a un salón que el niño había dejado.
- **`class_memberships` guarda `joined_at`.** Guardar la fecha no decide qué
  historial ve el tutor de un niño que ya jugaba antes de entrar —eso es del
  paso 17 del roadmap y tiene arista de privacidad—; sólo evita tener que
  inventarla después.
- `profiles` tiene **dos** políticas de lectura: la propia y
  `profiles_select_own_students`, que deja al tutor leer el perfil de los niños
  de sus salones. Sin ella la lista del salón saldría sin nombres.


### 2.8 `misiones-asignadas` — Misiones especiales del salón

**Propósito.** Que el tutor asigne misiones a sus salones y que el niño las vea,
aunque **todavía no pueda jugarlas**. Una misión es un reto *especial*: sólo
existe para el niño si su tutor se la asignó, y premia más XP que un nivel.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Tabla de asignaciones con RLS y `grant` | ✅ | `migrations/202606030020_create_mission_assignments.sql` |
| Servicio con la forma `{ data, error }` | ✅ | `services/missions.service.ts` |
| Hook de lectura y escritura | ✅ | `hooks/useMissionAssignments.ts` |
| El tutor asigna al alcance elegido | ✅ | `teacher/TeacherPanelModule.tsx` |
| Sin salones, los controles se deshabilitan | ✅ | `teacher/TeacherPanelModule.tsx` |
| Apartado «Quién ha cumplido», con el motivo | ✅ | `teacher/TeacherPanelModule.tsx` |
| El niño ve sólo las asignadas, en dos pantallas | ✅ | `shared/AssignedMissionsPanel.tsx`, montado en `student/StudentWorldsModule.tsx` y `student/StudentClassroomModule.tsx` |
| El catálogo declara el premio en XP | ✅ | `Mission.xpReward` en `types/classroom.types.ts` + `teacher/classroomsData.ts` |
| El niño ve la asignación y la retirada sin recargar | ✅ | `subscribeToAssignments()` en `services/missions.service.ts` + `hooks/useMissionAssignments.ts` |
| Jugar una misión | ❌ | **No existe.** Llega con el juego, pasos 20 y 21 |

**LAS MISIONES TODAVÍA NO SON FUNCIONALES, y no es un descuido.** Se asignan, se
guardan y se ven, pero **no se pueden jugar ni completar**: nada en la plataforma
puede terminar una misión hasta que el juego reporte progreso (paso 21). De ahí
salen dos cosas que parecen fallos y no lo son: la tarjeta del niño **no tiene
botón** —ofrecerlo sería prometer algo que no ocurre al pulsarlo— y el salón
entero sale en «Pendiente», con el motivo escrito encima de la tabla.

**Decisiones de diseño**

- **La asignación cuelga del salón, no del tutor.** El niño se liga a un salón
  por su pertenencia, no a una persona, y su vista no expone quién es su tutor.
  `assigned_by` conserva el autor como dato de auditoría, no de acceso.
- **`mission_key` es texto sin clave ajena, a sabiendas.** El catálogo son cinco
  entradas en `teacher/classroomsData.ts` y no existe tabla a la que apuntar; una
  clave ajena a `levels` sería mentira, porque las misiones no son ninguno de los
  nueve niveles. Escrito en la propia migración. Mientras tanto, **el cliente
  ignora las claves que no reconoce** en vez de romper la pantalla.
- **No hay tabla de cumplimientos, y es deliberado.** El estado se calcula.
  Diseñarla obligaría a decidir qué reporta el juego y con qué garantía, que es
  la pregunta abierta de `ROADMAP.md` §3.2, previa al paso 20.
- **El premio ancla en la siembra: 300, 400 y 500 por dificultad.** Los nueve
  niveles sembrados dan de 100 a 260, así que la misión más floja supera al nivel
  más generoso. Es el único XP medible que existe: no hay catálogo de logros
  (§4.2). **El premio se muestra, no se otorga**: nada suma XP todavía.
- **El niño sólo ve lo asignado.** No hay catálogo en gris con candado: que la
  misión esté bloqueada hasta que el tutor la asigne es regla del modelo y se
  cumple sola, porque no hay superficie donde verla si no.
- **El panel del niño no se pinta si no hay nada que enseñar.** Sin salón o sin
  misiones, devuelve `null` sin dejar hueco. Un fallo de lectura sí se dice:
  callarlo afirmaría que no hay misiones.
- **Y por eso mismo, la recarga en vivo del paso 18 no declara espera aquí.** Que
  el panel no se pinte mientras carga significa que un evento ajeno no lo haría
  parpadear: lo haría **desaparecer y volver**. El camino silencioso de
  `useMissionAssignments` tampoco limpia el error de entrada, porque la pantalla
  pinta el motivo en lugar del panel y borrarlo para reponerlo un instante
  después es el mismo defecto por otra puerta: el error se fija con el resultado.
- **El selector de alcance dejó de ignorarse.** Antes `assignedMissionIds` era
  estado del componente, independiente de `selectedGroupId`. Con «Todos» la
  misión sólo se ve «Asignada» si la tienen **todos** los salones, y si la tienen
  algunos se dice en cuántos.
- **Al asignar se mandan todos los salones del alcance**, incluidos los que ya la
  tienen: la escritura ignora duplicados, así que no hay que calcular el
  subconjunto con estado que puede estar viejo.
- **El cumplimiento sólo aparece con un salón concreto elegido.** Con «Todos»
  habría que mezclar alumnos de salones distintos en una misma tabla.
- **Este cambio NO tocó `ClassroomsProvider`.** Va por su propio servicio y su
  propio hook, como `worlds.service.ts` + `useWorlds()`. La frontera de §4.3
  sigue en pie.

### 2.9 `juego-3d` — El esqueleto, la cuadrícula, el personaje, los bloques, su ejecución y el resultado (J1 a J6.4)

**Aplicado con `esqueleto-del-juego` (J1), `rejilla-y-personaje` (J2),
`bloques-del-programa` (J4), `ejecutar-el-programa` (J5), `recuento-y-resultado`
(J6), `contador-en-vivo` (J6.1), `contador-sobre-el-lienzo` (J6.2),
`pantalla-compuesta-y-camara` (J6.3) y `assets-de-tanteo` (J6.4), más el J3, que
sólo fijó el formato por escrito.**
Lo que hay es una escena 3D dentro del panel del niño, cargada en diferido, con
**un tablero leído de una configuración escrita a mano y un personaje que se
mueve por casillas**, al lado **un editor de bloques que produce el programa en
JSON**, **el intérprete que ejecuta ese programa, anima el recorrido y dice si se
llegó a la meta**, **un contador que sube sobre el lienzo mientras el personaje
recorre el programa** y **una barra que al terminar dice cuántos pasos costó
contra los de la mejor solución**. Con eso, **un nivel se juega y se puntúa a la
vista** — y **nada le enseña al niño el número a batir antes de jugar**, que es
una decisión del usuario y no un descuido. **Sin backend**: la fase A no toca Supabase ni una vez, y quien convierta
esos pasos en XP es el servidor, en el J10.

| Archivo | Qué es |
| --- | --- |
| `apps/web/src/game/level.ts` | **Puro.** Los tipos del tablero —`TileKind`, `Direction`, `Cell`, `Pose`, `LevelConfig`— y `TILE_SIZE`. El formato **ya no es provisional**: lo fijó el J3 en el contrato §4.2, y `LevelConfig` es ese mismo objeto |
| `apps/web/src/game/debugLevel.ts` | **Puro.** La rejilla de pega: 5×5, cuatro muros, un hueco, salida y meta. **No es un puzle diseñado** — los nueve los diseña el usuario y se siembran en el J7 |
| `apps/web/src/game/movement.ts` | **Puro.** `turn` y `advance`, con `blockedBy` en `'wall' \| 'gap' \| 'edge' \| null`. **Los reutiliza el intérprete**: nació para eso |
| `apps/web/src/game/movement.test.ts` | Los **primeros tests del juego**: 12, contra tableros escritos en el propio test |
| `apps/web/src/game/GameScene.tsx` | La escena: `<Canvas>` con el tablero, el personaje, la animación con `useFrame` y **la cámara movible acotada** (`OrbitControls` de `drei`); **el contador de pasos, siempre visible**; **la superposición que dice todo lo demás** —reposo, ejecución, resultado y avisos—; y los tres botones —**«Ejecutar», «Detener» y «Reiniciar»**—, pintados **con un portal** en el hueco que baja la composición. Desde el J6.4, **el tablero es geometría generada de una pieza** —dos verdes y tierra, con los colores medidos del `colormap` del kit— y los obstáculos, la meta y el escenario de fuera son **modelos de `public/models/` pedidos por URL**. El personaje sigue siendo el cubo. Importa `three`, `@react-three/fiber` y `@react-three/drei` |
| `apps/web/src/game/GameSceneLoader.tsx` | La frontera de carga diferida del motor 3D: `React.lazy` + `Suspense`. Baja el programa y **el hueco de los botones**; **sólo el tipo** del sobre cruza. Desde el J6.4 lleva además el **límite de error de la escena**, que va aquí porque el `<Canvas>` vuelve a lanzar en su propio render |
| `apps/web/src/game/program.ts` | **Puro.** El sobre del contrato §4.3: `Program`, `PROGRAM_FORMAT_VERSION` y las funciones `sealProgram` y `openProgram`. **Sin Blockly** — lo reutilizan el J8 al abrir el `starterProgram` y el J9 al mandar el intento |
| `apps/web/src/game/program.test.ts` | El sobre: que se cierre con la versión del contrato y que una desconocida se rechace entera (§7) |
| `apps/web/src/game/blockTypes.ts` | **Nuevo en el J5. Puro.** Cómo se llaman los tres bloques y su campo en el JSON. Vive aparte porque `blocks.ts` importa Blockly y **el intérprete no puede importarlo** |
| `apps/web/src/game/interpreter.ts` | **Puro.** `readProgram` baja por la cadena `next.block` y devuelve `{ orders, rootCount }` —o `null` si no entiende algo—, `countSteps` suma los pasos **leyendo** las órdenes (§4.4), `runProgram` las pliega sobre la pose inicial con `turn` y `advance`, `hasLooseStacks` responde por los bloques de sobra y **`stepsTaken` da los pasos dados que enseña el contador**. Sin Blockly y sin `three` |
| `apps/web/src/game/interpreter.test.ts` | El recorrido y la meta, con el **PROGRAMA A del contrato §4.3 pegado tal cual** como entrada |
| `apps/web/src/game/blocks.ts` | Los tres bloques —`avanzar N`, `girar a la izquierda`, `girar a la derecha`—, en español, y **la lista que enseña la caja** (`FLYOUT_BLOCKS`, sin categoría desde el J6.3). Importa `blockly/core` |
| `apps/web/src/game/blocks.test.ts` | El **viaje de ida y vuelta** contra un espacio de trabajo sin interfaz, que es lo único que valida la decisión del J3 |
| `apps/web/src/game/BlockEditor.tsx` | El editor: inyecta el **lienzo** —sin caja—, carga el español, publica el programa y se limpia al desmontarse. Y crea **la caja aparte**: un `VerticalFlyout` suelto en el hueco que le baja la composición, con sus tres correcciones medidas |
| `apps/web/src/game/BlockEditorLoader.tsx` | **La segunda frontera de carga diferida**, la de Blockly. Calcada de `GameSceneLoader`; baja además **el hueco de la caja** |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | El banco de pruebas, **compuesto como estará la pantalla de nivel** desde el J6.3: el juego en una zona alta con el lienzo superpuesto abajo, y a la derecha caja de bloques, botones e instrucciones, en paneles flotantes. **Posee la maqueta y crea los tres huecos** —caja, botones y mensaje— que bajan a las piezas diferidas. Enseña el sobre en el `<pre>`, fuera de la maqueta |
| `apps/web/src/main.css` | Además del tema: la regla que **apaga los recortes mientras se arrastra un bloque** y la que deja **transparente el fondo del lienzo** de Blockly, las dos con su porqué |
| `apps/web/src/constants/routes.ts` | `GAME_LAB: '/dashboard/game'` |
| `apps/web/src/router/AppRouter.tsx` | Registra esa ruta **sólo** bajo `import.meta.env.DEV` |
| `apps/web/src/pages/Dashboard/Dashboard.tsx` | Un caso más en el `switch`, con la misma bandera |
| `apps/web/src/components/dashboard/Sidebar/Sidebar.tsx` | La entrada «Laboratorio 3D», visible sólo en desarrollo |

**La ruta NO puede colgar de `/dashboard/worlds/`.** `Dashboard.tsx` colapsa todo
lo que empiece por ese prefijo en `ROUTES.WORLDS` **antes** del `switch`, así que
una pantalla nueva ahí debajo no llega a su caso: sale la de mundos, sin error
que lo delate.

**El banco de pruebas no es de usar y tirar.** El J4, el J5 y el J6 se vieron
funcionar ahí, porque la pantalla de nivel real no llega hasta el J8 (paso 20).
Cuando exista, esta pantalla se revisa. **Ni el J6 ni el J6.1 tuvieron que
tocarla**, y era la comprobación de que la barra está en el sitio bueno: el
resultado y los dos contadores viven dentro del juego, bajo la frontera diferida,
para que el J8 los herede en vez de reescribirlos.

**Las fronteras del bundle son DOS desde el J4, y la regla es una.** `Blockly no
es 3D y no cuelga de la frontera del motor`: tiene la suya,
`BlockEditorLoader.tsx`, calcada de `GameSceneLoader.tsx`. Colgarlo de la que ya
existía habría metido un componente de DOM dentro de un árbol de
`@react-three/fiber`, donde los elementos no son etiquetas de HTML sino objetos
de `three`, y el J5 —que sí conecta las dos piezas— habría tenido que
desenredarlas.

La regla, que no cambia: **nada por encima de una frontera diferida importa lo
que ésa aísla.** `GameSceneLoader.tsx` no importa `three`, `BlockEditorLoader.tsx`
no importa `blockly`, y la pantalla del laboratorio no importa ninguno de los
dos. **Y los módulos puros van con su frontera**: `movement.ts` y `program.ts` no
arrastran nada, pero importarlos desde encima de la línea los mete en el trozo
principal, y con ellos la puerta abierta a que el J5 suba el intérprete detrás.

**Se importa `blockly/core`, no `blockly`.** El punto de entrada principal
arrastra la biblioteca de bloques estándar —89 kB— y el generador de JavaScript,
y este juego define sus tres bloques y no genera código: el intérprete del J5
recorre el JSON.

**Las reglas de movimiento viven sueltas del pintado a propósito, y el J5 las
reutilizó tal cual**: el intérprete no reimplementa ninguna: si hubieran nacido
enredadas con la escena, habría habido que reescribirlas. Son puras, no mutan la pose que reciben —lo que permitirá ejecutar
un programa plegando las órdenes sobre una pose inicial— y **no lanzan ni
devuelven `{ data, error }`**: esa convención es de los servicios, y chocar con
un muro no es un fallo, es una regla del juego.

**El paso de la rejilla es `TILE_SIZE = 1` y no se deduce de ningún modelo.** Los
bloques de Kenney miden 1,082 de ancho porque el labio de hierba se solapa a
propósito; sacar el paso de ahí produce rendijas, y con los modelos entrando en
el J13 el fallo aparecería con la mecánica ya escrita encima.

**El suelo va en damero de dos verdes**, y no es adorno: con un solo verde las 25
casillas se ven como un único plano y la rejilla deja de poder contarse, que es
justo lo que el niño tiene que hacer para saber cuántos pasos da. Las losas
siguen contiguas. Por lo mismo, **el personaje lleva una marca sobre la cabeza**
en la cara que mira: un cubo simétrico girado 90° es el mismo cubo, y el giro no
se vería. La marca va arriba y no en la cara porque, mirando en dirección
contraria a la cámara, el propio cuerpo la taparía.

**Las órdenes de consola ya no existen.** El J2 registró
`codeplayGame.forward()`, `.left()`, `.right()` y `.reset()` en `window` sólo en
desarrollo, y el **J5 las retiró con su requisito** —el primer `REMOVED` del
proyecto—. No fue higiene: la consola y la ejecución escribían **la misma pose**,
así que un `forward()` a mitad de recorrido dejaba al personaje en una casilla
que el recorrido no contemplaba. Dos dueños de un mismo estado. Lo que
permitían ver se ve ahora ejecutando un programa y reiniciándolo, con botones y
sin consola. La cadena `codeplayGame` no aparece en `apps/web/src`; sí en los
cambios archivados, que son el registro de lo que pasó.

**`drei` sigue sin entrar.** El roadmap lo admite fijado a `^9.122` si
`OrbitControls` hace falta; para un 5×5 en cámara fija no hace falta, y la
dependencia trae `three` en sus `peerDependencies`, con la trampa de la copia
doble de abajo. Si el J13 necesita orbitar para colocar modelos, entra ahí.

**`three` está fijado a 0.170 por el runtime, no por gusto.** Con
`@react-three/fiber` 8.18 —la rama que se queda en React 18— contra `three`
0.185.1 el lienzo se crea, el contexto WebGL vive y **la escena sale vacía**; el
único indicio es un aviso de `THREE.Clock` deprecado en consola. Con 0.170.0 se
ve. **La salida NUNCA es subir fiber**: fiber 9 exige React ≥ 19 y arrastraría
`react-dom`, los tipos, Testing Library y los tests.

**Y `three` tiene que ser UNA sola copia.** Bajar la versión sólo en el workspace
deja 0.185.1 izada en la raíz para fiber y 0.170.0 en `apps/web` para el código
propio, que es peor que cualquiera de las dos. Se arregla restaurando el
`package-lock.json` y reinstalando; **no regenerándolo**: regenerar el lockfile
en Windows se lleva por delante los binarios opcionales de otras plataformas
—los `@supabase/cli-linux-*`— y el CI corre `npm ci` sobre ubuntu-latest.

**Lo que la carga diferida consigue, medido.** El J1 dejó el trozo principal en
624,57 kB (167,68 gzip) y el motor 3D entero en un trozo aparte de 823,50 kB
(221,63), 206 módulos. **El J2 no movió el principal ni un byte**: sigue en
624,57 kB / 167,68 gzip, y lo que creció salió donde debía —el trozo del juego
pasa a 825,19 kB (222,24) y los módulos a 209—. `WebGLRenderer` aparece en ese
trozo y **cero** veces en el principal, e `index.html` **no lo precarga**, así
que quien no abra una pantalla con juego no lo descarga — tampoco en producción.

**Los tests llegaron con el J2, y sólo pueden ser de los módulos puros.** jsdom
no implementa WebGL: un test que monte `<Canvas>` no prueba la escena, prueba el
simulacro. Por eso el J1 no llevó ninguno y por eso las reglas de movimiento
están fuera del componente. El criterio de los dos pasos es verlo en el
navegador, y así se verificó.

**El J3 cerró el formato, y sólo tocó código para reconciliarlo.** Lo que decide
vive en `CONTRATO-DE-INTEGRACION.md` §4 —`config` campo por campo, el sobre
`{ formatVersion, workspace }` del programa y las reglas de recuento con un
ejemplo resuelto—, y **no cambia nada de lo que la aplicación hace**: en
`src/game/` sólo entró `optimalSteps` en `LevelConfig`, con su valor real en las
dos rejillas que existen —10 en la de pega y 3 en la del test—. Ese campo cierra
además el único punto que `DISENO-DEL-JUEGO.md` §6 dejaba abierto: el número de
pasos óptimo no tenía sitio asignado en ninguna parte.

**Lo que el J3 dejó anotado para los pasos que vienen**, medido contra el esquema
y no razonado:

- **La versión del formato viaja dentro del propio programa**, no en una columna:
  `level_attempts` no tiene ninguna para ella y `create_level_attempt` no tiene
  parámetro. De ahí el sobre, que no cuesta migración.
- **`createAttempt` llama con cuatro de los seis parámetros de la RPC** —le
  faltan `input_runtime_ms` e `input_metadata`—, así que el **J9** tiene que
  ampliar esa llamada vaya donde vaya lo que se mande.
- **Los valores por defecto de `starter_code`, `validation_rules` y
  `programming_language` no son instancias válidas del formato** (`''`, `'{}'` y
  `'javascript'`), y **las nueve filas sembradas tampoco lo cumplen**. Es lo
  esperado: las reescribe el **J7**, una migración por nivel. El §7 del contrato
  dice qué hace el juego mientras tanto, y no es reventar.

**Lo que el J4 añadió, y lo que dejó medido.**

**Blockly está fijado a `^12.5.1` por el instalador, no por gusto.** La 13 es la
primera versión que saca `jsdom` de sus dependencias normales y lo declara
**peer**, con el rango `>=27.4.0 <30.0.0`; este repositorio va con `jsdom ^30.0.1`
para Vitest, así que `npm install blockly` muere con `ERESOLVE`. La 12 no declara
ningún peer. Trae `jsdom@26.1.0` como dependencia suya —77 paquetes más en
`node_modules`— y **no pesa un byte en el navegador**: medido, la única aparición
de la cadena `jsdom` en el trozo del editor está dentro de un mensaje de error de
Blockly. Y **trae sus propios tipos**, por el mapa de `exports`; `@types/blockly`
no existe en el registro.

**El número del bloque de avanzar va en un CAMPO, no en un hueco para otro
bloque.** El contrato §4.4 exige que las repeticiones sean números presentes en
el programa, porque es lo que permite contar los pasos leyendo sin simular el
juego. Con un campo la garantía es estructural: no hay forma de escribir ahí una
expresión.

**El editor no lleva papelera, ni controles de zoom, ni sonidos**, y no es
estética: son las tres cosas que piden ficheros sueltos de `media/`, que sin
configurar su ruta dan 404 en silencio. Borrar un bloque sigue estando a mano por
las dos vías de fábrica. **Y la rueda no mueve el lienzo**: el editor es una
tarjeta de una pantalla larga, y quedarse la rueda atasca el desplazamiento de la
página al pasar el ratón por encima.

**El viaje de ida y vuelta está probado, y es lo único que valida la decisión del
J3.** Guardar el espacio de trabajo y volver a cargarlo da el mismo programa:
`blocks.test.ts` lo comprueba contra `new Blockly.Workspace()` —sin interfaz, así
que jsdom no estorba—. Ese test corre sobre `core-node.js`, que es un envoltorio
del **mismo** `blockly_compressed.js` que recibe el navegador, así que prueba la
serialización de verdad; lo que no cubre es el editor montado.

**Si el panel de vista previa no está a la vista, los frames se suspenden, y la
página no puede enterarse.** Medido el 5-sep-2026 al verificar el J4 y **afinado
en el J5**, que es donde de verdad muerde: los dos pasos animan al personaje y
viven de `requestAnimationFrame`.

**El disparador es el panel, no la ventana**, y esa precisión cuesta una tarde:
con la ventana **al frente y maximizada** pero el panel del navegador cerrado son
**cero frames en 500 ms**, y traer la pestaña al frente con `tabs_select`
tampoco basta. Con el panel abierto en pantalla, 73. En los dos casos
`document.visibilityState` sigue diciendo `'visible'` y `document.hidden` sigue
siendo `false`: la Page Visibility API no cubre este caso, así que ningún código
de la página puede distinguirlo.

**Y hay una forma barata de saber en cuál de los dos estás**: `tabs_context` lo
dice en una línea —«The Browser pane is currently displayed» o «hidden»—. Es lo
que separa «mi código no anima» de «aquí no se dibuja».

Lo que eso provoca es engañoso: **Blockly 12 encola los redibujados en un frame
de animación**, así que en cuanto uno queda encolado la tubería se atasca entera
—el bloque no se repinta y su evento de cambio nunca llega al oyente—, y parece
un fallo del editor. No lo es: el modelo se actualiza correctamente. **La salida
es traer la ventana al frente antes de verificar nada que dependa de animación**;
perseguirlo como si fuera un defecto del producto cuesta una tarde.

Consecuencia para el J4: **cambiar el número del bloque desde la interfaz quedó
sin verificar en el navegador.** El valor del campo sí se actualizaba
—comprobado contra la API de Blockly en la propia página— y el camino
modelo→JSON lo cubre `blocks.test.ts`. **El J5 lo verificó ya en la interfaz**,
con el panel delante.

**Lo que el J5 añadió, y lo que dejó decidido.**

**El intérprete es puro, y por eso está probado.** No importa Blockly ni `three`,
así que sus 14 tests corren como los de `movement.ts`. La entrada de los tests es
el **PROGRAMA A del contrato §4.3 pegado sin tocar una coma**: probar contra la
salida real del editor, y no contra un JSON construido a mano, es lo que hace que
prueben el formato del contrato y no la idea que el intérprete tiene de él.

**La frontera con `program.ts` está escrita en el propio módulo.** Aquél abre el
sobre y **se niega a propósito** a saber qué hay dentro; el intérprete lee la
carta. Si la forma de Blockly viviera en `program.ts`, el J8 y el J9 —que sólo
abren y cierran el sobre— cargarían con ella sin usarla.

**Chocar NO detiene el programa, y está metido en la estructura.** El recorrido
lleva **una entrada por paso ORDENADO**: `avanzar 4` contra un muro que está a
dos casillas deja cuatro entradas, y las que sobran repiten la pose con su
`blockedBy`. Es el contrato §4.4 —«se cuentan los pasos ordenados, no los
ejecutados»— hecho estructura, y no es un capricho: lo natural al escribir un
intérprete es pararse al chocar, y pararse hace que el número que el J6 enseñe y
el que el servidor calcule dejen de poder coincidir con lo que el niño vio. Un
test comprueba que los diez pasos que §4.4 cuenta para el PROGRAMA A son las diez
entradas que produce la ejecución.

**Dos decisiones que no estaban en ninguna parte, y ahora están en el contrato.**
La primera, §4.4: **pisar la meta y seguir cuenta como haber llegado**, porque
pasarse de largo es recorrido de más y el recorrido de más ya se paga contra
`optimalSteps`. La segunda, §4.3: con **varios montones sueltos se ejecuta el que
empieza más arriba** —`y` menor, y `x` menor a igualdad—, y no el primero del
array, que es un orden de construcción y no de pantalla.

**Encargo para el J8, y hoy no hay caso:** `readOrder` acepta cualquier entero
mayor que cero en `STEPS`, mientras el campo del editor está acotado a **1–10**.
Da igual mientras el único productor sea nuestro editor; el día que el programa
llegue de la base o de un intento guardado, un `STEPS: 50` **se ejecutaría** con
cincuenta pasos y el editor, al cargarlo, enseñaría diez. Quien valide en la
frontera decide si acota o rechaza.

**El encargo que el J5 dejó para el J6 está CERRADO**, y es el primero de §2.9
que se cierra. Decía que esa segunda regla **falla en silencio**: un bloque
suelto arriba se ejecuta en lugar del programa, el personaje da un giro y se
para, y el niño no puede distinguir «mi programa está mal» de «mi programa no se
ejecutó». Lo cerró el J6 sacando el número de montones por `readProgram` y
avisando en la barra; el detalle está más abajo.

**`@react-spring/three` no entró**, aunque el roadmap se la asignaba a este paso.
Lo que hacía falta —posición entre dos casillas, ángulo **por el lado corto** y
un topetazo contra lo que no se pisa— son tres interpolaciones sobre el `delta`
de `useFrame`, que además es el reloj que decide cuándo termina un paso: traer un
segundo planificador para animar habría sido tener dos relojes para una cosa.
`ROADMAP-JUEGO.md` §2 dice que las librerías entran «en el paso que primero las
importe», y se revisa en el **J13**, con el modelo de 25 clips delante.
**Comprobado de paso lo que el J2 dejó escrito y nunca se había ejecutado:
`npm ls three` da una sola copia, 0.170.0.**

**El reloj de la animación vive en el bucle de frames, no en el estado.** React
sólo se entera cuando un paso TERMINA —una vez cada tercio de segundo—, y el
paso en curso se compara **dentro** de `useFrame` en vez de reiniciarse desde un
efecto: un efecto y el bucle de frames no tienen orden garantizado entre sí. Y el
arranque cuelga **del evento del botón, nunca de un efecto**, porque con
`React.StrictMode` un efecto se dispara dos veces en desarrollo y eso sería el
recorrido ejecutándose por duplicado.

**El programa baja como dato y el intérprete no sube.** `StudentGameLabModule`
pasa el sobre a `GameSceneLoader`, que sólo importa su **tipo**; quien lo abre y
lo ejecuta es `GameScene.tsx`, bajo la frontera. **Medido: `readProgram`,
`runProgram` y `blockedBy` aparecen cero veces en el trozo principal.**

**Los nombres de los bloques tuvieron que salir de `blocks.ts`.** Ese archivo
importa Blockly, así que el intérprete no puede importarlo sin arrastrar la
librería entera al trozo de la escena. Viven en `blockTypes.ts`, puro, y
`blocks.ts` los reexporta para quien los busque donde estaban. La alternativa era
escribir los cuatro textos dos veces, y dos copias de un nombre no darían error:
darían un programa que se construye y no se ejecuta.

**Verificado en el navegador con el panel delante**, que es lo que el aviso de
arriba exige:

- El **PROGRAMA A** resuelve el tablero de pega de principio a fin: el personaje
  recorre la fila sur y la columna este casilla a casilla y acaba sobre la meta,
  con «¡Llegaste a la meta!» en la barra.
- **Chocar no detiene el programa**, y se ve en el estado final: cuatro
  `avanzar` contra el muro de la fila 3 dejan al personaje donde estaba, y el
  giro y el `avanzar 3` que van detrás **sí se ejecutan** — termina en el
  extremo este de la fila sur. El topetazo dura un tercio de segundo y no se
  puede congelar en una captura; lo que sí se comprobó es que no atraviesa el
  muro y que la ejecución continúa.
- **«Reiniciar» a mitad del recorrido** devuelve al personaje a la salida y deja
  la barra como al principio, y **«Ejecutar» está inhabilitado** mientras se
  ejecuta.
- **Pisar la meta y seguir**: un programa que llega y después baja tres casillas
  acaba lejos de la meta y la barra dice **«¡Llegaste a la meta!»** — la decisión
  del contrato §4.4, funcionando.
- **Lienzo vacío**: no se mueve nadie, la barra dice que no se llegó y **la
  consola no saca ningún error**.
- Y de propina, **la regla del montón de más arriba**, con dos montones sueltos
  en el lienzo: se ejecutó el de arriba y el otro se quedó quieto.

**Además queda verificado lo que el J4 no pudo**: cambiar el número del bloque
desde la interfaz. El campo se editó en el editor montado y el JSON de la
pantalla pasó a decir 4.

**Y cómo se verifica esto, que costó tiempo averiguarlo.** Los clics del panel de
vista previa **no producen eventos de puntero**, y tanto la caja de herramientas
de Blockly como su arrastre viven de ellos, así que colocar bloques desde la
herramienta pide despacharlos a mano —`pointerdown`, `pointermove`, `pointerup`—.
Los botones de HTML sí responden. Y `window.Blockly` existe en la página pero
**sólo trae `Msg`**: no hay API por la que cargar un programa de un golpe.

**Las tres últimas frases son de fiar a medias, y el J6 las midió de nuevo.** Ver
el bloque de verificación del J6, abajo: los botones de HTML **no** respondieron
al clic del panel, y sí hay forma de cargar un programa de un golpe.

**Lo que el J6 añadió: el recuento y la pantalla de resultado.**

**El recuento es una función pura sobre las órdenes, y no la longitud del
recorrido.** `countSteps(orders)` suma `avanzar N` como N y `girar` como 1, sin
tablero y sin ejecutar nada, que es como el contrato §4.4 define el recuento. La
alternativa —`run.steps.length`, que ya estaba ahí y da el mismo número— se
descartó a propósito: **el servidor puntuará leyendo el programa (J10)**, no
ejecutándolo, así que sacar de la ejecución el número que se le enseña al niño lo
ataría a un motor que el servidor no corre. La pantalla enseña la misma cuenta
que puntúa, no una paralela que se le parece.

**Y hay dos tests que hoy NO PUEDEN FALLAR, y por eso están**, en el bloque
`countSteps` de `interpreter.test.ts`: `countSteps(orders)` y
`runProgram(...).steps.length` coinciden por construcción. Lo que fijan es esa
construcción — **se rompen el día que alguien haga que chocar detenga el
programa**, que es lo natural al escribir un intérprete. Comprobado rompiéndolo,
no supuesto: metiendo un `return` al chocar caen tres tests, dos de ellos los del
recuento. El del PROGRAMA A no cae, porque ese programa nunca choca; el que tiene
dientes de verdad es el del muro.

**`readProgram` devuelve `{ orders, rootCount }`, y ahí murió el fallo
silencioso.** El número de montones **ya estaba** en `readRoots` y lo tiraba la
firma; sacarlo es lo que permite avisar de los bloques sueltos. Contarlos fuera
habría obligado a repetir `readRoots`, que además de contar valida la forma.

**El estado de la escena es un valor discriminado, no tres banderas.** Un intento
es «ilegible», «vacío» o «ejecutado» —con su recorrido, su recuento y sus
montones—, y son excluyentes. Con banderas paralelas la barra se derivaría de
combinaciones que nadie ha comprobado que no ocurran.

**El lienzo vacío se distingue por las ÓRDENES, no por los pasos.** Hoy los dos
criterios coinciden —toda orden cuesta al menos un paso—, pero eso es una
invariante de `runProgram` que nada declara. Antes del J6, un lienzo sin bloques
llegaba a `runProgram(config, [])`, salía con `success: false` y la barra decía
«No llegaste a la meta»: al niño se le contaba que su programa era malo cuando lo
que pasaba es que no había programa.

**«Perfecto» es llegar sin gastar de más, y gastar de MENOS también lo es.** La
condición es `pasos <= optimalSteps`, no `===`. Batir el número significa que el
nivel está **mal sembrado** —el contrato §4.2 ya avisa de que no lo comprueba
nadie, y el J6 le añadió el caso de enfrente—, y eso lo caza quien siembra el
nivel resolviendo su puzle, no el niño que lo juega. Lleva texto propio porque el
de los pasos justos afirma una igualdad que ahí sería falsa. **Ese texto no se ha
visto nunca**: `debugLevel.optimalSteps` vale 10 y 10 es el óptimo real de ese
tablero, así que en el laboratorio no hay forma de llegar con menos.

**El aviso de los sueltos acompaña al resultado y no lo sustituye.** El montón de
arriba sí se ejecutó y su resultado es real; §4.3 ya se negó a rechazar el
programa por tener bloques sueltos para no castigar el olvido en una esquina. Y
avisa por número de **montones**, no de bloques: recorrer lo que no se ejecuta
para poder decir un número más grande no compra nada.

**El principal no se movió ni un byte** —625,00 kB, los mismos 221 módulos—, y lo
que creció salió en `GameScene`: 829,26 → **830,27 kB**. Medidas en §4.8.

**Cuidado con la marca que se elige para probar la frontera: `countSteps` no
sirve.** Sale **cero** en el trozo principal y también en el de `GameScene`,
porque el minificador renombra los nombres locales, así que un cero ahí no prueba
nada. Las marcas que sobreviven son `rootCount` —es propiedad de un objeto: 4 en
`GameScene`, 0 en el principal— y los textos de la barra, que no se pueden
renombrar. Es el mismo género de trampa que `grep -c` frente a `grep -o`.

**Verificado en el navegador, con el detalle de qué no se pudo ver:**

- **PROGRAMA A**: «¡Perfecto! Llegaste a la meta con 10 pasos, justo lo que cuesta
  la mejor solución.»
- **Llegar gastando de más**: el programa que pisa la meta y se va —13 pasos—
  dice «¡Llegaste a la meta! Usaste 13 pasos y la mejor solución cuesta 10
  pasos.» La regla de §4.4 sigue en pie con el recuento delante.
- **No llegar**: `avanzar 2` dice «No llegaste a la meta. Usaste 2 pasos y la
  mejor solución cuesta 10 pasos.»
- **Lienzo vacío**: «No hay bloques que ejecutar. Arrastra alguno al lienzo.», sin
  recuento y sin un solo error en consola.
- **Dos montones sueltos**, que es el encargo del J5: un giro olvidado arriba y el
  PROGRAMA A debajo dan «No llegaste a la meta. Usaste **1 paso**...» **más** el
  aviso «Te sobraron bloques sueltos: sólo se ejecutó el montón de más arriba.»
  De propina, el singular: las dos cantidades pasan por un ayudante que escribe
  «1 paso» y no «1 pasos».
- **Durante la ejecución** sólo se ve «Ejecutando el programa…», sin resultado ni
  recuento, y «Ejecutar» está inhabilitado. **«Reiniciar»** devuelve la barra al
  texto inicial.
- **Lo que NO se pudo provocar**: el caso de pulsar «Ejecutar» **antes de que el
  editor publique** su primer programa. Intentado dos veces con sondeo cada 5 ms
  tras recargar; en desarrollo el editor publica antes de que el botón sea
  pulsable. Es el mismo camino que el lienzo vacío —`{}`— y queda **sin observar
  por separado**.

**Y cómo se verifica esto, corregido TRES veces respecto de lo que el J5 dejó
escrito arriba. Las tres corrigen algo que aquel paso dio por cerrado, y las tres
ahorran una tarde:**

1. **Un panel oculto ya no obliga a traerlo al frente: basta emular un viewport
   con `resize_window`.** Ésa es la salida, y hay que contar aparte cómo NO se
   diagnostica, porque el camino equivocado cuesta la tarde que esta nota quiere
   ahorrar.

   **Contar frames con `requestAnimationFrame` NO sirve para saber si la escena
   avanza.** Con el panel oculto y sin emular nada, la página da **60 fps
   sostenidos** —31 frames en 500 ms, 181 en 3 segundos— y `document.hidden`
   sigue en **`false`**, y **la escena está congelada igualmente**: un PROGRAMA A
   de 3,4 segundos dejado correr 8,6 seguía diciendo «Ejecutando el programa…».
   Lo que el panel oculto suspende **no es el `requestAnimationFrame` de la
   página**, que corre, sino **el bucle de render de `@react-three/fiber`**, que
   es el que mueve `useFrame` y por tanto el recorrido. Quien mida frames verá
   sesenta, concluirá que hay animación y se pondrá a buscar el fallo en su
   código con la escena parada.

   **La señal fiable es que el recorrido progrese** —que la barra deje de decir
   «Ejecutando»—, o `tabs_context`, que dice en una línea si el panel está a la
   vista. Y el remedio es `resize_window` con un tamaño concreto sobre esa
   pestaña: en cuanto se llama, el recorrido termina y sale el resultado, con el
   panel igual de oculto.

   **Una medición discrepante, para que no se lea como el comportamiento.** En la
   máquina del J6, sobre la pantalla de login y antes de emular el viewport,
   salieron **0 frames en 500 ms** con `document.hidden` en **`true`**; en la de
   la sesión que revisó, sobre el laboratorio, 60 fps con `hidden` en `false`.
   Vale lo segundo como comportamiento —es además lo que el J5 midió, y el motivo
   por el que la página no puede enterarse sola—; lo primero queda anotado como
   lo que es, una lectura que no se ha vuelto a reproducir.
2. **Los botones de HTML NO respondieron al clic del panel, y sí a un `.click()`
   de JavaScript.** El párrafo de arriba dice lo contrario. Medido: el clic del
   panel sobre «Ejecutar» —un `<button>` con `onClick` de React— no disparó nada
   dos veces seguidas, y el mismo botón con `.click()` desde `javascript_tool`
   funcionó a la primera. Lo mismo con el botón «Niño» de «Sin login».
3. **Y sí hay forma de cargar un programa de un golpe**, aunque `window.Blockly`
   sólo traiga `Msg`: en desarrollo se puede importar desde la página el mismo
   módulo que importó la aplicación —`/node_modules/.vite/deps/blockly_core.js`,
   con su `?v=`, que Vite deduplica por URL— y desde ahí salen
   `getMainWorkspace()` y `serialization.workspaces.load`. Cargar así **dispara
   el escuchador del editor**, y el sobre de la pantalla se actualiza solo. Es lo
   que hizo innecesario despachar arrastres a mano en todo el J6.

   **Y NO SE FÍE NADIE DE QUE LOS BLOQUES APAREZCAN: eso no prueba que hayan
   llegado.** Añadido en el J6.1, donde la sesión que revisó no consiguió
   reproducirlo — cinco bloques pintados en el SVG del editor y el sobre de la
   pantalla en `"workspace": {}`, con cero eventos en su propio escuchador—.
   **La comprobación que sí vale es el `<pre>` del laboratorio**: si después de
   cargar no contiene `codeplay_advance`, el programa **no ha llegado a la
   aplicación** y lo que se verifique encima no vale nada. En la sesión que
   implementó funcionó desde una pestaña recargada de cero, con el sobre lleno y
   dos eventos en el escuchador, así que el camino existe; lo que no está
   averiguado es por qué falla a veces.

   **La causa está SIN ENCONTRAR, y no hay sospechoso vigente.** Lo que se
   descartó midiendo, en la propia pestaña que falla: el espacio de trabajo **no
   es uno desechado** por el doble montaje de `React.StrictMode`
   —`getInjectionDiv().isConnected` da **`true`**—, el espacio tiene **cuatro
   escuchadores vivos** y `Events.isEnabled()` es **`true`**, así que el canal
   tampoco está apagado. Los bloques se pintan y el sobre se queda vacío, y nadie
   sabe por qué.

   **Y por eso la comprobación es el `<pre>` y ninguna otra**: `isConnected` sale
   **bien en el caso que falla**, así que quien lo use como señal concluirá que su
   carga llegó y verificará encima de nada. Es la misma trampa que contar frames
   en el J6, con otro disfraz.

**Lo que el J6.1 añadió: el contador en vivo, y por qué son dos piezas.**

**AVISO: la mitad de este bloque duró un día.** El **J6.2** retiró la pieza de
«mientras construye» el mismo 7-sep-2026, por decisión del usuario. Lo que sigue
se conserva porque es **el registro de lo que pasó** —y de por qué la pieza se
pudo quitar de un tirón—, no la descripción de lo que hay hoy. Lo que hay hoy
está en el bloque del J6.2, más abajo.

**El J6 enseñaba el recuento sólo AL TERMINAR, y eso lo decidió su propuesta sin
preguntar.** Su `design.md` puso «ningún recuento en vivo» entre los Non-Goals
con un argumento propio —«el criterio del roadmap es al terminar»—. El usuario lo
vio terminado y pidió lo contrario el 7-sep-2026: el niño tiene que ver lo que
cuesta su programa **sin contar los pasos a ojo**. La decisión está en
`ROADMAP-JUEGO.md` §3.

**Son DOS NÚMEROS DE DOS FUENTES DISTINTAS, y no se mezclan nunca.** Es lo único
que hay que saber para tocar esta barra:

- El **coste del lienzo** sale de la **propiedad `program` en el pintado**, con
  `useMemo`.
- El **paso en curso** sale del **intento congelado** —`attempt.steps` y el
  `index` que la escena ya llevaba—, **jamás de la propiedad**.

Si el segundo saliera de la propiedad, mover un bloque a mitad de recorrido
cambiaría el contador que el niño está viendo correr, **que es el fallo exacto
que el J5 evitó** sacando el programa del estado de React. Ese `useRef` de
`latest` sigue intacto y no lo contradice pintar desde la propiedad: existe para
que `start()` lea el valor fresco sin arrastrar closures, no para prohibir
pintar. **Comprobado en el navegador**: con un recorrido de 13 pasos en marcha se
cargó otro programa de 1 paso, y el contador siguió diciendo «de 13» hasta
terminar.

**La pieza de construcción es RETIRABLE, y eso es requisito del usuario, no un
consejo.** Enseñar el coste antes de ejecutar es una elección pedagógica y puede
cambiar si la profesora lo dicta; en ese caso se queda sólo el contador de la
ejecución. Por eso son **dos requisitos** en el spec y no uno, y por eso lo que
hay que borrar es una lista corta: el requisito, `programCost` con sus tests, y
en `GameScene.tsx` el `useMemo`, la línea del coste y sus dos textos. **Se
comprobó borrándolo de verdad**: la escena compila, pasa el lint y el contador de
la ejecución no se entera. Después se deshizo.

**`programCost` existe por lo que COLAPSA, no por ahorrar tres líneas.** Devuelve
`null` en los tres casos en que no se pinta nada —sin programa, ilegible y sin
órdenes—, mientras que `start()` tiene que distinguirlos porque cada uno lleva su
texto al terminar. Y está en el módulo puro porque **dentro del componente esos
casos no se pueden probar**: jsdom no implementa WebGL. Son 7 tests nuevos.
`interpreter.ts` pasó a importar de `program.ts` un **valor** donde sólo importaba
un tipo; medido en §4.8, no movió nada de trozo.

**Con montones sueltos se avisa YA AL CONSTRUIR, en presente y con texto propio.**
El número que se enseña es el del montón que se ejecutaría, no la suma, y
enseñarlo callando **reabriría mientras se construye** el fallo silencioso que el
J6 cerró al terminar. No reutiliza el aviso del J6, que habla en pasado de una
ejecución que aún no ha ocurrido. **El parpadeo que se temía no ocurre**: en
Blockly 12 el arrastre es un evento de INTERFAZ —`isUiEvent` es `true`, medido en
la página—, y el editor no publica por ellos, así que el aviso sólo cambia al
soltar. Un bloque sacado de la cadena **es** un montón suelto, y el aviso dice
justo eso mientras lo esté.

**Y ese aviso CEDE cuando el del resultado está en pantalla**, que es un cruce
que se vio revisando el código y no diseñándolo. Al terminar una ejecución con
montones sueltos vuelven a la vez el aviso del lienzo y el del J6, y el niño leía
la misma frase dos veces y en dos tiempos —«sólo se ejecutará» y «sólo se
ejecutó»—, las dos en coral. Manda el del resultado. Que la pieza retirable mire
a la que se queda **no rompe la separabilidad**: la dependencia va en esa
dirección y nunca al revés.

**Mientras corre el recorrido, el coste del lienzo se calla.** El niño no está
construyendo, y un número del lienzo que cambia bajo una ejecución que no
gobierna se lee en pantalla como un fallo. Al terminar vuelve, aunque repita el
número del resultado: esconderlo cuando coincide obligaría a **comparar las dos
fuentes para decidir qué se pinta**, que es justo lo que esta barra no hace. Los
separan el tiempo verbal y el sujeto —«Usaste 10 pasos» contra «Tu programa
cuesta 10 pasos»—, y en cuanto el niño toca un bloque dejan de decir lo mismo.

**Verificado en el navegador, con el viewport emulado:**

- **El coste sube y baja al construir**: el PROGRAMA A dice «Tu programa cuesta
  10 pasos. La mejor solución cuesta 10 pasos.» **sin haber ejecutado nada**;
  encadenar un giro lo pone en 11 y quitarlo lo devuelve a 10.
- **Dos montones sueltos**: cuesta **«1 paso»** —el de arriba, no la suma de 5— y
  sale «Tienes bloques sueltos: sólo se ejecutará el montón de más arriba.» Al
  **terminar** la ejecución de ese mismo lienzo queda **un solo aviso**, el del
  resultado, y «Reiniciar» devuelve el del lienzo.
- **Lienzo vacío**: **ninguna línea de coste**, ni «0 pasos», y la consola sin un
  solo error.
- **Durante la ejecución**: «Ejecutando el programa… paso 2 de 10», subiendo
  hasta «paso 10 de 10», **sin la línea del coste**, y al terminar el resultado
  con el mismo número.
- **«Reiniciar» a mitad**: el contador desaparece y el coste del lienzo vuelve.
- **Con el resultado en pantalla**, quitar un bloque deja «¡Perfecto! …con 10
  pasos» junto a «Tu programa cuesta 6 pasos», que es la divergencia útil: lo que
  usó contra lo que tiene puesto ahora.
- **Lo que NO se pudo provocar**: el **programa ilegible**. El editor sólo produce
  los tres bloques conocidos y su campo de pasos es numérico y acotado, así que
  `readProgram` no tiene por dónde devolver `null`. El camino lo cubre un test de
  `programCost` y **queda sin observar en pantalla**, como el «antes de que el
  editor publique» del J6.

**Y una frase del contrato §4.2 murió con este paso**: decía que el niño ve
`optimalSteps` «en pantalla al terminar». Ahora lo ve también mientras construye.
El argumento que autoriza tenerlo en un `config` público no cambia —**un número
no es una solución**—; lo que cambió es el cuándo, y está corregido allí.

**Lo que el J6.2 quitó, el mismo día: el coste al construir.**

**Y esto es lo que hay hoy**, no lo de arriba. **Decidido por el usuario el
7-sep-2026** con el J6.1 funcionando delante, y su motivo, literal:

> el niño se va a matar la cabeza pensando cómo llegar al final con sólo 10
> pasos en vez de llegar al final

Enseñar el número a batir **antes** de haber resuelto nada convierte el nivel en
un problema de optimización cuando todavía es un problema de **llegar**. Es un
juicio de producto y manda: la eficiencia se aprende **después**, con el
resultado del J6, y la XP ya premia mejorar en un segundo intento. La frase del
contrato §4.2 volvió a lo que decía, con el porqué escrito para quien lo
replantee.

**La separabilidad del J6.1 se cobró, y aguantó.** Se borraron el requisito,
`programCost` con sus siete tests y las cinco cosas de `GameScene.tsx`, y **no
hubo que tocar nada de lo que se quedaba**. La prueba concreta, porque era
falsable: la línea de `warning` —el aviso de sueltos del J6— **no cambió ni una
letra**, y `interpreter.ts` e `interpreter.test.ts` quedaron **byte a byte** como
estaban antes del J6.1. Lo único que sobrevive de aquel paso en la escena es el
valor `active`, que la barra usa.

**El contador se quedó y cambió de sitio: vive SUPERPUESTO al lienzo**, arriba a
la derecha, y dice **«7 pasos»** — lo que lleva dados, **nunca el total ni el
óptimo**, que es la misma presión con otra letra. La barra recuperó su
«Ejecutando el programa…».

**Y no puede vivir dentro del `<Canvas>`**: ahí los elementos son objetos de
`three` y no etiquetas de HTML. Es un `<p>` absoluto sobre un contenedor
`relative`, con los nombres de color del tema. Meterlo en la escena habría pedido
`Html` de `drei`, que no está instalado y que arrastra `three` con la trampa de
la copia doble: una dependencia por un `position: absolute`.

**Y el aviso de bloques sueltos al construir SE QUEDA**, que es la mitad de la
pieza que el usuario sí quiso. Se le preguntó porque **su motivo no cubría esta
parte** —ese aviso no enseña ningún número y no presiona a nadie— y lo conservó:
evita que el niño crea que su programa está mal cuando lo que pasa es que **no se
ejecutó**, el fallo en silencio del J5. Vive ahora en un **requisito propio**, no
pegado a otro, por lo mismo que permitió retirar el anterior de un tirón.

Y por eso `programCost` no desapareció: **se encogió**. En su sitio está
`hasLooseStacks(program): boolean`, que responde lo único que queda por
preguntarle al lienzo. **Devuelve un booleano y no el número de montones a
propósito**: ese número no lo enseña nadie —el aviso dice que sobró algo, no
cuánto— y devolverlo dejaría puesta la cifra que este paso vino a quitar.
Seis tests, los mismos casos que muerden.

**Verificado en el navegador**, con el viewport emulado y el `<pre>` comprobado
antes de nada:

- **Nada al construir**: con el PROGRAMA A en el lienzo y sin ejecutar, la
  pantalla **no dice ningún número de pasos** ni menciona la mejor solución.
- **El contador sube sobre el lienzo**: «2 pasos» → «10 pasos» en la esquina,
  con la barra diciendo sólo «Ejecutando el programa…».
- **Al terminar** desaparece y sale el resultado del J6, y «Reiniciar» a mitad lo
  quita.
- **No se mueve al tocar el lienzo con el recorrido en marcha**: con 13 pasos
  corriendo se cargó otro programa de 1 paso y el contador siguió hasta 13.
- La consola, sin un solo error, y el contador no tapa ninguna casilla.

**Y lo que NO se pudo verificar en pantalla, que conviene saber antes de fiarse
del bloque de arriba**: el aviso de sueltos **después** de reengancharlo a
`hasLooseStacks`. Todo lo anterior se comprobó con la pieza recién retirada —y
entonces, con dos montones, no salía nada al construir y sí al terminar—; cuando
el usuario decidió conservar el aviso, el fallo de carga de programas se había
quedado fijo en «off» y ya no hubo forma de meterle un programa a la aplicación.
Lo que decide el aviso lo cubren los **seis tests** de `hasLooseStacks`; **el
cableado quedó sin ver**, y se dice en vez de darlo por bueno.

**Lo que el J6.3 recompuso: la pantalla, y el mapa que se mueve.**

**Pedido por el usuario el 7-sep-2026 con un boceto delante**, y va **antes del
J7** por el orden de los errores: sembrar tres niveles y descubrir después que la
pantalla se compone de otra manera obliga a rehacer lo que ya está en la base.
Desde aquí, **el laboratorio ES la maqueta de la pantalla de nivel** y el J8 la
hereda.

**LA MAQUETA SON PANELES FLOTANDO SOBRE EL JUEGO, y la forma tardó TRES vueltas
en fijarse.** El usuario vio el paso implementado el 8-sep-2026 y devolvió **seis
defectos**; lo que sigue describe la pantalla **después** de corregirlos.

**Las tres formas, porque la segunda parecía la buena:**

1. **Tres tarjetas apiladas** —lo primero que se implementó—: devuelto.
2. **Un único rectángulo con líneas finas dentro**, que es lo que el usuario pidió
   al devolver la primera. Implementado y medido.
3. **Paneles flotantes**, que es lo que hay hoy: el 3D llena su zona de borde a
   borde y encima van, superpuestos, la bandeja del lienzo abajo y los dos
   paneles de la derecha. Sin bordes gruesos: esquinas muy redondeadas, sombra
   suave y blanco sobre el fondo del tema. Lo fijó el usuario con **una imagen**
   el 9-sep-2026.

**Lo que NO cambió en ninguna de las tres es el reparto de zonas**, que viene del
boceto y es lo que hereda el J8:

- **la caja de bloques y los controles y las instrucciones van PEGADOS**, en un
  solo panel partido por una línea clara: eran dos paneles con un hueco entre
  medias y se leían como dos sitios distintos de la pantalla, siendo dos
  apartados del mismo sitio. El recuadro de las instrucciones **crece con lo que
  sobre**, porque el texto del nivel real no tiene una longitud fija y un panel
  cortado a la medida del de ejemplo deja media zona en blanco;
- **el juego, en UNA zona alta** —todo el alto de la columna derecha—, con el
  contador de pasos arriba a la derecha y «Vista inicial» arriba a la izquierda;
- **el lienzo DENTRO de esa zona**, superpuesto al 3D por su parte baja como una
  bandeja, con su etiqueta y el mensaje en la misma franja de título;
- **a la derecha**: la caja de bloques, los tres botones **en fila** y las
  instrucciones.

**La franja de controles desapareció**, y con ella la banda que la primera
versión puso sobre el juego.

**Detalles del aspecto que la imagen fijó y que el J8 hereda:** «Vista inicial» y
«Pasos: N» son **píldoras oscuras** superpuestas al juego, con icono; los tres
botones van en fila —«Ejecutar» ancho con el icono al lado, los otros dos
estrechos con el icono encima— y **«Detener» es GRIS y no coral**, porque parar
no es un error y el coral en este tema dice que algo ha ido mal; los rótulos
«Lienzo», «Bloques» e «Instrucciones» llevan icono; y **los dos giros pasan a
tener colores distintos** —naranja y morado—, que es lo único de esto que no es
maquetación: son el único par de bloques cuyo texto se diferencia en la última
palabra, y en la caja el niño los busca por el color antes de leerlos.

**LOS BLOQUES LOS DIBUJA OTRO RENDERIZADOR, y eso no es CSS.** Blockly calcula
cada bloque como un `<path>`, así que redondearlos o engordarlos no se hace con
hojas de estilo: se hace eligiendo renderizador. Se pasa a **`zelos`** —el de
Scratch, que viene dentro de `blockly/core` y no cuesta dependencia—: bordes
redondos, campos en píldora y texto blanco en negrita. Con él van un **tema**
propio que les pone la tipografía del proyecto y **un icono por bloque** —flecha
arriba y las dos de giro—.

**Los iconos van EN LÍNEA, como `data:`, y no como ficheros.** Un `field_image`
pide una URL, y un fichero suelto es exactamente la trampa que el J4 evitó al
quitar papelera, zoom y sonidos: sin configurar la ruta de `media/` dan 404 en
silencio. **Y no tocan el contrato**: `field_image` no guarda estado, así que el
JSON sigue siendo `fields: { STEPS: n }` y nada más — comprobado, el viaje de ida
y vuelta de `blocks.test.ts` pasa sin cambiarle una coma.

**Y ahí se cobró la deuda que el J6.3 dejó anotada: LA CAJA YA NO HEREDA LA
ALTURA DEL LIENZO.** Era cosmético mientras el hueco la recortaba y la caja podía
desplazarse; desde que no se desplaza, lo que no cabe no se alcanza, y con los
bloques de `zelos` —56 px cada uno contra 32— el tercero se quedaba cortado. Se
sobrescribe `getHeight()` para que devuelva la altura de su hueco. El fondo se
sigue dibujando con la del lienzo y da igual, porque es transparente.

**Y LA CAJA TIENE QUE LLEVAR LAS CLASES DEL RENDERIZADOR Y DEL TEMA**, o sus
bloques se pintan a medias. Blockly no da esos estilos sueltos: los inyecta con
ámbito —`.zelos-renderer.codeplay-theme …`— y pone las dos clases **en el
`injectionDiv`**, que un flyout suelto no tiene. Sin ellas la caja se queda sin
el `fill: #fff` del texto, sin los colores de los campos y sin las reglas de
pasar el ratón por encima; **el síntoma es que el texto de los bloques desaparece
al pasarles el cursor**, y perseguirlo como un problema de CSS propio no lleva a
ningún sitio. Se le añaden al hueco al montar y se le quitan al desmontar.

**TRES FONDOS DE BLOCKLY SE APAGAN EN `main.css`, y hacen falta los tres**: el
blanco del `<svg>` del lienzo, el rectángulo que dibuja bajo los bloques y **el
del flyout** —un gris que ni llegaba al borde de su hueco ni era el fondo que la
maqueta le pone a esa zona, así que se leía como un recuadro suelto detrás de los
bloques—. Con uno solo, el siguiente lo tapa igual: comprobado quitando el
rectángulo primero y no viéndose nada.

**Y LA ESCALA DE LA PANTALLA ES FRÍA, con cinco nombres nuevos del tema**
—`sky-high`, `sky-mist`, `mist`, `mist-soft` y `mist-line`—: blancos y grises con una gota
de azul, apenas perceptible, para que los paneles no compitan con el cielo del
tablero. **El fondo del juego es ese cielo**: un degradado de cuatro paradas
—azul claro sostenido el primer cuarto, más suave en medio y casi blanco al
borde de abajo—, puesto en la zona y no en la escena, porque el `<canvas>` se
dibuja transparente y deja ver lo que hay detrás. Cuesta cero de 3D. El reparto
de las paradas se reajustó después del J6.3; el porqué, al final de este
apartado.

**Los cinco van en `main.css` Y en `tailwind.config.js`**, que es la
duplicación deliberada del proyecto, **y además como utilidades escritas a mano**
—igual que los alias `primary`/`secondary` que ya estaban—: un color nuevo en la
configuración de Tailwind **no aparece hasta reiniciar el servidor de
desarrollo**, y eso costó una vuelta entera creyendo que las clases estaban mal
puestas. Escritas a mano, el nombre existe desde que se guarda la hoja.

**El lienzo se queda con UNA barra, la vertical, y fuera del cuadro.** La
horizontal cruzaba la zona de edición por debajo y no llevaba a ninguna parte
—los bloques se encadenan hacia abajo—; se apaga con
`scrollbars: { horizontal: false, vertical: true }`, que además no reactiva la
rueda porque `wheel: false` va explícito. **Y el lienzo empieza arriba**, no por
donde Blockly lo deje: de fábrica centra la vista en el contenido, y con el
lienzo vacío eso deja la barra a media altura y sitio por encima de donde va a
caer el primer bloque. Y el cuadro discontinuo **se dibuja
aparte y acaba antes** que el hueco del editor, de modo que la barra —que Blockly
pinta pegada al borde derecho del suyo— queda fuera de él.

**Y AQUÍ MURIÓ UN FALLO QUE DEJABA LA PANTALLA EN BLANCO, con su test.**

Separar dos bloques pegados tumbaba el laboratorio entero. La traza, que es lo
que lo cerró en un minuto después de dos tardes sin reproducirlo:

```
Uncaught TypeError: Cannot read properties of null (reading 'type')
  at readOrder (interpreter.ts)  at readProgram  at hasLooseStacks
  at GameScene
```

**Blockly serializa `next: { block: null }` mientras se arrastra el bloque de
abajo**, y el editor publica ese estado intermedio. En `readProgram`, la línea
`block = block.next?.block` devolvía ese `null` tal cual y el bucle seguía
—porque `null !== undefined`—, así que `readOrder` recibía `null` y reventaba
leyéndole el tipo.

**Y reventar ahí no se queda ahí**: `hasLooseStacks` corre en el **pintado** de
la escena, así que la excepción se lleva por delante el árbol de React y la
pantalla se queda en blanco. Es la única función pura del intérprete que corre en
render, y por eso es la única que puede hacer esto: `readProgram` está escrita
para **no lanzar nunca** —devuelve `null` ante lo que no entiende— y este camino
era el que incumplía su propio contrato.

Ahora la cadena se acaba en cuanto lo que sigue no es un bloque, y **se para en
vez de rechazar el programa entero** porque eso es lo que se ve en pantalla: el
bloque de abajo está en el aire y la cadena que queda termina donde termina.
**El test lleva el `null` literal** y se comprobó que muerde: con la línea vieja
falla con ese mismo `TypeError`.

**La lección, que es la de siempre en esta sección**: el fallo era de una función
declarada pura y probada, y ninguno de sus 34 tests lo cazaba porque **la forma
que lo dispara sólo la produce Blockly a mitad de un arrastre**. Nadie la habría
escrito a mano.

**EL LIENZO SE PLIEGA Y SE ESTIRA**, porque tapa el juego justo cuando hay algo
que mirar: el niño construye, ejecuta, y entonces la bandeja le estorba. Un botón
en su franja la pliega hasta dejar sólo el título, y un tirador en su borde de
arriba —el que se mueve, porque está anclada abajo y crece contra el juego— la
estira entre 90 y 380 px.

**Plegar NO desmonta el editor**, y ésa es la única decisión que hay aquí: el
espacio de trabajo de Blockly vive dentro de ese componente, así que desmontarlo
se llevaría por delante los bloques que el niño lleve puestos. Se le deja el
hueco en **cero** y el editor sigue montado. Verificado con la altura de partida
de hoy: con dos bloques puestos, plegar deja la bandeja en 120 px con los dos
bloques vivos, y al abrir el lienzo vuelve a **130 px** **y los dos se ven
dentro**.

**Y sin animar la altura.** Animarla obliga a Blockly a recomponerse en cada
frame —el `ResizeObserver` del editor mira ese mismo hueco— y, además, **una
transición no avanza si la página está estrangulada**: medido, el pliegue se
quedaba a medias con `document.hidden` en `false` y el `style` ya puesto en
`height: 0`. Es el mismo estrangulamiento de §4.10, con otro disfraz.

**Y el lienzo vacío dice para qué es**: un marco discontinuo con el texto «Aquí
verás la secuencia de bloques que crees.» dentro, pintado **debajo** del editor.
Para que se vea a través hay que quitarle a Blockly **DOS fondos y no uno**, los
dos en `main.css`: el blanco del `<svg>` y el rectángulo que dibuja bajo los
bloques. Con uno solo, el otro lo tapa igual — comprobado quitando primero el
rectángulo y no viéndose nada. Debajo y no encima, porque encima taparía el bloque que el niño
arrastra, que es justo lo que el defecto 1 vino a arreglar. **El hueco de la
ilustración se deja vacío**, como manda el repo hasta que existan las
definitivas: la imagen del usuario lleva ahí una mascota.

**LA CAJA DE BLOQUES VIVE SEPARADA DEL LIENZO, Y ESO NO ERA CSS.** Es lo que
había que medir antes de prometer la maqueta, y lo que el J8 va a repetir tal
cual. `TOOLBOX` era un `categoryToolbox` de una categoría y el desplegable
pertenecía al espacio que inyecta `Blockly.inject`; el hueco de una inyección es
un **rectángulo**, y la maqueta pide dos esquinas opuestas de la pantalla.

**La salida es un `VerticalFlyout` suelto**, creado a mano y colgado de
**cualquier** nodo del DOM. Es API pública y está documentada en `createDom`: el
flyout «puede existir como su propio SVG». `VerticalFlyout`, `Options` y
`utils.Svg` se exportan desde `blockly/core`, que es lo que ya se importaba.
Medido con las dos piezas a **887 px** y en tarjetas distintas: el arrastre
cruza, el bloque se crea en el espacio principal y **el `<pre>` pasó a contener
`codeplay_advance`**.

**Y LLEVA TRES CORRECCIONES, las tres medidas y las tres necesarias:**

1. **El bloque no cae donde se suelta.** Blockly resta los orígenes de los dos
   espacios midiendo cada uno **relativo a su propio `injectionDiv`**, y un
   flyout suelto no tiene ninguno: las dos cifras salen en marcos distintos y la
   resta no significa nada. Soltando en (650,1300) el bloque aparecía en el
   origen del lienzo. Se sobrescribe `getOriginOffsetInPixels` en el espacio del
   flyout para devolver su origen **en el marco del lienzo**; con el parche,
   soltando en (650,1300) con el bloque agarrado por (20,16) cayó en
   **(630,1284)**: exacto, no aproximado.
2. **LA ZONA DE BORRADO NO SIRVE, Y SE RETIRA ENTERA.** La de un flyout vertical
   es un **semiplano sin límite vertical**: con el valor de fábrica —la caja a la
   izquierda— se traga todo lo que se suelte a su izquierda, **y eso es el lienzo
   entero**. Medido en la página y confirmado en el compilado: a la izquierda da
   `Rect(-1e9, 1e9, -1e9, borde)` y a la derecha `Rect(-1e9, 1e9, borde, 1e9)`.
   La primera versión del J6.3 lo resolvió declarándole el lado derecho, y
   **estaba mal**: salvaba el lienzo, que era lo que se estaba mirando, y dejaba
   media pantalla borrando en silencio. Lo que la maqueta necesita es «todo menos
   el lienzo», que **no es un rectángulo** y por tanto ningún `getClientRect`
   puede describir. Hoy `getClientRect()` devuelve `null` —la caja desaparece de
   la lista de destinos de arrastre— y quien decide es la regla del retorno, más
   abajo.
3. **Y el lado, además, lo COLOCA.** Declararle el lado lo sitúa contra el borde
   derecho **del lienzo** —donde estaría si fuera suyo—: se fue a 1375 px en una
   ventana de 1280 y la caja salió vacía. `getX()` y `getY()` a cero lo devuelven
   a su hueco. **Este tercero no estaba previsto en la propuesta**: apareció al
   maquetar. `toolboxPosition` sigue puesto a la derecha, pero ya sólo gobierna
   **por qué lado se redondea el fondo de la caja**; el sentido del arrastre
   nunca lo gobernó —`isDragTowardWorkspace` de un flyout vertical acepta los dos
   lados por igual, comprobado en el fuente—.
4. **Y NO LLEVA BARRA DE DESPLAZAMIENTO.** Blockly se la pone a todo flyout,
   quepa o no su contenido, y la coloca en el borde del SVG del flyout —que no es
   el borde del hueco que se ve—, así que salía flotando en medio de la caja y
   estrechando los bloques. Se destruye `flyoutWorkspace.scrollbar` después de
   `init`. Con los tres bloques de hoy sobra sitio —**152 px de contenido en una
   caja de 200**, medido—; el día que el J7 traiga más habrá que decidir cómo se
   llega a los que no quepan, y entonces **la altura heredada del lienzo deja de
   ser cosmética**: sin barra, lo que no cabe no se alcanza.

**La caja hereda además la ALTURA del lienzo** —`position()` lee las métricas de
vista del espacio destino—, así que su hueco la recorta y los dos miden 200 px.
**Y la categoría «Movimiento» desapareció**: la caja enseña los tres bloques,
siempre abiertos. Era un clic entre el niño y sus bloques.

**EL BLOQUE QUE SE ARRASTRA SE VE TODO EL RATO, Y ESO TAMPOCO ERA GRATIS.** El
bloque agarrado se dibuja dentro del SVG del lienzo, y ese SVG —como el hueco de
la inyección, la bandeja y el marco— recorta lo que se sale. Con la caja arriba a
la derecha y el lienzo abajo a la izquierda **el trayecto entero pasa por fuera**:
en la primera versión el niño sacaba un bloque de la caja y lo perdía de vista
hasta que entraba en el lienzo, cruzando a ciegas por encima del juego.

Se apagan los cuatro recortes **sólo mientras dura el arrastre** —y el vuelo de
vuelta—, con una clase en la raíz del documento que enciende `BlockEditor` al
recibir el evento de arrastre de Blockly. La regla vive en `main.css`, junto a
las zonas que recorta, y de paso le sube la bandeja por encima de la columna
derecha. **Sólo mientras dura**: apagados en reposo, un bloque colocado lejos del
centro del lienzo se saldría de la bandeja y se dibujaría sobre el juego.

**SOLTAR FUERA DEL LIENZO DEVUELVE EL BLOQUE A LA CAJA, Y SE LE VE VOLVER.** Es
la otra mitad de lo mismo: si el bloque cruza a la vista pero desaparece al
soltarlo, el niño sigue sin saber a dónde ha ido. La caja es de donde salen los
bloques y donde siempre están los tres, así que devolverlo ahí es la única
respuesta que el niño puede leer sin que nadie se la explique.

**El vuelo se pinta moviendo el propio bloque, no una copia**: una copia perdería
los filtros que Blockly define dentro de su SVG y saldría en negro o no saldría.

**Y el punto donde se soltó se apunta ANTES que Blockly**, en un oyente de
`pointerup` en fase de captura. Esto es lo que costó y lo que hay que saber:
medir dónde quedó el bloque **cuando llega el evento de movimiento no vale**,
porque Blockly reparte sus eventos en un `requestAnimationFrame` y para entonces
**ya ha desplazado el lienzo hasta el bloque**. Medido: un bloque soltado 257 px
por encima del lienzo aparece pegado a su borde superior, con el espacio
desplazado a `y = −522,6`, y quien lo mida ahí concluirá que se soltó dentro. Es
la misma trampa que el `<pre>` de §4.10 y que contar frames en el J6: **una señal
leída tarde ya no dice lo que pasó**. Por lo mismo el vuelo arranca en el punto
apuntado y no donde Blockly haya dejado el bloque, o se le vería entrar de un
salto en el lienzo antes de salir volando.

**Se descartó registrar dos componentes en el `ComponentManager`** —uno con el
rectángulo del lienzo y otro, más pesado, con la pantalla entera—: funciona igual
de bien, pero Blockly pinta el bloque como «a punto de borrarse» en toda la zona
de borrado, y eso sería el trayecto entero.

**LOS BOTONES SE VEN ARRIBA Y VIVEN ABAJO, y ése es el otro patrón que hereda el
J8.** La composición crea **tres nodos vacíos** —el de la caja, el de los botones
y el del mensaje— y los baja **como dato** por los dos cargadores, que siguen sin
importar ni `blockly` ni `three`. `BlockEditor` cuelga su flyout del primero;
`GameScene` pinta sus tres botones en el segundo y su mensaje en el tercero, los
dos con `createPortal`. Así **el estado del intento y `start()` no salen de
debajo de la frontera diferida**, que es lo que arrastraría el intérprete al
trozo principal. Los huecos van en **estado y no en `ref`**: un `ref` no provoca
repintado y las piezas se montarían contra `null`.

Subir el estado a `StudentGameLabModule` era la alternativa evidente y es
justamente la prohibida. La otra —un `ref` imperativo con `start`/`stop`/`reset`—
obliga además a subir `isRunning` para inhabilitar «Ejecutar» y reparte los
controles entre dos archivos.

**DETENER ES ADELANTAR EL ÍNDICE Y MARCAR EL INTENTO COMO CONGELADO**, y de ahí
salen tres cosas de una: la pose pasa a ser la del paso en curso —la casilla y la
orientación que el usuario pidió—, el paso a animar se vuelve `null` y el bucle
de frames se planta, y el contador se queda en ese paso. **El personaje aterriza
en la casilla en vez de congelarse entre dos**: un cubo parado a medio camino se
lee como un fallo de dibujo. **Un recorrido detenido no se reanuda**: «Ejecutar»
vuelve a leer el lienzo y empieza desde la salida —verificado, el contador vuelve
a **1**—.

**Y detener NO produce resultado.** No es sólo que un recorrido congelado no haya
terminado: el resultado diría «No llegaste a la meta», y eso es **acusar al niño
de un fallo que no ha cometido** —paró él—. Es el mismo error que el J6 corrigió
con el lienzo vacío. En su sitio va una frase sin números ni juicio.

**EL CONTADOR SE VE SIEMPRE, y la cuenta hubo que REHACERLA, no destaparla.**
Dice «Pasos: 0» en reposo, sube con el personaje, y al terminar o al detener se
queda en lo que costó. Quitarle el `isRunning` habría dado **un paso de más**:
pintaba `index + 1` y al terminar `index` vale `steps.length`, así que un
recorrido de diez habría dicho **once**. La cuenta vive fuera del componente
—`stepsTaken` en `interpreter.ts`, junto a `countSteps`— porque dentro no se
puede probar, y lleva sus seis tests: los cinco estados más el que ata el número
final al recuento del resultado, que hoy **no puede fallar** y por eso está.

**No choca con el J6.2**: aquél retiró el número **a batir** antes de jugar, y un
cero no lo es. **Y `stepsLabel` no se tocó**: lo comparten las cuatro frases del
resultado, y el «Pasos: N» del contador es suyo.

**EL MENSAJE DICE TODO LO QUE SE LE CUENTA AL NIÑO** —reposo, ejecución,
resultado y los dos avisos de bloques sueltos— **y vive en la franja del título
del lienzo**, a la derecha de la etiqueta «Lienzo» y en su misma línea. La
etiqueta se queda como rótulo fijo, para que la zona siga diciendo qué es cuando
no hay nada que contar. El usuario pidió mover **el resultado**; que los avisos
fueran con él es derivado, y la razón es que al irse la franja se quedaban sin
sitio. **Es mover, no rediseñar**: ni un texto cambió y la regla de cuál manda
sigue igual —verificado: al construir sale el aviso en presente, al terminar sólo
el del resultado—.

**La primera versión lo puso en una banda SOBRE EL JUEGO, y el usuario la
devolvió**: ocupaba la parte baja del juego, que es justo donde ahora está la
bandeja del lienzo, y estorbaba delante del tablero. **El contador no se movió**:
sigue superpuesto al juego, arriba a la derecha, porque cuenta lo que el niño
está mirando.

**LA CÁMARA VA ACOTADA POR LOS CUATRO LADOS, y ninguno es estética.** Por abajo
no pasa de la horizontal: por debajo se ve el envés de las losas. Por arriba no
llega al cenit: desde ahí el personaje es una silueta y **la marca que lleva
sobre la cabeza deja de distinguirse**, así que girar dejaría de verse —que es lo
que esa marca existe para enseñar, desde el J2—. El acercamiento tiene mínimo y
máximo, y **el desplazamiento está desactivado**: mover el centro es la única
forma de perder el tablero, y un niño que lo pierda no sabe volver. Encima del
juego hay un botón que devuelve **la vista de partida**, que guardan los propios
controles.

**Y por eso entró `drei`**, `^9.122`, sólo por `OrbitControls`, tal como el
roadmap §2 lo dejó previsto. `npm ls three` sigue dando **una sola copia en
0.170.0** y el lockfile creció de forma incremental —los `@supabase/cli-linux-*`
siguen ahí, comprobado en el diff—.

**Y HAY UNA SALVEDAD MEDIDA EN «VISTA INICIAL», que no es de este paso pero
conviene no volver a perseguirla.** Devuelve exactamente a (5,3 / 7,5 / 7,5) **si
la inercia de los controles ha parado**; pulsada a los 500 ms de soltar un giro
largo, la amortiguación de `drei` sigue corriendo **después** del reinicio y deja
el azimut en 45,4° en vez de 35,2°. Es cómo `OrbitControls` combina `reset()` con
`enableDamping`, que este repositorio no configura ni toca. Se anota, no se
arregla aquí.

**EL LIENZO ES UNA BANDEJA DENTRO DEL JUEGO, Y ESO OBLIGÓ A REENCUADRAR EL
TABLERO.** El juego pasó a ser una zona de todo el alto y el lienzo se metió
dentro, superpuesto al 3D por su parte baja. Con el hueco del juego pasando de
340 px a 635, el tablero —que se dibuja centrado y crece con el alto del hueco—
metió su fila sur debajo de la bandeja: **medido, la esquina sureste caía 154 px
por debajo del borde de la bandeja**, y ahí están la casilla de salida y todo el
camino que recorre el PROGRAMA A.

**No se arregla con la maqueta, y la cuenta lo dice.** Al encuadre de partida el
tablero ocupa el **84 %** del alto del hueco; para que quepa encima de una
bandeja de 245 px haría falta un hueco de **más de 1.600**. Se corrige por los
dos lados, con dos constantes en `GameScene.tsx`:

- **`CAMERA_START`** aleja la cámara hasta que el tablero cabe en la franja libre
  —de 8,53 a **11,86** de distancia, dentro del tope de acercamiento de 14 que ya
  había, así que los topes no se tocaron—;
- **`BOARD_LIFT`** levanta el tablero **2,4** sobre el centro de la órbita, hasta
  el centro de esa franja.

Las dos se volvieron a medir después del J6.3 —**15,01** y **1,8**, con el tope
de acercamiento subido a 18—; el porqué, al final de este apartado.

**Los dos hacen falta.** Alejar sin levantar no basta —la perspectiva deja la
esquina cercana abajo por mucho que se aleje: medido hasta distancia 14,5, seguía
92 px por debajo del borde—; levantar sin alejar saca el borde norte por arriba.

**Se levanta EL TABLERO y no el punto al que mira la cámara**, aunque
geométricamente sea lo mismo: los controles guardan su vista de partida al
construirse, con el punto en el origen, y moverlo dejaría «Vista inicial»
devolviendo a otro sitio. El personaje va dentro del mismo grupo, así que **su
casilla se sigue calculando igual** —`col = x + 2`, `fila = z + 2` sobre la
posición local del grupo—, que es la forma de mirar el tablero descrita más
abajo.

**Y a ventanas estrechas el tablero no cabe de ancho.** A 1024 px se sale **31 px
por la izquierda y 16 por la derecha** del hueco del juego; a 1280 cabe entero.
Es el mismo apartado que §4.4 —el panel no es responsive— agravado por un hueco
alto y estrecho, y el niño puede alejar la vista con la rueda. Se anota en vez de
arreglarlo aquí.

**ENCARGO PARA EL J13, encontrado al verificar el J6.3 y que NO es de este
paso.** Al relanzar un recorrido, **el primer giro no se anima**: el personaje
aparece en la salida pero **ya mirando hacia donde iría**, en vez de girar desde su
orientación de partida. La causa es que el ángulo dibujado vive en un `useRef` del
bucle de frames y **conserva el del recorrido anterior**, así que la
interpolación arranca del ángulo viejo y no del de la salida. La **posición
siempre es correcta**; lo que se pierde es un tercio de segundo de giro.

**Y viene del J5/J6, no de «Detener»** —que es lo que lo hace un encargo y no un
fallo de este paso—. Aislado midiendo, **sin tocar «Detener» ni una vez**: con un
programa que termina mirando al este, pulsar «Ejecutar» por segunda vez deja al
personaje en la salida con `rotY −1,5708` a los 40 ms. Lo único que añade
«Detener» es otra forma de llegar a ese estado. Se arregla donde se toque la
animación —el **J13**, con el personaje de verdad y sus clips delante—, y no
antes: aquí sería código nuevo encima de un paso ya verificado.

**Y LA REGLA QUE SALE DE VERIFICARLO, que vale para el J7 y para todo lo que
venga: una pantalla que dice de sí misma que hizo algo NO es la prueba de que lo
hizo.** En este juego la prueba es **dónde está el personaje**. Cuatro
comprobaciones de este paso se dieron por buenas leyendo un texto —el contador, la
banda, el estado de un botón— y hubo que rehacerlas mirando el tablero; que las
cuatro tuvieran la misma forma dice que no fueron cuatro descuidos sino **un
criterio equivocado aplicado cuatro veces**. Es la misma trampa que contar frames
en el J6 y que el `isConnected` del J6.1, con otro disfraz.

**Y hay forma de mirar el tablero, que es lo que faltaba**: `_roots` está
exportado en el módulo de fiber, así que
`_roots.get(canvas).store.getState().scene` da la escena; el personaje se
localiza por el color de su material —`7b3fe4`— y su casilla sale de la posición
del grupo con `col = x + 2`, `fila = z + 2`. Contra qué compararla: importando
`/src/game/interpreter.ts` y `/src/game/debugLevel.ts` **en la propia página** se
calcula la pose que el intérprete espera, y entonces la comprobación es el cubo
contra el intérprete, no el cubo contra una captura.

**Verificado en el navegador, con `document.hidden` en `false` y el `<pre>`
comprobado antes de nada:**

- **Reposo**: «Pasos: 0» y el texto de siempre, con el PROGRAMA A puesto en el
  lienzo y sin ejecutar.
- **PROGRAMA A entero**: el contador sube 2 → 10 y **se queda en 10**, con
  «¡Perfecto! Llegaste a la meta con 10 pasos, justo lo que cuesta la mejor
  solución.» en la banda. **Diez y no once.**
- **Detener a mitad**: contador congelado en 5, **sin resultado**, «Detener» se
  inhabilita y «Ejecutar» vuelve; un segundo después sigue igual. Y **«Ejecutar»
  después empieza por 1** y termina en 10.
- **Reiniciar**: «Pasos: 0» y la banda al texto de reposo.
- **La caja separada**: arrastre real con eventos de puntero, el bloque cae bajo
  el cursor y **el `<pre>` recoge el programa**. Soltado en el lienzo **no se
  borra**; arrastrado a la caja **sí se tira**.
- **Los dos avisos**: al construir con dos montones, el de presente; al ejecutar,
  sólo el del resultado, con «Usaste 1 paso».
- **La cámara**: girando se llega a los dos topes —casi cenital por arriba, casi
  horizontal por abajo, **nunca por debajo del tablero**—, la rueda topa por los
  dos lados, y «Vista inicial» devuelve exactamente la vista de partida.
- **Una carga limpia no saca ni un error en consola**, y hay **una sola** caja y
  **un solo** lienzo.

**Y verificado otra vez CONTRA EL TABLERO al corregir los seis defectos**, que es
la regla que este paso dejó escrita —una pantalla que dice de sí misma que hizo
algo no es la prueba de que lo hizo—:

- **El bloque cruzando el juego**: soltándolo a mitad de camino, está dibujado en
  (670, 407) —el lienzo empieza en y 657— y `elementFromPoint` en su centro
  devuelve **el propio bloque**, no el `<canvas>`. Los cuatro recortes en
  `visible` durante el arrastre, leídos del estilo calculado.
- **La vuelta a la caja, viéndola**: seis muestras del vuelo, de (622, 417) a
  (978, 330), camino de la caja en (1084, 279); después el `<pre>` vuelve a
  `"workspace": {}`. Soltado sobre el juego y sobre el panel de instrucciones,
  vuelve en los dos; soltado **dentro** del lienzo se queda —movido dos veces
  dentro—; arrastrado **a la caja**, se tira.
- **El recorrido, casilla a casilla**: PROGRAMA A de col 0/fila 4 a col 4/fila 0,
  contador de 1 a 10 y «¡Perfecto! …con 10 pasos». «Detener» a mitad de un paso
  —el personaje iba por col 3,29— deja col 4/fila 4 mirando al este con «Pasos:
  5» y sin resultado, igual un segundo después; «Ejecutar» después arranca en col
  0/fila 4 con el contador en 1; «Reiniciar» devuelve a col 0/fila 4 mirando al
  norte.
- **El personaje no queda tapado**: sobre la meta proyecta en (883, 402), la
  bandeja empieza en 614, y `elementFromPoint` ahí devuelve el `<canvas>`.
- **La cámara**: acercamiento 4 y 14 **exactos**, giro 25,71° y 83,12° **exactos**
  —nunca por debajo del tablero—, azimut libre, y «Vista inicial» a
  (5,3 / 7,5 / 7,5).
- **La caja sin barra**: cero elementos `.blocklyFlyoutScrollbar`, y los tres
  bloques de y 97 a y 241 en una caja de 200 px.

**Y LO QUE NO SE PUDO VOLVER A VERIFICAR, que se dice en vez de darlo por
bueno.** Todo lo de arriba se midió con la maqueta en su **segunda** forma —el
rectángulo único—. Al cambiarla a la tercera —los paneles flotantes— la página
entró en el estado de §4.10 y ahí se quedó: **cero frames de
`requestAnimationFrame` en 700 ms**, **cero eventos** al crear un bloque, y el
`<pre>` en `{}` con cuatro bloques pintados en el lienzo. En ese estado no
publica el editor, no llegan los eventos de arrastre y la escena no avanza, así
que **nada medido encima vale** — y el arrastre, en concreto, sale mal por eso y
no por el código.

**Lo que sí quedó comprobado de la forma nueva**: la maqueta medida zona a zona,
y que la regla que apaga los recortes **sigue nombrando los elementos correctos**
—encendiendo la clase a mano, los cinco pasan a `overflow: visible` y la bandeja a
`z-index: 30`; apagada, la zona del juego, el hueco de la inyección y el SVG
recortan—. Lo que **falta** es volver a ver un arrastre real de punta a punta con
la forma nueva, y hay que hacerlo en otra sesión.

**Y la columna derecha DA UN SALTO mientras la escena carga.** Los botones son un
portal desde debajo de la frontera diferida, así que no existen hasta que resuelve
el `Suspense`: su tarjeta mide **29 px vacía** y **165 px con los tres botones**,
de modo que la de instrucciones está 136 px más arriba de donde acabará y todo
baja de golpe. Medido: con el trozo en caché, ese estado dura de los **~314 ms a
los ~930 ms** —unos 600—, y en frío más, porque la escena son 847 kB.

**Se deja así a propósito, y no es deuda del producto**: es la consecuencia
conocida de la carga diferida en una pantalla que **sólo existe en desarrollo**.
Poner un alto mínimo en el hueco lo taparía, pero metiendo en la composición un
número que es de los botones —justo la frontera que este paso construyó—. **La
salida buena, para cuando el J8 tenga que decidir cómo se ve cargando la pantalla
de nivel de verdad: que el `fallback` del cargador rellene también ese hueco.**
`GameSceneLoader` ya recibe el hueco, así que puede portalar ahí un marcador de la
misma altura, y el número vive donde vive lo que ocupa. Queda medido para no tener
que volver a medirlo.

**Lo que NO se consiguió, y se dice en vez de darlo por bueno: el laboratorio
entero no cabe en una ventana normal.** La maqueta sola sí: con la zona del juego
a **640 px** de alto fijo, acaba a **877 px** del principio del documento a 1440
de ancho y a **920** a 1024 —eran 916 y 959 en la primera forma—. Lo que no cabe
es el laboratorio: el documento mide **1244 px** a 1440 y **1312** a 1024, porque
debajo van el `<pre>` y su tarjeta.

Así que **la maqueta pide 880 px de alto de ventana a 1440 y 920 a 1024**, y ver
además el `<pre>` pide 1250. Lo que sobra es del propio laboratorio y no de la
maqueta que hereda el J8: su tarjeta de cabecera se lleva unos 150 px y el `<pre>`
va debajo de todo.

#### EL EDITOR DEJA DE PUBLICAR, Y NO ES UN PROBLEMA DE LA VERIFICACIÓN

**Esto empezó pareciendo «el truco de cargar programas falla a veces» y no lo
es.** Medido entre las dos sesiones del J6.2, y es lo más serio anotado en esta
sección.

**Blockly deja de repartir eventos en esa página, y deja de repartirlos a
TODOS.** Un escuchador propio, añadido al mismo espacio que devuelve
`getMainWorkspace()`, recibe **cero eventos** al crear un bloque — y el bloque se
crea, se pinta y aparece en `getAllBlocks()`. Como el editor publica por ese
mismo camino, **el sobre se queda en `{}` para siempre**: su `report()` inicial
sí llega, y ninguno más.

**Y le pasa igual a un arrastre de verdad**, no sólo a
`serialization.workspaces.load`: abriendo la caja de herramientas con eventos de
puntero y arrastrando el bloque al lienzo —el camino que usaría un niño—, el
bloque se crea, `getAllBlocks()` pasa de 0 a 1, **cero eventos** y el sobre
sigue vacío.

**Lo que eso significa para el producto, dicho sin rodeos: en ese estado el juego
NO SE PUEDE JUGAR.** El niño arrastra sus bloques, los ve en el lienzo, pulsa
«Ejecutar» y la barra le dice que no hay bloques que ejecutar. Hoy sólo lo tapa
que el editor viva en una ruta de **desarrollo**.

**Y no se puede comprobar en producción hasta el J8**: se sirvió el build y la
ruta del laboratorio no existe fuera de desarrollo, por diseño. No hay ninguna
pantalla de producto con editor hasta que el J8 monte la de nivel, así que **si
esto ocurre también ahí, no hay forma de saberlo todavía**.

**LA CAUSA APARECIÓ EN EL J6.3, y está en el fuente de Blockly.** Lo que sigue
debajo —todo lo descartado— se conserva como registro, pero ya no hace falta
seguir buscando:

**El reparto de eventos de Blockly 12 cuelga de un `requestAnimationFrame`.**
`fireInternal`, en `blockly_compressed.js:86`:

```js
if(!FIRE_QUEUE.length)try{requestAnimationFrame(()=>{setTimeout(fireNow,0)})}catch(b){setTimeout(fireNow,0)}
```

**Sin `rAF` no se llama `fireNow`, la cola no se vacía y ningún escuchador recibe
nada** —mientras crear el bloque y serializarlo siguen funcionando, porque son
síncronos—. Que es exactamente el síntoma. Y **el `rAF` sólo se programa con la
cola vacía**, así que una vez cargada ningún evento nuevo programa otro: el
reparto se reanuda cuando corre el `rAF` aplazado, no antes.

**Medido en la página, y con el control que lo separa de nuestro código:** con
la página estrangulada —`document.hidden` en `true` y **cero** frames en 500 ms—
no llega **ni un** evento, y **un espacio de trabajo recién inyectado de fábrica
en esa misma página falla igual**. No es el espacio de la aplicación, ni
`StrictMode`, ni nuestro cableado: es la página. En cuanto `document.hidden` pasó
a `false` y volvió el `rAF`, el mismo `load` disparó `create` y `finished_loading`
y el `<pre>` se llenó.

**Explica el perfil entero**: intermitente, pegajoso, y sobrevive a recargar, a
abrir pestaña y a reiniciar el servidor —porque un panel estrangulado sobrevive a
las tres—. **Con dos avisos**: el bloque del J6.1 midió 60 fps con el panel oculto
y `hidden` en `false`, y en la máquina del J6.3 salió `hidden: true` y cero
frames, así que **el estrangulamiento no es el mismo en las dos máquinas**; y esto
**no demuestra** que en producción no ocurra, porque hasta el J8 no hay pantalla
de producto con editor. **No se ataca aquí**: qué hacer con §4.10 lo decide el
usuario, y ahora lo decide con la causa delante.

**Y AQUÍ HAY DOS FALLOS DISTINTOS CON DOS SEÑALES DISTINTAS, y confundirlos
cuesta la tarde que estas notas quieren ahorrar.** Uno es éste, el de Blockly;
el otro es el de la escena, medido en el J6 y descrito más arriba. Se separan
así:

- **Cero frames de `requestAnimationFrame`** ⇒ **Blockly no reparte** —la cola de
  `fireInternal` no se vacía— **y la escena tampoco avanza**. Es lo que midió la
  sesión que revisó el J6.3, y lo midió con `document.hidden` en **`false`**.
- **Frames que corren** ⇒ **Blockly reparte**, pero **la escena puede seguir
  congelada**: lo que el panel oculto suspende ahí no es el `rAF` de la página
  —que da sesenta— sino el bucle de render de fiber. La señal entonces es que **el
  recorrido progrese**, y el remedio, `resize_window`.

Dicho corto: **contar un frame DESCARTA el fallo de Blockly y NO descarta el de
la escena**, y `document.hidden` no detecta ninguno de los dos —sale `false` en
los dos casos—.

**Lo que se había descartado antes de encontrarla**, que sigue siendo válido y
explica por qué costó tanto: va descartado
midiendo, todo en la página que falla:

- **No es `React.StrictMode`**: desactivado en `main.tsx`, recargado y repetido el
  arrastre, ocurre igual. El doble montaje queda descartado por medición, no por
  razonamiento.
- **No es un espacio desechado**: `getInjectionDiv().isConnected` da `true`, y
  `Workspace.getAll()` sólo devuelve el principal y el del flyout.
- **No son los eventos deshabilitados**: `Events.isEnabled()` da `true`.
- **No es una copia doble del módulo**: se carga **un solo** `blockly_core`, y el
  espacio está **registrado** en el registro de esa copia.
- **No es la caché de dependencias de Vite**, que es del 4-sep y no se ha
  regenerado, así que no explica que antes funcionara y ahora no.
- Y no hay **ningún error en consola** cuando ocurre.

**Es intermitente y pegajoso**: en el J6.1 y al principio del J6.2 funcionaba con
normalidad; cuando se cae, se queda caído, y **sobrevive a recargar la página, a
abrir una pestaña nueva y a reiniciar el servidor de desarrollo**.

**El fallo es PREEXISTENTE —viene del J4, que es cuando entró el editor— y no lo
trae ningún paso del J6.** No se atacó aquí a propósito: sin causa conocida,
sería alcance nuevo encima de un cambio cerrado. Está subido al usuario para que
decida si se ataca antes del J8 o se queda anotado.

**Mientras tanto, la comprobación del `<pre>` sigue siendo la única que vale**, y
ahora se sabe que si falla no hay parche: hay que verificar en otra sesión.

#### Cuatro ajustes de encuadre sobre el J6.3, pedidos por el usuario

Son cuatro medidas de la maqueta, no capacidades nuevas: lo que hace la pantalla
es lo mismo. Se anotan porque cada una tenía su número escrito más arriba.

**EL LIENZO ABRE EN 130 PX Y NO EN 190.** Sólo baja la altura de PARTIDA: el
tirador y el pliegue siguen yendo de 90 a 380. Quien entra por primera vez viene
a mirar el tablero, no a construir, y la bandeja tapa la mitad de abajo del
juego; los bloques caben en cuanto tira del asa, y el tablero no se recupera si
empieza escondido. Verificado arriba, en el apartado del pliegue.

**Y EL TABLERO ARRANCA MÁS LEJOS Y CENTRADO EN LA FRANJA QUE LE QUEDA.**
`CAMERA_START` pasa de 11,86 a **15,01** de distancia —los tres números crecen a
la vez, así que el ángulo no cambia— y `BOARD_LIFT` de 2,4 a **1,8**. La
distancia va por delante del tablero de hoy a propósito: las 5 × 5 casillas son
cubos, y las ilustraciones del P6 ocuparán bastante más alto que una losa de 0,2;
acercarse está a una rueda de ratón, volver a encuadrar un tablero que ya no cabe
no. **Eso obligó a subir `MAX_DISTANCE` de 14 a 18**: el tope viejo queda por
debajo del arranque nuevo y los controles lo habrían recortado en el primer
frame.

**Y el tablero NO se centra en la franja libre, aunque fue lo primero que se
probó.** Centrado en ella —`BOARD_LIFT` a 2,6, tablero en 307-582— el usuario lo
vio **alto**, y tiene razón por dónde está la bandeja: lo que el ojo toma por «el
juego» es el hueco entero, y la bandeja va ENCIMA de él, no al lado. Se baja
hasta quedar entre el centro de la franja y el del hueco, y lo que manda por
abajo es no llegar a tocar la bandeja. Medido a 1280 px: el tablero cae en
**345-623** y la bandeja empieza en 653, o sea **30 px** de aire —justo el borde
de su sombra—.

**LOS BLOQUES DE LA CAJA SE PINTAN AL 0,72 Y SE COLOCAN EN REJILLA DE 3 × 2.**
Los mundos siguientes traen más bloques, y una caja que sólo enseña lo que ya
tiene dentro se ve estrecha el día que llegan. Dos cosas hacen falta y ninguna
sobra:

- **la escala**, por `getFlyoutScale()` —Blockly documenta ese método como el
  punto donde separar la escala de la caja de la del lienzo—. Sale de una medida:
  el bloque más ancho mide **169 px** a tamaño del lienzo y la columna da para
  146. Encogerlos por el tema —letra y iconos más pequeños— no llega: los bloques
  de `zelos` tienen alto y relleno mínimos, y se quedaban en 145. Al 0,72 los
  tres miden 92, 121 y 116;
- **la rejilla**, sustituyendo `layout_`, que de fábrica apila hacia abajo. Como
  esta caja no lleva barra —punto 4 de más arriba—, el cuarto bloque se saldría
  del hueco sin forma de llegar a él. Los separadores que Blockly intercala son
  huecos de una columna: en rejilla no separan nada y se recogen en el origen.

Y **`getWidth()` también se sustituye**, por el mismo motivo que `getHeight()` en
el J6.3: el SVG de la caja recorta lo que se sale, y de fábrica su ancho es el
del bloque más ancho. Con una columna sobraba; con dos, la de la derecha caía
fuera y no se dibujaba.

**La consecuencia medida, que se dice en vez de darla por buena:** al sacar un
bloque de la caja **crece de golpe** de 0,72 a 1, y Blockly conserva el
desplazamiento en PÍXELES del punto por donde se agarró —`positionNewBlock`
convierte entre las dos escalas, así que el bloque cae bajo el cursor, pero
descolocado hacia la derecha y abajo—. Medido: agarrado a 58 px de su borde
izquierdo, el bloque de 161 px queda sujeto al 36 % de su ancho en vez de al
50 %. Es lo mismo que hace un bloque sacado de una caja con el lienzo acercado.
Verificado además que **soltar fuera del lienzo sigue devolviendo el bloque a la
caja** —dos bloques puestos, uno soltado sobre el juego, queda uno— y que la
clase que apaga los recortes se retira.

**Y EL CIELO REPARTE DISTINTO SUS PARADAS.** Los tonos son los mismos tres
—`sky-high`, `sky-mist`, `mist`—: lo que cambia es dónde se cruzan. El azul se
sostiene hasta el 25 % en vez de empezar a irse desde el píxel uno, y el blanco
se retira al último tramo, que es justo el que tapa la bandeja. Así lo que se ve
del cielo es azul en su mayor parte y no blanco, sin subir el tono de ninguno de
los tres, y sigue llegando a blanco antes del borde de abajo —que es de lo que
vivía la bandeja sin borde—.


#### Lo que el J6.4 dejó: los modelos entraron, y el aspecto se va al J13

**EL PASO SE CIERRA HECHO Y NO SATISFACTORIO, y eso lo decidió el usuario el
10-sep-2026 mirándolo.** La práctica de assets salió mejor que el primer intento
y aun así **no es el resultado que buscaba**, así que el aspecto deja de colgar de
aquí: los puntos gráficos —el J7.4 y los dos del J12— se retiran y se juntan en un
**J13** propio, después de los puzles. Lo que sigue es lo que quedó en el árbol,
lo que no se llegó a hacer, y las medidas que el J13 no debería volver a pagar.

**Y hubo DOS intentos.** El primero pintaba cada casilla con un bloque del kit y
llevaba decorado del Nature Kit alrededor; el usuario lo devolvió el 9-sep-2026
**por el aspecto**: veinticinco bloques sueltos no se leen como un suelo, y las
piezas posadas y separadas se ven mal. De aquél sobrevivieron dos cosas que no
eran aspecto —el límite de error de la escena y leer la casilla del personaje por
nombre— y el resto se revirtió a `HEAD` antes de empezar el segundo.

**LOS KITS CAMBIARON.** `nature/` se borró entera —330 archivos, 3,7 MB— y entró
el **Survival Kit 2.0** completo: 80 GLB (1,24 MB), su `Textures/colormap.png` y
su licencia. Quedan **233 modelos y 4,30 MB** entre los dos kits, y el README de
`public/models/` se rehízo con eso. **Comprobado uno a uno en los 233**: ninguno
lleva imagen dentro y todos apuntan a `Textures/colormap.png` por ruta relativa,
así que cada textura tiene que seguir siendo hermana de los `.glb` de su carpeta o
esos modelos salen en blanco **sin error en consola**.

**Y meter 80 modelos y borrar 330 no movió el empaquetado ni un byte** —`GameScene`
dio 849,52 kB antes y después—, que es la prueba en los dos sentidos de que los
`.glb` se piden por URL y no viajan con el código.

**EL SUELO ES UNA SOLA GEOMETRÍA, no veinticinco piezas**, y es el cambio del que
cuelga todo lo demás. Se construye en un `useMemo`: una tapa por casilla a y = 0
—repartida entre dos verdes por la paridad de fila más columna— y un canto de
tierra **sólo en el contorno**, el de fuera y el del hueco. Las casillas comparten
arista, así que no hay junta que dibujar: **la cuadrícula se ve sólo por el
color**, que es la única razón por la que se ve —el niño cuenta casillas para
saber cuántos pasos da—. La forma la manda `LevelConfig`, así que un tablero sin
huecos sale de ahí sin tocar nada.

**Los tres colores del tablero NO son del tema: son del kit, y están medidos.**
`colormap.png` del platformer no es un dibujo sino una **paleta de 16 × 16
celdas**, y cada modelo apunta con sus UV a una. Leyendo las UV del propio
`block-grass.glb` —cara de arriba en (0,9688 · 0,5312), caras de abajo en
(0,4688 · 0,5312)— salen **hierba `#57C186`**, **tierra `#E89066`** y, en la celda
de debajo de la hierba, el **verde oscuro `#45AF7E`**. Es el color del **centro**
de cada celda, que no es lo mismo que «el color de la celda»: llevan 27, 27 y 31
tonos distintos, un degradado mínimo de compresión que en pantalla no se ve.

**Y EL LABIO DE HIERBA ABRIÓ UNA RENDIJA QUE COSTÓ UNA VUELTA ENTERA.** Los
faldones se metían `GRASS_LIP` **por los cuatro costados**, así que dos casillas
vecinas del contorno dejaban **0,08 de aire** entre sus paneles —dos veces 0,04— y
por ahí se veía el fondo: una grieta blanca en el canto, justo el defecto que el
paso venía a quitar. El labio sólo debe meterse en la **perpendicular a su cara**;
a lo largo de ella el panel va de borde a borde, y en las esquinas los dos paneles
se cruzan un poco: **un solape que no se ve es mejor que una rendija que sí**.

**La regla que sale de ahí, y vale para todo lo que venga: el damero se juzga
desde arriba y el canto desde el lado.** La rendija sobrevivió a una revisión
entera porque las dos sesiones miraron el tablero desde la vista de partida, que
no enseña el canto.

**LOS CUATRO MUROS DEJARON DE SER CUBOS**, uno por casilla y cada uno distinto,
repartidos por el usuario sobre su boceto: la **tabla de madera** (`platform.glb`)
junto a la bandera, el **tocón** (`tree-trunk` del survival, escala 4) en la
casilla más cercana al personaje, y **dos rocas** (`rock-b`, escalas 1,6 y 1,45)
en las otras dos. Todo **hundido** entre un octavo y un tercio de su alto, que es
la regla que el usuario puso para el paso entero: **las piezas se funden, no se
posan**. La meta lleva `flag.glb` y **la salida dejó de marcarse**: basta con que
el personaje esté ahí.

**El survival está a OTRA ESCALA que el platformer** —sus rocas no llegan a la
casilla y `tree-trunk` mide 0,20 × 0,26—, así que lo que va de obstáculo hay que
escalarlo. Es lo que permite que el obstáculo pase de su casilla y se lea como
obstáculo, contra unos adornos que miden la mitad.

**EL ESCENARIO DE FUERA NO ENTRA EN LA HUELLA DEL TABLERO, y ésa es la línea.**
Plataformas de `block-grass-large` y `-large-tall` alrededor, árboles a cuatro
escalas hundidos en ellas, un `rock-flat` tumbado, la valla en **su plataforma
propia detrás del personaje** —sobre una casilla pisable se leería como muro— y un
trozo de pasarela saliendo del canto. Fundir es que las piezas **se toquen y se
muerdan entre ellas**; contra el tablero, **nada cuya cima esté por encima de la
hierba puede entrar en x ni en z de −2,5 a 2,5**.

La primera versión se lo saltó: las cinco plataformas se metían dentro y **se
comían la casilla de la salida y la de la meta**. Y había una causa escondida:
**girar un bloque cuadrado le engorda la caja alineada en `|cos t| + |sin t| − 1`**
—25 % a 0,3 rad, 18 % a 0,2, hasta 41 % a 45°—, así que dos plataformas colocadas
con el borde teóricamente pegado se metían **0,26 y 0,19**. Por eso las
plataformas no se giran y lo que se gira es lo de encima. Con `block-grass-large`
en 2,0821 de lado, el centro va en **±3,541** para que el borde quede pegado.
**Medido después en las trece piezas del escenario: cero invasión.**

**Y hay dos formas de mirar esto que no son la misma**, porque la primera no vio
lo segundo: **la oclusión** —qué tapa qué desde la cámara— y **la invasión** —qué
pisa la huella del tablero—. Una pieza puede no tapar nada y estar comiéndose una
casilla.

**LO QUE NO SE HIZO, y es la mitad del paso:**

- **la decoración** —flores y pasto sobre casillas pisables, sin colisión— no
  llegó a entrar;
- **el personaje sigue siendo el cubo morado con su marca**. El modelo estaba
  medido y listo, y no se puso;
- **las dos comprobaciones del tablero** —que ningún obstáculo esconda la casilla
  de al lado, y el topetazo contra un obstáculo nuevo— quedaron sin hacer, porque
  dependían de una decisión sobre la tabla que ya no llegó;
- **la tabla de madera no cumple el requisito que este mismo cambio escribió**:
  es plana, está sobre la hierba y se lee como adorno, y el requisito pide que un
  obstáculo se vea como tal **antes** de que el niño choque. Se deja dicho porque
  es deuda, no descuido.

**Las cifras que el J13 no debería volver a pagar:**

- **la casilla al noroeste del tocón se ve a 3 de 5 puntos** desde la vista de
  partida, y quien la tapa es el tocón. De las 19 casillas pisables sin obstáculo,
  catorce están a 5 de 5 y cuatro a 4; **ninguna oclusión viene del escenario de
  fuera**: son piezas del propio tablero o el personaje. El día que una pieza suba
  de tamaño, esa casilla es la primera que se cae;
- **el personaje se ve desde los 24 azimuts mientras la cámara no baje de 58°**
  —la vista de partida está en **50,74°**, el tope de arriba en **25,71°** y el de
  abajo en **83,13°**—. El primer estorbo a 59° es un árbol en 1 de 24, a 61°
  entra el tocón, y pegado al tope de abajo se suman las plataformas, la valla y
  **el propio tablero**. **Está medido contra el CUBO**: `character-oobi` mide
  0,907 de alto contra 0,7 y tiene otra silueta, así que **ese número hay que
  volver a sacarlo con el modelo puesto**;
- y por eso el requisito de ver hacia dónde mira el personaje **no promete
  visibilidad desde cualquier vista alcanzable**: con la cámara casi a ras, lo que
  esté delante tapa lo que hay detrás y eso es perspectiva, no un defecto. La
  salida es el botón de vista inicial.

**UN MODELO QUE NO LLEGA YA NO SE LLEVA LA PANTALLA**, y esto sí quedó hecho y
verificado. Se midió primero qué pasaba: con un `.glb` inexistente, `useLoader`
lanza, el `ErrorBoundary` de fiber **vuelve a lanzar en el render del `<Canvas>`**
y, sin nadie que lo pare, React desmonta el árbol **entero** —`#root` con cero
hijos: se van la barra lateral, el editor y la navegación, no sólo el juego—. Hay
un `SceneBoundary` **encima del `<Canvas>`**, en `GameSceneLoader.tsx`, que es
donde tiene que estar porque nada de dentro puede atrapar ese error. Es un
componente de clase porque es la única forma que da React, y no importa `three`:
la frontera diferida sigue en pie. Los tres botones y el mensaje del intento **sí**
desaparecen con la escena, y es correcto: son un portal desde debajo de la
frontera, y sin escena no hay nada que ejecutar ni nada que contar.

**Un detalle de desarrollo que confunde si no se sabe**: Vite devuelve
`index.html` para una ruta inexistente bajo `/models/`, así que el error no es un
404 sino «Unexpected token '<'» al parsear HTML como JSON.

**LA CASILLA DEL PERSONAJE YA NO SE LEE POR EL COLOR DEL CUBO.** El grupo del
personaje se llama `character`, el del tablero `board` y el del escenario
`scenery`, así que `scene.getObjectByName` da el personaje sea cual sea su
aspecto. Comprobado contra la vía vieja antes de cambiar nada: **32 muestras de un
PROGRAMA A entero, las dos vías con la misma lectura en todas**.

**Y del intento descartado quedan dos medidas que valen para el J13:**

- **`character-oobi` lleva esqueleto, y `<Clone>` lo rompe**: la copia se queda
  apuntando a los huesos del original y **deja de seguir a su grupo**. Se vio con
  el recorrido terminado, el contador en diez y la barra diciendo «¡Perfecto!»
  mientras **el personaje seguía pintado en la salida**. Va con `<primitive>`, que
  además es lo correcto: hay uno solo;
- **y la forma de cazarlo**, que es la regla del J6.3 llevada un paso más allá: si
  «dónde está el personaje» se lee del grafo, un fallo de dibujo no se ve.
  **Comparar dos fotogramas** —uno con el personaje visible y otro con
  `visible = false`— y sacar la caja de los píxeles que cambian. Con el fallo
  cambiaban **cero**; con `primitive`, **2.414** en una caja centrada a **dos
  píxeles** de la proyección de la meta.

**Y el modelo mira a +z mientras el juego cuenta con −z**, así que se le da media
vuelta **dentro de su propio envoltorio** y `FACING_ANGLE` no se toca: lo comparten
el recorrido y el topetazo, y girarlo movería al personaje de casilla para
arreglar un asunto de dibujo.

**Verificado en el navegador, con el `<pre>` comprobado antes de nada:** el
PROGRAMA A entero sobre el suelo nuevo va de col 0/fila 4 a **col 4/fila 0**, con
el contador de 1 a **10** y «¡Perfecto! …con 10 pasos», leyendo la casilla por
nombre. El encuadre no hizo falta tocarlo: el tablero cae entre y 405 y **y 581** a
1440 px, y la bandeja del lienzo empieza en **679**.

---

## 3. Especificaciones por aplicar

**Objetivo del siguiente hito:** tener funcionalidades completas de punta a punta
— base de datos real en Supabase, roles funcionales de verdad, y el apartado
donde se implementarán los niveles del juego. El juego sigue sin construirse —y
desde el 3-sep-2026 **ya no será Unity**—: aquí sólo entra el lado web.

El **apartado gráfico queda fuera de este hito a propósito** (P6): la
herramienta ya está elegida, pero las ilustraciones no se abordan hasta que las
funcionalidades estén completas.

### P2 — `auth-real`: APLICADO

El login y el registro reales viven contra Supabase desde el 27-ago-2026, cambio
`auth-real` (paso 12 del `ROADMAP.md`). Ver §2.2 para el estado y las decisiones,
incluida la del rol elegido por el navegador.

Comprobado contra la base real: un tutor registrado desde la interfaz sale con
`role = 'tutor'` en `profiles` y aterriza en `/teacher/groups`; un alta por
`curl` con `role: "superadmin"` en los metadatos crea el perfil con `child` y
aterriza en `/dashboard/worlds`.

**Las contraseñas también, desde el 27-ago-2026**, cambio `password-recovery`
(paso 13). Las **dos mitades quedaron verificadas contra la base real**, así que
el paso está cerrado entero:

- **Cambiar la contraseña estando dentro.** Los dos botones de Ajustes funcionan.
  Comprobado que con la contraseña actual equivocada **no cambia nada**, la
  sesión sigue abierta y la antigua sigue entrando —ese aserto es el que prueba
  que la verificación no es decorativa—; y que con la correcta el servidor da
  las **dos** respuestas, la antigua rechazada y la nueva aceptada. En alumno y
  en tutor.
- **Recuperar la olvidada.** El correo llegó a la dirección del dueño del
  proyecto —la única a la que el correo de fábrica llega con fiabilidad—, el
  enlace aterrizó en la pantalla de contraseña nueva sin rebotar a ningún panel,
  y el cambio se aplicó: comprobado por `curl` que la anterior dejó de entrar.
  `/reset-password` sin sesión va a `/login`, y `/forgot-password` con sesión y
  rol lleva al panel del rol.

**Y Google OAuth desde el 29-ago-2026**, cambio `google-oauth` (paso 15). Con él,
la línea P2 queda cerrada salvo la sesión de invitado, que es el paso 24 y va
después del juego por decisión del usuario.

Lo que aporta, con sus rutas reales: la vuelta del proveedor en
`pages/AuthCallback/`, la intención de rol en `context/oauthRole.helpers.ts`, el
`redirectTo` y la detección de cuenta existente en `services/auth.service.ts`,
`setMyRole()` en `services/profile.service.ts`, y las migraciones
`202606030017` y `202606030018`. Se borró `components/auth/GoogleAuthButton.tsx`,
que no montaba nadie.

**La regla que fija: el rol se decide en el primer registro y no cambia nunca.**
Ver §2.2 para el porqué y para lo que **no** cierra —registrarse como tutor de
entrada sigue abierto, y lo cierra el código de institución—.

Verificado contra la base real, con tres cuentas de Google del usuario y sin
tocar ninguna de las cuatro originales:

- **Alta con Google eligiendo tutor** → `role = 'tutor'`, marca declarada, y
  aterriza en `/teacher/groups` sin pasar por el panel del niño. **Eligiendo
  niño** → `child`, marca declarada, y a `/dashboard/worlds`.
- **Entrar por `/login` con Google** no toca el rol: sin intención pendiente la
  RPC ni se llama.
- **Una cuenta creada desde el botón de `/login`** nace `child` y **sin
  declarar**, porque nadie eligió; su primera declaración posterior sí se aplica,
  **siempre que no tenga lazos de salón**.
- **Las dos rejas, medidas por separado.** Con solicitud `pending` → `ZC002`; con
  membresía → `ZC002`; ya declarado → `ZC001`. En los tres, `updated_at` se quedó
  en el valor del alta: **no hubo escritura de ninguna clase**, que es prueba más
  fuerte que comparar el rol, porque el disparador de `updated_at` se movería
  incluso ante un `update` que reescribiera el mismo valor.
- **El daño que motivó la regla, reproducido paso por paso y no ocurriendo**: el
  niño con membresía que intenta ascender conserva su rol **y su salón**.
- **Registrarse con el formulario sobre un correo que sólo tiene Google** avisa
  en genérico, no abre sesión, y **no le añade contraseña a la cuenta** —medido
  intentando entrar después con ella—.
- Al terminar, «salon sigma» conserva sus dos alumnos y los tres perfiles
  originales siguen con el `updated_at` del backfill de la 0018, sin moverse.

De esta línea queda una sola cosa, y **no es de este paso**: retirar la sesión
de invitado es el paso 24, que va después del juego por decisión del usuario.
Lo que P2 pedía de ella —que `useActiveRole()` y `PrivateRoute` funcionen sin
la sesión de invitado— ya se cumple.

### P3 — `salones-persistentes`: APLICADO

Los salones viven en Supabase desde el 26-ago-2026, cambio `salones-persistentes`
(paso 10 del `ROADMAP.md`). Ver §2.5 para el estado y §2.7 para las dos vistas
que trajo la migración 0015. Lo que queda de esta línea es progreso real por
alumno, que es el paso 17 y no este.

### `arreglos-y-barra-xp`: APLICADO

Tres fallos vivos cerrados y una superficie nueva, cambio `arreglos-y-barra-xp`
(paso 28 del `ROADMAP.md`), el 29-ago-2026:

- **El `username` derivado del correo ya no aborta el alta.** Migración
  `202606030019_bound_generated_username.sql`: el nombre normalizado se descarta
  a `null` cuando no casa con `'^[a-z0-9_]{3,30}$'`, igual que ya hacía con el
  duplicado. El `check` de la `202606030002` **no se tocó**. Verificado contra la
  base real con tres altas por `curl`: local-part de 2 y de 33 caracteres crean
  la cuenta con `username` nulo, y una de 18 la crea **con** el nombre asignado.
- **Los fallos de autenticación llegan en español.** `AUTH_ERROR_MESSAGES` y el
  helper `authError()` en `services/auth.service.ts`, con el mismo patrón por
  código que `classrooms.service.ts` estrenó en el paso 10. `createAppError.ts`
  **no se tocó**: lo usan otros seis servicios contra PostgREST.
- **El panel dejó de inventar nombre, correo y racha**, en `Sidebar.tsx`,
  `StudentTopBar.tsx`, `StudentSettingsModule.tsx` y `StudentWorldsModule.tsx`.
  La racha va con `?? 0` porque el cero es legítimo, el nombre con
  `FALLBACK_STUDENT_NAME` —exportado desde `classrooms.service.ts`, un solo
  literal para toda la aplicación— y el correo sin ningún repliegue.
- **El panel del tutor se cerró después, con `nombre-editable`.** El paso 28 lo
  dejó fuera porque su encargo decía «el panel del niño», y quedaban cuatro
  «Sr. Robot» copiados —tres ignorando la constante que el cuarto ya tenía— y un
  `tutor@codeplay.co` inventado. Hoy hay un tratamiento genérico **por rol** y
  ninguno por pantalla: `FALLBACK_TEACHER_NAME` vive junto al del niño en
  `classrooms.service.ts`, y vive ahí por el mismo motivo —llega a la base, que
  `CreateGroupForm` lo escribe en `classrooms.teacher_name` si el campo se deja
  vacío—.
- **El nombre se cambia desde Ajustes, y la acción vive en `AuthProvider`.**
  `updateFullName` llama a `update_my_profile` y hace `setUser` con lo que
  devuelve, que es lo que refresca de golpe los siete sitios que leen
  `user.fullName` sin tocar ninguno. **No pasa por `useProfile()`**, que también
  sabe escribir el perfil pero mantiene su propia copia: por ahí el nombre
  cambiaría en la base y la pantalla se quedaría con el viejo hasta recargar. El
  correo se le pasa aparte al servicio porque no está en `profiles`; sin eso,
  guardar el nombre lo borraría de la pantalla de cuenta.
- **La longitud del nombre —2 a 60— se declara una vez** en
  `components/auth/fullName.schema.ts`, y la heredan el registro y Ajustes. Se
  puso en archivo propio y no en `SignupForm.schema.ts` para no repetir lo de
  `ChangePasswordForm.schema.ts`, que dice heredar el mínimo de `signupSchema` y
  en realidad lo copia. El máximo **no existía en ninguna parte**, ni en el
  registro.
- **El «Profesor …» de un salón no sigue al perfil, y es deliberado.** Un tutor
  que cambie su nombre no cambia el de los salones que ya creó: la migración 0013
  lo dejó escrito encima de la columna —«El profesor a cargo es texto libre que
  el tutor escribe al crear el salón… `tutor_id` es la identidad; esto es una
  etiqueta»—. `CreateGroupForm` sólo lo usa como valor por defecto, que el tutor
  puede sobrescribir. Sincronizarlo pisaría lo que hubiera escrito a mano.
- **El XP tiene cuatro superficies**: `XPBar` retintada al tema de selva y
  montada en la barra lateral, la barra superior y la tabla de seguimiento en sus
  dos vistas. El máximo es `PROVISIONAL_MAX_XP` en `constants/progress.ts`,
  provisional hasta el paso 22.

### Privacidad y consentimiento (paso 14): EN CURSO, el resto APLAZADO

Lo exigible hoy ya está aplicado: el cambio `invitaciones-sin-correo` eliminó
`invitations.email` —el único sitio del esquema donde se guardaba el dato de un
tercero sin cuenta— en la migración `202606030016`. Ver §2.3 y §2.7.

**Lo que queda —política de privacidad y consentimiento del acudiente— se
aplaza a propósito, y el motivo es que hoy no obliga a nada:** la aplicación no
está desplegada (paso 27), las únicas cuentas son de prueba, y ya no se recogen
datos de nadie que no se haya dado de alta él mismo. **La obligación nace con el
primer usuario real.** Se retoma después de la prueba preliminar y en todo caso
antes de que entre alguien de fuera.

**Qué falta exactamente, y qué está ya decidido, está en `ROADMAP.md` §3.4**, en
una lista que sirve de encargo sin releer nada más. De lo decidido, lo que toca
a este documento: el **responsable del tratamiento es el usuario como persona
natural**, y el plazo de conservación es el de §2.7. Quedan por decidir el
correo de contacto y el domicilio de la política, que **no pueden ser los
personales** porque el repositorio es público.

### P4 — `integracion-juego`: apartado de implementación de los niveles

**Descripción.** Dejar montado el hueco donde entrará el juego: la pantalla de
nivel con el contenedor del build de WebGL, el paso de parámetros al juego y la
recepción del resultado. **El juego sigue sin construirse**, y desde el
3-sep-2026 ya no será Unity sino librerías dentro de esta misma aplicación, lo
que simplifica mucho esta tarea: ver `DISENO-DEL-JUEGO.md` §5.

**Tareas**

1. Crear la ruta y la pantalla de nivel (`/dashboard/worlds/:worldId/:levelId`),
   con el contenedor del juego y el marco visual del tema selva.
2. Definir el contrato de integración: qué recibe el juego al arrancar (id de
   nivel, id de usuario, configuración) y qué devuelve al terminar (éxito,
   estrellas, XP, tiempo).
3. Implementar el puente hacia el juego y la escritura del resultado vía
   `progressService` y `attemptsService`.
4. Mientras no exista el build: mostrar en ese contenedor un hueco reservado
   coherente con el resto de la interfaz, no una pantalla de error.
5. ~~Decidir qué hacer con `levels.starter_code`, `levels.validation_rules` y
   `levels.programming_language`~~ — **hecho en el paso 23.1**: se reinterpretan,
   no se amplía el esquema. Ver §2.7.

**Dependencias.** Ninguna: `levels`, `user_progress` y `level_attempts` ya
existen en la base real.
No depende de que el juego esté terminado: el contrato se define primero.

**Bloqueos conocidos: NINGUNO, desde el 3-sep-2026.** Este apartado listaba
Unity, Git LFS, `unityyamlmerge` y el build de WebGL a `apps/web/public/game/`.
Al descartarse Unity **cae la lista entera**: el juego se construye con librerías
dentro de la aplicación, así que no hay instalación, ni filtros de LFS que
obliguen a nadie, ni build que copiar. Ver `DISENO-DEL-JUEGO.md` §5.

### P5 — Pendientes sin prioridad asignada

| Funcionalidad | Descripción | Dependencias |
| --- | --- | --- |
| Envío real de invitaciones (**mitad B del paso 19**) | Elegir servicio de correo (Resend, SendGrid…) y enviarlo. Hoy el tutor comparte el enlace a mano, que es lo que hace la mitad A | P1 + **servicio contratado** |
| Editar o archivar un salón | No existe | P1 |
| Exportar reportes | No existe | P1 |
| Progreso, XP y rachas reales | El XP ya se lee de la base y se muestra en cuatro sitios desde `arreglos-y-barra-xp`; lo que falta es que **algo lo escriba**, y con él la racha | P4 |
| Recursos educativos con destino | Hoy son tarjetas informativas sin enlace | Contenido |
| Abrir los cambios en OpenSpec | Convertir P1–P4 en `openspec/changes/` con `/opsx:propose` | Ninguna |

**Dos filas salieron de esta tabla el 3-sep-2026, y por motivos distintos.**

«CI en GitHub Actions» estaba **hecha** desde el paso 5 (`ci-github-actions`), y
además hace más de lo que la fila pedía: verifica `lint`, `test:run` y `build`,
en cada push a `main` y en cada pull request.

«Pertenecer a varios salones» **nunca fue una funcionalidad pendiente**, y
tenerla aquí contradecía a §2.7 de este mismo documento, que la describe como lo
que es: el invariante **«un alumno, un salón»**, que vive a propósito en tres
sitios —`unique (student_id)` en `class_memberships`, el índice único parcial
sobre las solicitudes pendientes, y el `with check` de la política de inserción—
y del que §2.7 dice que ninguno de los tres sobra. Lo confirmó el usuario el
3-sep-2026: **no se ha hablado nunca de permitir varios salones**, así que
listarlo como pendiente sugería un compromiso que no existe. Cambiarlo no sería
añadir una funcionalidad, sería rehacer el modelo de pertenencia.

### `enlace-de-invitacion` (paso 19, mitad A): APLICADO

El tutor genera un enlace, lo comparte por donde quiera, y quien lo abre **entra
al salón sin pasar por la bandeja de solicitudes**. Es la mitad del paso 19 que
no dependía de contratar nada; la otra —el envío por correo— sigue esperando
servicio, y **este cambio no acerca ni una columna de correo a ninguna tabla**.

**La fila que había aquí se equivocaba en las dos cosas que decía.** No hacen
falta Edge Functions —basta una función `security definer`, el patrón que el
proyecto ya usaba tres veces— y **no depende del envío de correo**: el enlace se
comparte a mano. Se corrige aquí para que nadie vuelva a leerlo.

**Dónde vive:** migración `202606030022`, `services/invitations.service.ts`,
`hooks/useInvitations.ts`, `context/invitationToken.helpers.ts`,
`pages/Invite/Invite.tsx`, `components/dashboard/teacher/AddStudentsPanel.tsx`,
y la acción `redeemInvitation` en `ClassroomsProvider.tsx`. El detalle del
esquema está en §2.7, el del tutor en §2.3 y el del niño en §2.4.

**Por qué el canje es RPC y no escrituras del cliente:** los permisos de la 0013
son tres muros, y ninguno se tocó. Quien tiene el token **no puede leer su propia
fila** —las tres políticas de `invitations` son del tutor del salón—, **nadie
puede modificarla** —no hay grant de `update` para ninguna sesión, ni siquiera
para el tutor— y `class_memberships` no tiene política de inserción.

**Lo que decidió este paso y nadie había decidido:** qué pasa con una solicitud
pendiente al canjear. Se **cancela**, ni se acepta ni se rechaza. Ver §2.4.

### P6 — `assets-graficos`: ilustraciones generadas por IA

**Aplazado a propósito.** La decisión de herramienta ya está tomada, pero el
trabajo gráfico no entra hasta que las funcionalidades (P1–P4) estén completas.
Se documenta aquí para que no se pierda entre sesiones ni se improvise otra
solución.

**Decisión.** Las ilustraciones definitivas se generan con **Higgsfield**,
invocado desde Claude a través de su **MCP**. No se dibujan a mano ni se compran
en bancos de imágenes.

**Qué cubre**

| Asset | Dónde va | Hueco actual |
| --- | --- | --- |
| Mascota (un leopardo) | Landing, login, registro, ajustes, mundos | `.mascot-slot` / `ImagePlaceholder`, hoy vacíos |
| Portadas de mundo | `student/StudentWorldsModule.tsx` | Hoy se resuelve con tono de color e icono SVG |
| Escenarios y fondos | Landing y paneles | Hoy son degradados y adornos SVG |

**Qué NO cubre.** Los adornos de `components/decor/JungleDecor.tsx` (hojas,
flores, tucán, liana) **seguirán siendo SVG escritos a mano**: son geometría
ligera, escalan sin pérdida, heredan el contorno de tinta del sistema visual y
pesan una fracción de lo que pesaría un PNG. No hay motivo para reemplazarlos.

**Tareas cuando llegue el momento**

1. Conectar el MCP de Higgsfield a Claude y verificar que responde.
2. Fijar el *prompt base* del estilo —contorno grueso de tinta, relleno saturado,
   paleta de §2.1, bioma de selva— para que todos los assets salgan coherentes
   entre sí y con la interfaz ya construida.
3. Generar primero la mascota: es la que aparece en más pantallas y la que fija
   el estilo del resto.
4. Definir dónde se guardan (`apps/web/public/` o `apps/web/src/assets/`) y con
   qué formato y tamaños. **Ya no hay que decidir nada sobre Git LFS**: sin Unity
   no hay binarios de motor que lo justifiquen.
5. Sustituir los huecos por las imágenes, retirando el contorno discontinuo.

**Dependencias.** MCP de Higgsfield conectado (hoy no lo está). Ninguna
dependencia de código: los huecos ya existen y están marcados.

---

## 4. Deuda técnica conocida

### 4.1 `database.types.ts` desincronizado — RESUELTO

Estaba escrito a mano y describía un esquema imaginario. Se regeneró con la CLI
contra la base real al aplicar P1. Sigue vigente la regla: **se regenera, nunca
se edita a mano**.

```bash
npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts
```

### 4.2b Los nueve niveles sembrados son de otro juego

Descubierto el 4-sep-2026 leyendo la migración 0012. Las nueve filas de `levels`
llevan `validation_rules` del concepto anterior —el de escribir JavaScript—:
`requiresAsyncAwait`, `requiresRecursion`, `requiresArray`, `requiresDebugging`.
`starter_code` es texto JS. **No hay rejilla, ni salida, ni meta, ni pasos
óptimos en ninguna.** Existen los títulos y las narrativas, no los puzles.

Los diseña el usuario, y con ellos se rediseñan los títulos. Lo aplica el J7 del
roadmap del juego, que pasa a reescribir título, narrativa y `validation_rules`
además de sembrar la configuración. Ver `DISENO-DEL-JUEGO.md` §2 y
`ROADMAP-JUEGO.md` §3.

### 4.2 No hay catálogo de logros

La tabla `achievements` es el registro de logros **concedidos** a cada niño
(`user_id`, `achievement_key`, `title`, `awarded_xp`, `unlocked_at`, con
`unique (user_id, achievement_key)`). No existe la tabla que enumere los logros
posibles con sus condiciones de desbloqueo, así que la sala de trofeos sólo puede
listar lo conseguido. Diseñarla es el **paso 22** del roadmap.

**El paso 23.1 le dejó tres cosas decididas al 22**, para que ese catálogo no
tenga que redescubrirlas:

1. **Nada del cliente concede un logro.** El juego no los nombra siquiera: manda
   el intento y el servidor decide qué ganó. Es lo que permite añadir un logro
   sin volver a publicar el juego.
2. **La condición de cada logro es de una de dos clases**, y sólo una es barata.
   Un **predicado estructural sobre el programa enviado** —«usa un bucle», «lo
   resolvió con ≤ N bloques»— es una condición `jsonb` dentro de la RPC, y no es
   falsificable porque el servidor lee el programa en vez de fiarse. **Ejecutar
   el programa contra la rejilla** para comprobar que de verdad resuelve el nivel
   exige un intérprete de bloques en plpgsql, que es un proyecto propio y queda
   fuera. Eso deja **un solo bit confiado al cliente**, `is_success`, que es el
   mismo del que ya cuelga el XP por completar un nivel: los logros no añaden
   riesgo, sólo lo hacen visible.
3. **Las condiciones no van en `validation_rules`**, que se lee sin sesión. Ver
   §2.7.

Todo esto sólo funciona si el programa de bloques se serializa como **JSON**, y
por eso es la línea irreversible del contrato: ver `CONTRATO-DE-INTEGRACION.md`
§4.

### 4.3 Frontera del store: aguantó, y se mantiene

`ClassroomsProvider` fue el único archivo que cambió de raíz al conectar el
backend, como estaba previsto. La frontera se pagó sola: de las vistas sólo hubo
que tocar **cuatro cosas, y ninguna por el origen de los datos** —tres esperas,
para que ninguna pantalla anuncie un vacío mientras consulta, y el recuento de
cupos del buscador, que pasa a leer `memberCount` porque del salón ajeno el niño
no puede contar alumnos—.

Sigue en pie para lo que venga: ninguna vista habla con Supabase directamente.

### 4.4 El panel del tutor no es responsive

Descubierto al revisar el aviso de error en móvil. Con el viewport a 375 px, la
barra lateral ocupa **262 px fijos** y `main` se queda en **113 px**: todas las
secciones del panel —tarjetas de estadística, bandeja de solicitudes, tabla de
seguimiento— miden 73 px de ancho. No es de una pantalla concreta; es la
maquetación del panel entero, que nunca tuvo repliegue para pantallas
estrechas.

No lo introdujo el paso 10: se ve igual en todo lo que ya existía. Se anota
aquí porque hasta ahora nadie lo había medido, y porque es trabajo del **paso
25** (responsive, accesibilidad y `ErrorBoundary`).

**El paso 28 lo empeora a sabiendas.** La tabla de seguimiento ganó la columna de
XP, así que a 375 px reparte los mismos 73 px entre una pista más. No se arregló
ahí porque el repliegue es del panel entero y no de una tabla: hacerlo en una
sola dejaría el resto igual de roto y con una excepción que explicar.

### 4.5 `profile.service.ts` sigue devolviendo inglés

El paso 28 tradujo `auth.service.ts` y **sólo ése**. `profile.service.ts` sigue
pasando por `createAppError`, que usa `error.message` crudo, así que un fallo al
cargar o actualizar el perfil llega en inglés igual que antes.

Se dejó fuera a propósito: no es lo que ve el niño al no poder entrar, y meterlo
en el mismo cambio habría mezclado dos superficies. **El patrón ya está escrito**
—mapa por código más helper local—, así que cerrarlo es copiarlo, no diseñarlo.
Los otros cinco servicios que usan `createAppError` están en la misma situación.

### 4.6 Ramas del mapa de errores que la interfaz no puede disparar

De las quince entradas de `AUTH_ERROR_MESSAGES`, **ocho no puede alcanzarlas la
interfaz de hoy**, y conviene saber por qué antes de creerlas verificadas:

| Rama | Por qué no llega |
| --- | --- |
| `weak_password` | `min(6)` de zod en los cuatro esquemas de contraseña |
| `email_address_invalid` | `z.string().email()` valida antes de enviar |
| `validation_failed` | Los esquemas cubren los campos que se mandan |
| `email_not_confirmed` | `mailer_autoconfirm` está encendido |
| `signup_disabled` | El interruptor está activo |
| `user_not_found` | `resetPasswordForEmail` responde igual exista o no la cuenta, a propósito |
| `reauthentication_needed` | No se pudo fabricar; ver §2.2 |
| `over_request_rate_limit` | Alcanzable repitiendo fallos en `/login`, no se provoca a propósito: deja el proyecto limitado un rato |

**`weak_password` se queda aunque hoy no llegue**, y ése es el caso que enseña la
regla: el mínimo del servidor se configura en el panel de Supabase, así que si
alguna vez sube por encima de 6, zod deja de atraparlo y la rama se enciende
sola. Lo único comprobado en pantalla es `invalid_credentials`, que es lo que
devuelve `/login` con la contraseña equivocada.

### 4.7 ESLint 8 sin soporte

`.eslintrc.cjs` usa la configuración heredada. Migrar a ESLint 9 con
configuración plana es una tarea pendiente sin urgencia.

### 4.8 Bundle: 625 kB de aplicación, 648 kB de editor y 905 kB de escena

`npm run build` avisa de que los chunks superan los 500 kB. Sin urgencia, pero
conviene no perderlo de vista ahora que el juego crece. Se resolvería con
`manualChunks` o más importaciones dinámicas por ruta.

**Medido el 10-sep-2026, con el J6.4 cerrado**: trozo principal **625,00 kB**
(167,90 gzip), trozo `BlockEditor` **648,40 kB** (174,73), trozo `GameScene`
**904,65 kB** (246,46), hoja de estilos **53,32 kB** (10,11).

**El principal no se movió NI UN BYTE**, que era la marca de que la frontera
diferida sigue en pie: los modelos, el cargador y el límite de error viven todos
del lado perezoso. `GameScene` sube **55,13 kB** (+16,63 gzip) y **es el cargador,
no los modelos**: los `.glb` se piden por URL desde `public/` y no entran al
empaquetado —medido en los dos sentidos: meter los 80 del survival y borrar los
330 de nature dejó el trozo exactamente igual—. Con `useGLTF` de drei habrían sido
**78,80 kB**, porque su módulo arrastra los decodificadores de Draco y de Meshopt,
que aquí no se usan; por eso se carga con `useLoader` y el `GLTFLoader` de `three`.

**Y las cifras de partida de este apartado estaban desfasadas**, lo que se vio al
medir antes de tocar nada: el árbol daba **648,40** y **53,32** donde el bloque de
abajo decía 647,94 y 53,25. No es una medida mala: el commit `7b5c43a` —los cuatro
ajustes de encuadre— metió 92 líneas en `BlockEditor.tsx`, tocó `main.css` y **no
actualizó esta sección**. Los números de arriba son los buenos.

**Medido el 9-sep-2026, con los seis defectos del J6.3 corregidos**: trozo
principal **625,00 kB** (167,90 gzip), trozo `BlockEditor` **647,94 kB** (174,54),
trozo `GameScene` **849,48 kB** (229,79), trozo compartido `program` **0,35 kB**
(0,24), hoja de estilos **53,25 kB** (10,09), **786 módulos**.

**El principal no se movió NI UN BYTE en las correcciones**, que era el número en
juego: el retorno del bloque a la caja, la clase que apaga los recortes, el tema
y los iconos de los bloques viven en `BlockEditor` —**+3,09 kB**—, y los iconos
de los controles y el mensaje portalado en `GameScene` —**+1,96 kB**—.
**`zelos` no costó nada**: viene dentro de `blockly/core`, así que ya estaba en
ese trozo antes de usarlo. Los módulos, los mismos 786. Marcas que sobreviven a la
minificación: `rootCount` sale **5** veces en `GameScene` y **0** en el principal;
`blockedBy`, **7** y **0**; `OrbitControls`, **3** y **0**; los textos
—«Ejecutando el programa», «Pasos: », «Te sobraron bloques», «Has detenido el
recorrido»—, **1** y **0** cada uno; `blocklySvg`, **3** en `BlockEditor` y **0**
en el principal; y `arrastrando-bloque`, **1** en `BlockEditor` y **5** en la hoja
de estilos, **0** en el principal. **`readProgram` y `runProgram` dan cero en los
tres trozos** y por eso no valen como marca: el minificador los renombra, que es
la trampa de `countSteps`.

**Medido el 8-sep-2026, después del J6.3**: trozo principal **625,00 kB**
(167,90 gzip), trozo `BlockEditor` **644,86 kB** (172,98), trozo `GameScene`
**847,49 kB** (229,23), trozo compartido `program` **0,35 kB** (0,24), **786
módulos**.

**El J6.3 dejó el principal EXACTAMENTE igual —ni un byte— pese a meter una
dependencia nueva.** `drei` salió entero donde debía: `GameScene` sube **16,74
kB** (+4,80 gzip) y `BlockEditor` **0,43 kB** —la caja suelta—. **Los módulos
saltan de 221 a 786**, y eso sí asusta a primera vista: son los archivos que
`drei` hace recorrer, no peso. Lo que cuenta es el trozo, y son 16,74 kB por un
`OrbitControls`. Marcas que sobreviven a la minificación: `OrbitControls` sale
**3** veces en `GameScene` y **0** en el principal; `rootCount`, **5** y **0**; y
los textos —«Ejecutando el programa», «Pasos: », «Te sobraron bloques»—, **1** y
**0** cada uno. **El intérprete no subió con los botones**, que era el riesgo de
sacarlos a la columna derecha con un portal.

**Medido el 7-sep-2026, después del J6.2**: trozo principal **625,00 kB**
(167,90 gzip), trozo `BlockEditor` **644,43 kB** (172,75), trozo `GameScene`
**830,75 kB** (224,43), trozo compartido `program` **0,35 kB** (0,24), **221
módulos**. Antes del J6.2 eran los mismos salvo `GameScene`, en 830,87 (224,43);
antes del J6.1, 830,27 (224,28); antes del J6, 829,26 (223,90); y antes del J5,
624,78 (167,77), 644,50 (172,77), 825,21 (222,25) y 219 módulos, sin trozo
compartido.

**El J6 no movió el principal ni un byte, ni los módulos.** Los +1,01 kB del
recuento y de la barra de resultado salieron enteros en `GameScene`, que es donde
debían. Se comprobó además con marcas que **sobreviven a la minificación** —ver
§2.9: `countSteps` no vale, porque el minificador la renombra y da cero en los
dos trozos—: `rootCount` sale **4** veces en `GameScene` y **0** en el principal,
y los dos textos nuevos de la barra, **1** y **0**.

**El J6.1 tampoco, y traía un motivo real para sospechar.** Sus +0,60 kB salieron
en `GameScene`, con los mismos 221 módulos, **y eso pese a que `interpreter.ts`
pasó a importar de `program.ts` un valor donde antes sólo importaba un tipo**
—`openProgram`—. La importación no movió nada de trozo porque los dos módulos ya
estaban del lado perezoso y `GameScene` importaba los dos; la dirección además es
la buena, el que conoce la carta importando al que sólo conoce el sobre. Marcas:
`rootCount` **7** en `GameScene` y **0** en el principal, y los tres textos
nuevos —«Tu programa cuesta», «Tienes bloques sueltos», «Ejecutando el
programa»—, **1** y **0**. **`programCost` da cero en los dos trozos**, que es la
misma trampa que `countSteps` y por el mismo motivo.

**El J6.2 fue el primer paso del juego que ADELGAZA el trozo.** Al retirar el
coste de «mientras construye», `GameScene` baja **0,12 kB** — poco, porque el
aviso de sueltos se quedó y el contador sobre el lienzo entró. El principal y los
módulos, otra vez sin moverse. Marcas: «Tu programa cuesta» a **cero** en los dos
trozos; «Tienes bloques sueltos» —el que se queda— y «Te sobraron bloques
sueltos» en **uno** cada uno en `GameScene` y **cero** en el principal, y
`rootCount` en **cinco**.

**La línea de partida del juego era otra y conviene no confundirlas.** Antes del
J1 había **un solo chunk de 623,18 kB** (166,96 gzip) y 177 módulos; el J1 lo
partió en dos y dejó el principal en 624,57 kB —los +1,39 kB son el ayudante de
precarga que Vite añade al primer `import()` del proyecto y se paga una sola
vez—, con el motor 3D entero en 823,50 kB aparte.

**La regla, desde el J1: el principal no debe subir por lo que el juego
incorpore.** Lo que crezca tiene que salir en el trozo del juego, y se comprueba
en cada paso. El J2 no lo movió ni un byte, y el J3 tampoco: los 0,02 kB de
`optimalSteps` salieron donde debían —trozo del juego **825,21 kB** (222,25
gzip)—, con los mismos **209 módulos**.

**El J5 lo movió 0,22 kB, de 624,78 a 625,00, y es el caso que el propio
requisito exime: «el coste fijo de tener esas descargas aparte».** Apareció un
**cuarto trozo**, `program-*.js`, de 0,35 kB: el sobre y los nombres de los tres
bloques, que desde el J5 usan **los dos** trozos perezosos —el editor para
construir, la escena para ejecutar—, así que Vite los saca a un trozo compartido
en vez de duplicarlos. Lo que crece en el principal es **la entrada de ese trozo
en su mapa de precarga**, y se comprobó que es eso: la cadena `program-Ds42CEFO`
aparece **una** vez en el principal, y `readProgram`, `runProgram` y `blockedBy`,
**cero**. El intérprete entero cayó donde debía: `GameScene` sube 4,05 kB.

**El J4 lo movió 0,21 kB, de 624,57 a 624,78, y conviene saber por qué.** No es
Blockly: la librería cayó entera en su propio trozo, `BlockEditor-*.js`, y
**ninguna marca suya aparece en el principal** —`blocklySvg`, `blocklyWidgetDiv`,
`blocklyDraggable` y `codeplay_advance`, cero veces cada una, contadas con
`grep -o … | wc -l`—. Los 0,21 kB son **el cargador nuevo y la tarjeta del
laboratorio**, que por diseño viven por encima de la frontera: algo tiene que
disparar el `import()`. `GameScene` no se movió ni un byte, e `index.html` sigue
precargando **sólo** el trozo principal: ni el editor ni la escena.

### 4.9 El nombre sólo lo valida el cliente

`update_my_profile` **no valida `full_name` en absoluto**: el cuerpo es
`full_name = coalesce(input_full_name, full_name)`, sin `trim`, sin longitud y
sin rechazar la cadena vacía. La columna es `text not null default ''` y no tiene
`check`. Contrasta con el `username`, que la misma RPC sí normaliza y acota a
3–30 antes de escribir.

Desde `nombre-editable` la única defensa es `components/auth/fullName.schema.ts`,
en el navegador. Basta para lo que motivaba la regla —que un nombre de 500
caracteres no rompa la tabla del salón, que ya va justa de ancho—, pero quien
llame a la RPC por fuera de la aplicación se la salta con una sesión
`authenticated` cualquiera.

**No se cerró con un `check` a propósito**, y no es pereza: exigiría migración, y
sobre todo podría **rechazar filas ya guardadas**. `full_name` nunca ha tenido
validación, así que nada garantiza que lo almacenado hoy cumpla lo que se decida
mañana. Cerrarlo de verdad es censar antes lo que hay.

### 4.10 El editor deja de publicar, y en ese estado el juego no se puede jugar

**La más seria de esta lista, y desde el J6.3 CON CAUSA.** El detalle, las
mediciones y todo lo descartado están en §2.9, en «El editor deja de publicar»;
aquí sólo lo que hay que saber para no tropezar con ella:

A veces —intermitente, y cuando se cae se queda caído— **Blockly deja de repartir
eventos de cambio en la página**. Los bloques se crean y se pintan, pero ningún
escuchador se entera, así que el editor no publica y el programa que llega al
juego se queda vacío. Le pasa igual a un **arrastre real** desde la caja de
herramientas, medido: el niño coloca sus bloques, los ve, pulsa «Ejecutar» y la
barra le dice que no hay bloques que ejecutar.

**Es preexistente: viene del J4**, que es cuando entró el editor, y no lo trae
ningún paso del J6. Hoy sólo lo tapa que el editor viva en una ruta de
desarrollo, y **no hay forma de comprobar si ocurre en producción hasta el J8**,
porque hasta entonces no existe ninguna pantalla de producto con editor.

**La causa, encontrada en el J6.3 y en el fuente**: el reparto de eventos de
Blockly 12 cuelga de un `requestAnimationFrame` —`fireInternal`,
`blockly_compressed.js:86`—, así que **en una página estrangulada la cola no se
vacía nunca** y ningún escuchador recibe nada, mientras crear el bloque y
serializarlo siguen funcionando porque son síncronos. El control que lo cierra:
**un espacio de trabajo recién inyectado de fábrica en esa misma página falla
igual**, y en cuanto vuelve el `rAF` publica. Antes de eso se habían descartado
midiendo `React.StrictMode`, el espacio desechado, los eventos deshabilitados, la
copia doble del módulo y la caché de Vite, y no hay errores en consola.

**Sigue subido al usuario**, y ahora con la causa delante: es suyo decidir si se
ataca antes del J8 o se deja anotado. Lo que **no** cierra es si ocurre en
producción, porque hasta el J8 no hay pantalla de producto con editor.

**Y para verificar cualquier pantalla con editor, dos señales y no una**, porque
son dos fallos distintos: **cero frames de `requestAnimationFrame`** significa que
Blockly no reparte **y** que la escena no avanza; **frames que corren** descartan
lo primero pero **no** lo segundo —la escena puede seguir congelada con sesenta
fps, y ahí la señal es que el recorrido progrese y el remedio `resize_window`—.
**`document.hidden` no detecta ninguno de los dos**: sale `false` en ambos.

---

## 5. Estado verificado

Comprobado el **2 de septiembre de 2026** ejecutando los comandos:

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | ✅ Pasa. 164 módulos, 2,1 s. Sólo avisa del tamaño del chunk |
| `npm run lint` | ✅ Pasa. Cero errores y cero warnings |
| `npm run test:run` | ✅ Pasa. **109 tests** en 15 archivos tras el paso 19, que añadió doce y **no retiró ninguno** —comparados por el nombre de cada `it(`, no por el total; ver la nota de abajo sobre la codificación—. Eran 97 en 12 archivos tras el paso 18, que añadió siete y **no retiró ninguno** —comparados por el nombre de cada `it(`, no por el total—. Eran 90 tras el paso 16 y 75 tras el 15. La única baja del proyecto sigue siendo `inviteByEmail añade la invitación con el correo normalizado`, que se fue con `invitaciones-sin-correo` al desaparecer la función que probaba: baja legítima, comprobada por nombre y no por recuento |
| **Los dos tests del `loading` del paso 18 tienen dientes** | ✅ Comprobado revirtiendo el arreglo, no supuesto. El primero falla si el camino silencioso vuelve a levantar `loading`; el segundo, si deja de apagarlo. El primer intento **no** los tenía —con una lectura que resuelve al instante, React agrupa el `loading` intermedio y nadie llega a verlo—, y por eso el servidor falso gana `holdReads()`: el aserto cae **mientras** la consulta está en vuelo |
| **Los tests del enlace de invitación tienen dientes** | ✅ Comprobado rompiendo el código, no supuesto. Quitando el borrado de `takePendingInvitationToken()` caen dos de los cinco del helper; haciendo el borrado de `Invite` condicional al token que coincide cae **sólo** el del token viejo, que es el que se pagó por tener; y consumiendo el token dentro de `resolveLandingRoute()` caen tres de los cuatro de `PublicRoute` bajo StrictMode |
| **Cuidado al comparar tests por nombre en Windows** | La salida de `git show` sale en cp1252, así que compararla con archivos leídos en UTF-8 marca como «retirados» todos los nombres con acento. Hay que decodificar la salida de git como UTF-8 explícitamente: sin eso, el primer intento dio 52 falsos retirados |
| Panel del tutor y del niño con la sesión de invitado | ✅ Navegan sin errores en consola. Los mundos se pintan desde Supabase —«Selva Algorítmica», `0/3 NIVELES`—, no desde el respaldo local |
| Flujo de salones de punta a punta contra la base real | ✅ Crear salón, buscar por ID público, solicitar, ver la solicitud con nombre, aceptar, ver compañeros, rechazar, reintentar y borrar en cascada |
| Registro real con rol, contra la base | ✅ Tutor registrado desde la interfaz: `profiles.role = 'tutor'` y aterriza en `/teacher/groups`. Alta por `curl` con `role: "superadmin"` en los metadatos: el alta no falla, el perfil sale `child` y aterriza en `/dashboard/worlds` |
| Acceso real por rol, con las cuentas de `.env` | ✅ El tutor va a `/teacher/groups` y el niño a `/dashboard/worlds`, sin parpadeo de panel ajeno y sin errores en consola |
| **Cambio de contraseña desde Ajustes** (mitad A del paso 13), contra la base real | ✅ Con la actual **equivocada** no cambia nada, la sesión sigue abierta, el motivo se ve en pantalla y la antigua sigue entrando por `curl`. Con la correcta, las dos respuestas de `/auth/v1/token`: la antigua rechazada y la nueva aceptada. Probado en alumno **y** en tutor, y los dos rechazos del formulario —las dos nuevas distintas y la nueva demasiado corta— sin llegar al servidor |
| **El cambio desde Ajustes con «Secure password change» ENCENDIDO** (tarea 10.1) | ✅ Cuenta nueva, probado por API y desde la pantalla: `updateUser` responde 200 sin pedir nonce, la pantalla confirma, la anterior deja de entrar y la nueva entra. La sesión de segundos que emite `signInWithPassword` le basta al servidor, así que el interruptor se queda encendido y no hay código que cambiar |
| **`/reset-password` con el interruptor ENCENDIDO** — el camino que **no** reautentica | ✅ Medido con la cuenta del correo del dueño del proyecto, no deducido: el enlace aterrizó en la pantalla de contraseña nueva sin rebotar, el cambio se guardó sin exigencia de nonce y después se entró por `/login` con la contraseña nueva. La sesión que abre el enlace cuenta como reciente |
| **Recuperación de la contraseña olvidada** (mitad B del paso 13), de punta a punta | ✅ Petición hecha **una sola vez** contra la dirección del dueño del proyecto —la única a la que el correo de fábrica llega con fiabilidad—; el correo llegó, el enlace aterrizó en `/reset-password` sin rebotar a ningún panel y la contraseña nueva quedó fijada: comprobado por `curl` que la anterior dejó de entrar. `/reset-password` sin sesión redirige a `/login`, y `/forgot-password` con sesión y rol lleva al panel de ese rol |

**El paso 19, mitad A, verificado de punta a punta el 2 de septiembre de 2026.**
Trece comprobaciones por `curl` con cada negativo emparejado a su positivo, más
la verificación desde la interfaz con dos cuentas reales —una de Google y una
creada durante la prueba—. El detalle, tabla a tabla, está en §2.7. Lo que no se
podía suponer y sí se midió: **el token sobrevive el viaje a Google**, el canje y
la marca de la invitación ocurren **en la misma transacción** —`joined_at` y
`accepted_at` coinciden al microsegundo en los tres canjes—, y un canje fallido
**no gasta el enlace**.

**Cuidado al comprobar la pantalla de mundos:** `useWorlds()` arranca con la
lista vacía, así que durante la carga se pinta el respaldo de `worldsData.ts`
—«Bosque de Bucles», `4/10 NIVELES`— y sólo después llegan los datos reales. Ver
esos nombres no significa que el backend no responda; significa que se miró
demasiado pronto.

### Cómo comprobar algo contra la base real

**Es lo que más ha valido en todo el proyecto** —destapó la recursión de RLS del
paso 9 y probó que la verificación de contraseña del paso 13 no era decorativa—
y no estaba escrito en ninguna parte.

Las credenciales de las **tres cuentas de prueba que están en `.env`** —dos
tutores y un niño— viven en `apps/web/.env`, que está en `.gitignore`:
`VITE_DEV_TUTOR_EMAIL`, `VITE_DEV_TUTOR_PASSWORD`, `VITE_DEV_TUTOR2_EMAIL`,
`VITE_DEV_TUTOR2_PASSWORD`, `VITE_DEV_CHILD_EMAIL`, `VITE_DEV_CHILD_PASSWORD`,
junto a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

**El segundo tutor lo creó el usuario el 2 de septiembre de 2026, desde
`/signup`** y no desde el panel, para que el rol quedara fijado en el registro
como manda la 0018. Verificado contra la base: autentica, `profiles.role` es
`tutor` y **no tiene ningún salón propio**, que es justo lo que hace útil el
contraste. **No lo lee ningún código**: `VITE_DEV_TUTOR2_*` existe para abrir una
segunda sesión de tutor por `curl` o en otro navegador, así que `config/env.ts`
no lo valida y el botón «Sin login» lo ignora.

Existe además un **segundo niño**, de las tres cuentas del paso 11, que **no está
en `.env`**: se usó para el cupo lleno y sus credenciales las tiene el usuario.

El patrón son dos pasos: se pide un token y se consulta con él.

```bash
curl -s -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'
```

Del JSON sale `access_token`, y con él se consulta REST, que es donde actúa la
RLS de esa sesión:

```bash
curl -s "$URL/rest/v1/invitations?select=id,status" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"
```

Tres reglas que la práctica impuso:

- **Nunca imprimir una contraseña en la salida**, ni un `access_token`. Se leen
  del `.env` dentro del guion y se usan como variables.
- **Comprobar las dos respuestas, no una.** Que la nueva contraseña entre no
  prueba nada si no se comprueba además que la antigua dejó de entrar.
- **Un `select` sobre una columna que no existe responde `42703`**, y eso es
  justo lo que confirma que una migración se aplicó de verdad. Un `[]` sólo dice
  que no hay filas visibles para esa sesión.

### Herramientas que hay en la máquina, y las que no

Se comprueba antes de escribir una tarea que verifique con alguna: **ya pasó que
una tarea verificaba con `gh`, que no está**.

| Herramienta | Estado |
| --- | --- |
| `curl` 8.19 | ✅ |
| Docker 28.3 | ✅ |
| CLI de Supabase 2.115, con el proyecto **enlazado** (`supabase/.temp/`) | ✅ — `db push` y `gen types` piden credenciales por consola, así que **los lanza el usuario** |
| Python 3.12 | ✅ — útil para llamadas HTTP con JSON sin pelearse con las comillas de PowerShell |
| `psql` | ❌ no está: contra la base se va por REST o por la CLI |
| `gh` | ❌ no está: nada de tareas que verifiquen con la CLI de GitHub |

### Correcciones sobre `ESTADO-DEL-PROYECTO.md`

Ese documento se escribió el 18 de agosto de 2026 y dos de sus afirmaciones ya
no se sostienen:

1. **§4.1 «`npm run build` y `npm run lint` fallan» — resuelto.** Los tres
   errores de `StudentWorldsModule.tsx` ya no existen: el archivo se reescribió y
   hoy tipa `worldDifficulty` explícitamente en vez de usar `as any`.
2. **§3.2 «La aplicación arranca aunque estas variables estén vacías» — falso.**
   `config/env.ts` valida con zod y **lanza en tiempo de importación**; sin
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` válidas la app no carga.
3. **§4.5 «Alcance del rediseño» — resuelto.** Las pantallas que allí quedaban
   fuera (landing, login, registro, mundos, trofeos, ajustes) ya llevan el tema
   selva.

Todo lo demás de ese documento sigue vigente, y su guía de estilos (§2) es la
referencia completa de diseño.

### Cómo arrancar en frío

1. `npm install` en la raíz.
2. `cp apps/web/.env.example apps/web/.env` — hacen falta valores que pasen la
   validación de zod, o la app no arranca.
3. `npm run dev`.
4. Entrar por `/login` con una cuenta real, o registrar una desde `/signup`: el
   acceso real funciona desde el paso 12 y quien olvide su contraseña la
   recupera desde «¿Olvidaste tu contraseña?» (paso 13). Los botones **Sin
   login** de la barra superior siguen existiendo **sólo en desarrollo** y
   autentican de verdad con las cuentas de `VITE_DEV_*`.
