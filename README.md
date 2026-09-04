# CodePlay

Monorepo del proyecto de grado **CodePlay**: una plataforma web para aprender a
programar jugando, con un juego 3D integrado y Supabase como backend.

## Estructura

```
codeplay/
├── apps/
│   ├── web/          Front-end (React 18 + TypeScript + Vite + Tailwind)
│   └── game/         Pendiente. Ya no será Unity: ver docs/DISENO-DEL-JUEGO.md
├── packages/         Código compartido entre apps (pendiente)
├── supabase/         Esquema de base de datos: migraciones, seed y RLS
├── package.json      Raíz del monorepo (npm workspaces)
├── .eslintrc.cjs     Config de ESLint compartida
└── .prettierrc       Config de Prettier compartida
```

Gestor de monorepo: **npm workspaces**. No hace falta instalar nada extra: un solo
`npm install` en la raíz resuelve las dependencias de todos los paquetes en un
`node_modules` compartido.

## Puesta en marcha

```bash
npm install
```

Copia las variables de entorno del front y rellénalas con los datos de tu
proyecto de Supabase:

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) del proyecto |

Levanta el front:

```bash
npm run dev
```

## Comandos

Todos se ejecutan desde la raíz del repositorio.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo del front (Vite, puerto 5173) |
| `npm run build` | Chequeo de tipos + build de producción del front |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | ESLint sobre el front (0 warnings permitidos) |
| `npm run format` | Prettier sobre el código del front |

Para lanzar un script en un workspace concreto:

```bash
npm run <script> -w @codeplay/web
```

Para añadir una dependencia a un workspace concreto (no a la raíz):

```bash
npm install <paquete> -w @codeplay/web
```

## Base de datos (Supabase)

El esquema vive en `supabase/` siguiendo la convención del CLI de Supabase, así
que los comandos funcionan sin flags adicionales desde la raíz del repo. Requiere
tener el [CLI de Supabase](https://supabase.com/docs/guides/cli) instalado.

```bash
supabase db reset     # recrea la base local y aplica migraciones + seed
supabase db push      # aplica las migraciones al proyecto remoto
```

El detalle de cada migración está en `supabase/README.md`.

## Integrar el juego

**Lee primero estos dos documentos:**

- [`docs/DISENO-DEL-JUEGO.md`](docs/DISENO-DEL-JUEGO.md) — qué es el juego, cómo
  se juega y cómo se puntúa.
- [`docs/CONTRATO-DE-INTEGRACION.md`](docs/CONTRATO-DE-INTEGRACION.md) — qué
  recibe, qué manda y en qué formato, y qué le garantiza la plataforma. Está
  escrito para quien construye el juego y **no da por conocido este
  repositorio**: se sostiene solo.

**Ya no es Unity.** El 3 de septiembre de 2026 se descartó en favor de librerías
de JavaScript, para que el juego sea un componente más de la aplicación web en
vez de un programa aparte. Sigue siendo 3D y sigue cargando assets.

Lo que eso cambia respecto a lo que este README decía antes:

1. **No hay proyecto de Unity en `apps/game/`.** Falta decidir si el juego vive
   en `packages/game/` o dentro de `apps/web/src/`.
2. **No hay build de WebGL** que generar ni que copiar a `apps/web/public/game/`.
   El juego se empaqueta con la aplicación, así que esa carpeta ya no hace falta.
3. **No hace falta Git LFS.** Su motivo eran los binarios del motor —escenas,
   prefabs, `Library/`—, y sin Unity quedan unos pocos modelos `.glb` de
   kilobytes. Las reglas siguen comentadas en `.gitattributes` y ahí pueden
   quedarse.

Lo que sí hay que recordar: **el juego debe cargarse sólo en la pantalla de
nivel**, con importación dinámica, para que quien entre a la web no se descargue
el motor 3D sin jugar.
