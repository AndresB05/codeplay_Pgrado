# CodePlay

Proyecto de grado **CodePlay**: una plataforma web para que los niños
aprendan pensamiento computacional jugando. Los alumnos resuelven nueve niveles
3D programando con bloques; los tutores crean salones, asignan misiones y siguen
el progreso de cada alumno.

**Publicada en:** https://ingenieria.unac.edu.co/~andres.blanco/

## Estructura

```
codeplay/
├── apps/
│   └── web/          Aplicación (React 18 + TypeScript + Vite + Tailwind)
│       └── src/game/ El juego: three.js para la escena y Blockly para los bloques
├── packages/         Código compartido entre apps (vacío por ahora)
├── supabase/         Esquema de base de datos: migraciones, seed y RLS
├── docs/             Estado del proyecto, hoja de ruta y diseño del juego
└── openspec/         Especificaciones y cambios (OpenSpec)
```

El backend es **Supabase**: Postgres, autenticación (contraseña y Google),
Realtime y las funciones que calculan puntuación, XP, rachas, logros y misiones
en el servidor.

Gestor de monorepo: **npm workspaces**. Un solo `npm install` en la raíz resuelve
las dependencias de todos los paquetes.

## Puesta en marcha

```bash
npm install
```

Copia las variables de entorno y rellénalas con los datos de tu proyecto de
Supabase:

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) del proyecto |
| `VITE_ENABLE_DEV_TOOLS` | `true` enciende el botón «Sin login» y el Laboratorio 3D. Sólo en desarrollo |
| `VITE_DEV_TUTOR_EMAIL`, `VITE_DEV_TUTOR_PASSWORD`, `VITE_DEV_CHILD_EMAIL`, `VITE_DEV_CHILD_PASSWORD` | Cuentas de prueba que usa «Sin login». Sin ellas entra como invitado |

Levanta la aplicación:

```bash
npm run dev
```

## Comandos

Todos se ejecutan desde la raíz del repositorio.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite, puerto 5173) |
| `npm run build` | Chequeo de tipos + build de producción |
| `npm run build:unac` | Build para el servidor de la universidad (ruta `/~andres.blanco/` y `.htaccess`) |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | ESLint (0 warnings permitidos) |
| `npm run test` | Vitest en modo watch |
| `npm run test:run` | Vitest, una sola pasada |
| `npm run format` | Prettier sobre el código |

Para lanzar un script o añadir una dependencia en un workspace concreto:

```bash
npm run <script> -w @codeplay/web
```

## Base de datos (Supabase)

El esquema vive en `supabase/` siguiendo la convención del CLI de Supabase.
Requiere tener el [CLI de Supabase](https://supabase.com/docs/guides/cli)
instalado.

```bash
supabase db reset     # recrea la base local y aplica migraciones + seed
supabase db push      # aplica las migraciones al proyecto remoto
```

El detalle de cada migración está en [`supabase/README.md`](supabase/README.md).

## Despliegue

El front se sirve como archivos estáticos desde el Apache de la universidad
(`~/public_html`, con `mod_userdir`); la base, la autenticación y Realtime siguen
en Supabase. Se compila con `npm run build:unac` y se sube por `scp`, con la VPN
de la universidad conectada.

## Documentación

- [`docs/CONTEXT.md`](docs/CONTEXT.md) — estado del proyecto: qué está hecho y
  dónde vive.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — qué falta y en qué orden.
- [`docs/DISENO-DEL-JUEGO.md`](docs/DISENO-DEL-JUEGO.md) — qué es el juego, cómo
  se juega y cómo se puntúa.
- [`docs/CONTRATO-DE-INTEGRACION.md`](docs/CONTRATO-DE-INTEGRACION.md) — qué
  intercambian el juego y la plataforma.
