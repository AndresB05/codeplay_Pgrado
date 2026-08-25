## 1. Workflow de integración continua

Archivo: `.github/workflows/ci.yml`. La carpeta `.github/workflows/` se crea en
esta tarea; hoy no existe.

- [x] 1.1 Crear el workflow con `name`, los disparadores `push` y `pull_request` limitados a la rama `main`, y `permissions: contents: read` (design, decisiones 6 y 7). Verificación: el archivo existe y `python -c "import yaml,io;yaml.safe_load(io.open('.github/workflows/ci.yml',encoding='utf-8'))"` no lanza.
- [x] 1.2 Añadir el bloque `concurrency` agrupando por workflow y rama, con `cancel-in-progress: true`, para que un push nuevo cancele la ejecución anterior (design, decisión 6). Verificación: el YAML sigue parseando y contiene la clave `concurrency`.
- [x] 1.3 Definir un único job sobre `ubuntu-latest` con los pasos `actions/checkout@v4` y `actions/setup-node@v4`, este último con `node-version: '22.17.1'` y `cache: 'npm'` (design, decisiones 3 y 8). Verificación: `grep -n "22.17.1" .github/workflows/ci.yml` devuelve la línea.
- [x] 1.4 Añadir el paso de instalación con `npm ci` en la raíz del repositorio, sin `-w`: con workspaces cubre `apps/web` (design, decisión 4). Verificación: el paso ejecuta `npm ci` y no `npm install`.
- [x] 1.5 Añadir los tres pasos de comprobación en orden `npm run lint`, `npm run test:run`, `npm run build`, cada uno con `if: ${{ !cancelled() }}` para que los tres se ejecuten aunque uno falle (design, decisión 2). Verificación: los tres pasos aparecen en ese orden y todos llevan la condición.
- [x] 1.6 Dar al paso de build las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de relleno de `apps/web/.env.example`, en un bloque `env` del propio paso y **sin** usar `secrets` (design, decisión 5). Verificación: el paso de build declara las dos variables y ningún paso referencia `secrets`.

## 2. Comprobación local antes de empujar

- [x] 2.1 Ejecutar `npm ci` en una copia limpia o, como mínimo, comprobar que `package-lock.json` está sincronizado con los dos `package.json`. Verificación: `npm ci --dry-run` termina sin errores de lock desincronizado, que es lo que haría fallar el paso 1.4 en el runner.
- [x] 2.2 Revisar que ningún import del código difiere en mayúsculas del nombre real del archivo, que es el fallo típico al pasar de Windows a Linux (design, Risks). Verificación: `npm run build` pasa y una revisión de los imports de `apps/web/src` no encuentra discrepancias de capitalización frente a los nombres de archivo reales.

## 3. Documentación de la herramienta

- [x] 3.1 Registrar el workflow en `docs/CONTEXT.md`: añadir `.github/workflows/ci.yml` al árbol de §1.3 y una línea en §1.2 indicando que lint, tests y build se verifican en CI sobre Node 22.17.1. Verificación: `grep -n "ci.yml" docs/CONTEXT.md` devuelve resultados.
- [x] 3.2 Replicar lo añadido a §1 en el bloque `context` de `openspec/config.yaml`, como exige la regla 4 de §0.3. Verificación: `npx openspec doctor` no reporta errores de parseo del YAML.
- [x] 3.3 No mover nada a §2 ni añadir nada a §3 de `docs/CONTEXT.md`: este cambio es de herramienta y no sale de las prioridades P1-P6 (regla 1 de §0.3, corregida al archivar `infraestructura-tests`). Verificación: el diff de `docs/CONTEXT.md` no toca las secciones 2 ni 3.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run lint` en local. Verificación: 0 errores y 0 warnings, porque corre con `--max-warnings 0`.
- [x] 4.2 Ejecutar `npm run build` en local. Verificación: `tsc && vite build` termina sin errores.
- [x] 4.3 Ejecutar `npm run test:run` en local. Verificación: los 54 tests pasan en verde.
- [ ] 4.4 Empujar y comprobar la ejecución real en GitHub, que es la única verificación que prueba el workflow de verdad. Verificación: abrir <https://github.com/AndresB05/codeplay_Pgrado/actions> en el navegador y confirmar que la ejecución del último commit aparece con la marca verde. Si sale roja, entrar en esa ejecución desde la misma pestaña, abrir el job y desplegar el paso marcado en rojo para leer su log, y arreglar la causa antes de dar el cambio por terminado: un workflow rojo que se deja pasar es exactamente lo que ocurrió con `main_gym.yml`. La CLI `gh` no está instalada en esta máquina, así que la comprobación es por navegador.
