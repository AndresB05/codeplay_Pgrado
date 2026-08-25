## Why

`npm run lint`, `npm run build` y `npm run test:run` pasan hoy, pero sólo cuando
alguien se acuerda de ejecutarlos en su máquina. Los 54 tests que se acaban de
escribir son una red de seguridad para el refactor de P3
(`salones-persistentes`), y una red que sólo se comprueba a mano se rompe sin
que nadie se entere: el commit que la rompe entra igual, y el fallo aparece
semanas después, mezclado con otros cambios.

El momento es ahora porque P3 reescribe `ClassroomsProvider` entero. Conviene que
la primera vez que esos tests digan «esto ya no pasa» sea en un pull request y no
en una sesión de depuración tres semanas más tarde.

## What Changes

- Se crea la carpeta `.github/workflows/` —hoy no existe— con un único workflow
  de integración continua.
- El workflow ejecuta `npm run lint`, `npm run test:run` y `npm run build` en
  cada push a `main` y en cada pull request dirigido a `main`.
- La versión de Node se fija explícitamente en el workflow, en vez de heredar la
  que traiga el runner de GitHub por defecto.
- No se despliega nada. El workflow sólo verifica; no publica, no sube
  artefactos y no toca ningún servicio externo.
- No se modifica ningún archivo de producción ni ningún script existente. El
  workflow ejecuta los tres comandos que ya están en `package.json`, tal cual.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna.

**Este cambio no lleva deltas de spec, y es deliberado.** Igual que
`infraestructura-tests`, es herramienta de desarrollo: automatiza la ejecución de
comandos que ya existen y que ya pasan. Un niño o un tutor usando CodePlay no
percibe ninguna diferencia; la aplicación hace exactamente lo mismo antes y
después. Los specs principales describen lo que el sistema hace, y aquí el
sistema no cambia lo que hace.

Por eso `.openspec.yaml` declara `skip_specs: true`. Inventar un requisito del
tipo «el sistema SHALL verificarse en cada push» para que `openspec validate`
pase metería en `openspec/specs/` una afirmación sobre el proceso de desarrollo,
no sobre el producto, que es justo lo que la plantilla de OpenSpec advierte que
no se haga.

## Impact

**Archivos nuevos**

| Archivo | Contenido |
| --- | --- |
| `.github/workflows/ci.yml` | **Nuevo.** Único workflow: instala, lint, tests y build |

La carpeta `.github/` se crea con este cambio. Estaba borrada desde el commit
`7c84a93`, que eliminó `.github/workflows/main_gym.yml` —un workflow de
despliegue a Azure de otro proyecto, generado por el portal de Azure, que
fallaba en cada push porque intentaba instalar dependencias de Python en un
repositorio de React.

**Comandos que el workflow ejecuta, sin modificarlos**

| Comando | Definido en | Estado hoy |
| --- | --- | --- |
| `npm run lint` | `package.json` → `apps/web/package.json` | ✅ 0 errores, 0 warnings |
| `npm run test:run` | `package.json` → `apps/web/package.json` | ✅ 54 tests |
| `npm run build` | `package.json` → `apps/web/package.json` | ✅ `tsc && vite build` |

**Documentación a actualizar**

| Archivo | Qué |
| --- | --- |
| `docs/CONTEXT.md` §1.2 y §1.3 | Registrar el workflow y la carpeta `.github/` |
| `openspec/config.yaml` | Replicar lo que se añada a §1, como exige la regla 4 de §0.3 |

Este cambio es de herramienta, así que **no entra en la lista de §3 ni pasa a
§2**: no sale de las prioridades P1-P6. Es la regla de archivado que se corrigió
al cerrar `infraestructura-tests`.

**Dependencia de Supabase: ninguna.** El workflow **no** requiere que el proyecto
de Supabase esté creado ni enlazado, y no lo desbloquea. Conviene precisar por
qué, porque no es evidente: `apps/web/.env` está en `.gitignore`, así que el
runner nunca tendrá las variables reales. No hace falta que las tenga.
`config/env.ts` valida con zod **en tiempo de importación en el navegador**, no
durante el build; Vite se limita a sustituir `import.meta.env.*` por literales al
empaquetar. Con valores de relleno, el build es representativo y no se filtra
ningún secreto. El diseño lo trata como decisión explícita.

**Fuera del repositorio, sin bloquear este cambio.** Siguen pendientes las dos
tareas que dejó anotadas el commit `7c84a93`: borrar los secretos
`AZUREAPPSERVICE_CLIENTID`, `AZUREAPPSERVICE_TENANTID` y
`AZUREAPPSERVICE_SUBSCRIPTIONID` en los ajustes de GitHub, y reapuntar el
Deployment Center de la App Service «gym» al repositorio que le corresponde.
Mientras el Deployment Center siga apuntando aquí, puede volver a escribir su
workflow en `.github/workflows/`. Este cambio no lo impide y no lo intenta: son
ajustes de la cuenta de GitHub y de Azure que tiene que hacer una persona.
