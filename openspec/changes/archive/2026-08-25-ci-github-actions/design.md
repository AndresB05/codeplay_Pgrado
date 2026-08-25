## Context

Ver `proposal.md` — Why. El estado que condiciona el diseño, verificado en el
repo:

- **`.github/` no existe.** Lo último que vivió ahí fue `main_gym.yml`, borrado
  en `7c84a93` por ser de otro proyecto y fallar en cada push. El listón está
  bajo: lo que se monte ahora tiene que pasar en verde desde el primer push, o
  repetirá la historia de un workflow rojo que todo el mundo aprende a ignorar.
- **Monorepo con npm workspaces y un solo `package-lock.json` en la raíz.** Los
  tres scripts de la raíz son proxys a `-w @codeplay/web`.
- **`apps/web/.env` está en `.gitignore`** (`.env`, `.env.*`, con `!.env.example`).
  El runner nunca lo tendrá.
- **`config/env.ts` valida con zod y lanza al importarse**, pero eso ocurre en el
  navegador. Vite sólo sustituye `import.meta.env.*` por literales al empaquetar:
  no ejecuta el código de la aplicación durante el build.
- **`engines` exige `>=18.18`; la máquina de referencia es Node 22.17.1.**
- **Todo se ha ejecutado siempre en Windows.** El repo tiene `.gitattributes` con
  reglas de fin de línea.

## Goals / Non-Goals

**Goals:**

- Que un pull request diga, sin intervención humana, si lint, tests y build
  siguen pasando.
- Que el resultado sea reproducible: misma versión de Node y mismas dependencias
  exactas en cada ejecución.
- Que un fallo señale el problema real y no un artefacto del entorno de CI.

**Non-Goals:**

- Desplegar, publicar o subir artefactos. El workflow sólo verifica.
- Cobertura, umbrales de calidad o análisis estático adicional.
- Protección de rama ni checks obligatorios: son ajustes de GitHub, no del
  repositorio, y los decide una persona.
- Probar varias versiones de Node o varios sistemas operativos.
- Cachear el build o los resultados de test entre ejecuciones.

## Decisions

### 1. Un workflow, un job, una instalación

Los tres comandos comparten el mismo `npm ci`, que es el paso caro. Repartirlos
en tres jobs paralelos triplicaría la instalación para ahorrar unos segundos de
ejecución: `lint` y `test:run` tardan segundos y el build unos pocos más. Un solo
job además da una única respuesta roja o verde, más fácil de leer en el PR.

### 2. Los tres pasos se ejecutan aunque uno falle

Con el comportamiento por defecto, si `lint` falla nadie se entera de que además
hay tests rotos: hay que arreglar, empujar y esperar otra vuelta. Los pasos de
lint, test y build llevan `if: ${{ !cancelled() }}` para que se ejecuten los tres
y el PR muestre todos los problemas de una vez. El job sigue fallando si
cualquiera falla; sólo cambia cuánto se aprende por vuelta.

El orden es **lint → test → build**: del más barato y específico al más caro. Un
error de tipos aparece tanto en `tsc` (dentro de `build`) como, a menudo, antes
en lint, y un test rojo es un diagnóstico más útil que un build roto.

### 3. Node se fija a `22.17.1`, no a `22.x` ni a una matriz

`actions/setup-node` con una versión exacta descarga esa versión si el runner no
la trae, así que la ejecución es reproducible aunque GitHub cambie la imagen por
debajo. Es la versión de la máquina de referencia, ya registrada en
`docs/CONTEXT.md` §1.2.

Alternativas descartadas:

- **Matriz `[18.18, 22.17.1]`**, para cubrir todo el rango que declara `engines`:
  duplica el tiempo de CI para proteger una compatibilidad que nadie usa. El
  proyecto se desarrolla y se ejecuta en 22.
- **`.nvmrc` con `node-version-file`**: mejor idea a largo plazo, porque unifica
  la versión para las personas y para CI en un solo archivo. Se descarta ahora
  por no introducir un archivo nuevo en un cambio que debe ser mínimo. Si en
  algún momento hay que fijar la versión también en local, ése es el camino.

**Consecuencia asumida:** CI prueba Node 22 y `engines` sigue admitiendo 18.18.
Si alguien clona con Node 18 y algo falla, CI no lo habrá avisado. Se acepta:
declarar `>=18.18` es una cota de instalación, no una promesa de soporte
verificado.

### 4. `npm ci` en la raíz, con caché de npm

`npm ci` instala exactamente lo que fija `package-lock.json` y falla si el lock y
los `package.json` divergen, que es justo la señal que se quiere en CI —
`npm install` los reconciliaría en silencio. Se ejecuta en la raíz: con
workspaces, una sola instalación cubre `apps/web`.

`actions/setup-node` con `cache: 'npm'` reutiliza la caché de descargas entre
ejecuciones apoyándose en el `package-lock.json` de la raíz. No cachea
`node_modules`: eso sí se reinstala siempre, que es lo que hace la comprobación
fiable.

### 5. El build recibe variables de entorno de relleno

`apps/web/.env` está en `.gitignore`, así que en CI no existe. Vite sustituiría
`import.meta.env.VITE_SUPABASE_URL` por `undefined` y el build **terminaría bien
igualmente**, porque la validación de zod corre en el navegador y no durante el
empaquetado. Es decir: sin variables, CI da verde y produce un bundle que
explotaría al abrirlo.

Para que el verde signifique algo, el paso de build recibe las dos variables con
los valores de relleno de `apps/web/.env.example`, declaradas en el propio
workflow. Son placeholders públicos, no secretos: no hay nada que filtrar y no se
usa `secrets`, que exigiría configurarlos a mano y no funcionaría en pull
requests de forks.

Alternativa descartada: dejar el build sin variables. Pasaría igual hoy, pero
deja una trampa para el día que se añada un paso que ejecute el bundle —un smoke
test, un `preview`— y falle por un motivo que no tiene nada que ver con el
cambio que lo dispare.

### 6. Disparadores: push a `main` y pull requests contra `main`

Es lo pedido, y encaja con cómo se trabaja aquí: los commits van directos a
`main`. El disparador de `pull_request` cubre las ramas cuando las haya, sin
gastar minutos en cada push a cada rama de trabajo.

Se añade `concurrency` con `cancel-in-progress`, agrupando por rama: si llegan
dos pushes seguidos, la ejecución vieja se cancela en vez de competir por los
runners. La comprobación que importa es siempre la del último commit.

### 7. `permissions: contents: read`

El workflow sólo lee el código: no comenta en PRs, no escribe tags, no publica.
Declarar el permiso mínimo de forma explícita evita heredar el token amplio por
defecto. Es especialmente pertinente aquí, donde el `.github/` anterior venía de
un generador externo con permisos de despliegue.

### 8. `ubuntu-latest`, con las actions fijadas a su major

Ubuntu es el runner más rápido y barato, y consume la cuota de minutos a tarifa
sencilla frente a Windows. Las actions se fijan a su major, que recibe parches
sin cambios rompedores.

**Corregido después del primer run.** Esta decisión fijó primero `@v4` en ambas
actions, razonando que un major sigue recibiendo mantenimiento. El primer run
demostró que la premisa era falsa: emitió el aviso «Node.js 20 is deprecated.
The following actions target Node.js 20 but are being forced to run on Node.js
24: actions/checkout@v4, actions/setup-node@v4». Es decir, v4 declara un runtime
deprecado y GitHub lo sostiene por compatibilidad, no por soporte.

Se sube a `actions/checkout@v5` y `actions/setup-node@v5`, que declaran
`using: node24` y no emiten el aviso. El argumento que decide no es la
deprecación en sí —el job pasaba en verde igualmente— sino el ruido: un warning
en cada ejecución enseña a ignorar el CI, que es exactamente el fallo que el
Context y los Risks de este documento señalan al recordar `main_gym.yml`.

Nota para la próxima vez que se toquen: en el momento del cambio,
`actions/checkout` iba ya por v7.0.1. Se eligió v5 porque resuelve el problema
—declara `node24`— sin arrastrar los cambios de dos majors que nadie ha
revisado. Subir más es una decisión aparte, no un efecto secundario de ésta.

## Risks / Trade-offs

- **Primera ejecución en Linux de un proyecto desarrollado sólo en Windows** →
  Es el riesgo con más probabilidad real de saltar. El sistema de archivos de
  Linux distingue mayúsculas: un `import './classroomsData'` que en Windows
  resuelve un archivo llamado `ClassroomsData.ts` funciona en local y falla en
  CI. Si ocurre, **el fallo es un bug de verdad** —un import mal escrito— y se
  arregla en el código, no relajando el workflow ni cambiando a `windows-latest`.
- **El Deployment Center de Azure puede reescribir `.github/workflows/`** →
  Sigue apuntando a este repositorio (`7c84a93`). Si vuelve a generar su
  workflow, aparecerá junto a `ci.yml` sin pisarlo, porque el nombre de archivo
  es distinto. La solución está fuera del repo y ya está anotada.
- **CI da verde en Node 22 y `engines` admite 18.18** → Asumido en la decisión 3.
- **Un workflow rojo por causas ajenas al código erosiona la confianza** → Es
  exactamente lo que pasó con `main_gym.yml`. Se mitiga con lo anterior: versión
  fijada, `npm ci` reproducible, variables de relleno explícitas y ningún paso
  que dependa de un servicio externo. Los tres comandos pasan hoy en local, así
  que el workflow debe salir verde en su primer push; si no lo hace, hay que
  entender por qué antes de dar el cambio por bueno.
- **Los minutos de Actions no son infinitos** → Un job de un par de minutos, con
  cancelación de ejecuciones superadas y sin matriz. En un repositorio público la
  cuota no aplica.

## Migration Plan

No aplica. No hay datos, no hay despliegue y no se modifica ningún archivo
existente. Retroceder es borrar `.github/workflows/ci.yml`.

## Open Questions

- **¿Insignia de estado en el `README.md`?** Es cosmético y no cambia el
  workflow, las tareas ni el enfoque: se puede añadir después con una línea. No
  se incluye ahora para mantener el cambio mínimo.
