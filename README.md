# CodePlay

Monorepo del proyecto de grado **CodePlay**: una plataforma web para aprender a
programar jugando, con un juego de Unity integrado y Supabase como backend.

## Estructura

```
codeplay/
├── apps/
│   ├── web/          Front-end (React 18 + TypeScript + Vite + Tailwind)
│   └── game/         Proyecto de Unity (pendiente)
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

## Integrar el juego de Unity

Convenciones acordadas para cuando entre el proyecto de Unity:

1. El proyecto de Unity va en `apps/game/`. El `.gitignore` de la raíz ya excluye
   `Library/`, `Temp/`, `Logs/` y demás carpetas generadas, que son las que
   inflan el repositorio.
2. El build de WebGL se genera en `apps/web/public/game/`. Vite sirve todo lo que
   hay en `public/` tal cual, así que el front puede embeber el juego desde
   `/game/`. Esa carpeta está ignorada por git: es un artefacto de build y se
   regenera, no se versiona.
3. **Antes del primer commit de Unity**, configurar [Git LFS](https://git-lfs.com)
   para los binarios (texturas, audio, modelos) y `unityyamlmerge` para resolver
   conflictos en escenas y prefabs. Sin LFS, el repositorio se vuelve inmanejable
   en pocas semanas.
4. En Unity: *Edit → Project Settings → Editor* con `Version Control: Visible Meta
   Files` y `Asset Serialization: Force Text`, para que los `.meta` y las escenas
   sean diffeables.
