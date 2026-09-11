## Why

El juego está terminado por dentro y no tiene nada que jugar: la escena se monta
contra `debugLevel`, la rejilla de pega del J2, y las nueve filas de `levels` son
las del juego anterior —el de escribir JavaScript—, sin rejilla, sin salida, sin
meta y sin pasos óptimos. Mientras eso siga así, **lo único jugable vive en una
ruta de desarrollo** y la pantalla de niveles del producto enseña diez títulos
inventados de un mundo que resuelve mal.

Éste es el J7.1: el **primer nivel diseñado**, sembrado en su fila y jugado desde
ella. Y se hace **donde va de verdad** —la pantalla de nivel, no el laboratorio—,
decisión del usuario del 11-sep-2026: adelanta el J8 porque montar el mismo
trabajo dos veces, primero contra el banco de pruebas y después contra la
pantalla, es hacerlo dos veces.

## What Changes

- **Se siembra el nivel 1 del mundo 1** con el puzle que diseñó el usuario.
  Título **`Nivel 1 - Siempre adelante`** y slug **`siempre-adelante`**, que deja
  de ser `ruta-del-colibri` —sin tilde, que es como está escrito en la base—.
- **Y el puzle se rediseña una segunda vez, con el usuario mirándolo jugarse.**
  Nació 1 × 4 con `optimalSteps` 3, se sembró y se jugó así; al verlo pidió «una
  columna más, que se ve más corto de lo que pensé» y que el camino corriera en
  profundidad. Queda en **5 × 1** —cinco casillas en columna, salida al sur
  mirando al norte, meta al norte— con **`optimalSteps` = 4**. Eso cuesta **una
  segunda migración**: la 0023 ya estaba aplicada y una migración aplicada no se
  edita.
- **La migración escribe las tres columnas reinterpretadas** (paso 23.1):
  `validation_rules` lleva el `config` del contrato §4.2, `starter_code` el sobre
  §4.3 con el lienzo vacío y `programming_language` la versión del formato,
  `grid-blockly-1`. Iguala además **`xp_reward` a 100 en los nueve niveles**.
- **La lista de niveles de un mundo deja de ser maqueta**: lee las filas de
  `levels`, resuelve el mundo por su uuid contra `worlds` y saca el estado de cada
  nivel del progreso real. Mueren `LEVEL_TITLES` y el
  `studentWorlds.find(...) ?? studentWorlds[0]`, que hacía que **cualquier** uuid
  real cayera en el primer mundo de maqueta.
- **Nace la pantalla de nivel**, en `/dashboard/worlds/:worldId/:levelId`, con el
  juego montado dentro y compuesta como el laboratorio la ensayó en el J6.3.
- **El juego recibe el nivel en vez de traerlo dentro**: `GameScene` deja de
  importar `debugLevel` y se juega con el `config` que baja la pantalla.
- **En la frontera se comprueba, no se traduce** (contrato §4.2 y §7): un `config`
  que no describa un tablero **rechaza el nivel entero**, no lo juega a medias. Es
  el camino que recorren hoy los otros ocho niveles, que siguen sembrados en el
  formato del juego anterior.
- **El encuadre se ajusta a un tablero que no es 5 × 5**: la cámara está cuadrada
  contra la rejilla de pega, y un tablero menor queda minúsculo. La distancia de
  partida, la subida del tablero y el tope del acercamiento pasan a derivarse de
  su tamaño. Entra **que se lea**; vestirlo es el J13.
- **CERO ASSETS, y es del usuario:** «quiero los assets eliminados, 0 assets, y
  las plataformas originales sin assets». Salen los diez `.glb` que la escena
  cargaba y con ellos `Scenery`, `Obstacles`, el `GLTFLoader` y el `Clone` de
  drei. El tablero vuelve a ser geometría. **Los 233 archivos de
  `public/models/` se quedan**, también decidido por él: los hereda el J13.
- **Las casillas pasan a ser cubos y no losas**, igualmente suyo y mirando la
  pantalla: con 0,2 de canto el tablero se lee como una pegatina sobre el fondo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `backend-supabase`: la siembra de un nivel jugable pasa a ser una instancia
  válida del formato del contrato, escrita en las tres columnas reinterpretadas.
- `contenido-mundos`: los niveles de un mundo salen de la base y no de datos de
  ejemplo, y existe la pantalla desde la que se juega uno.
- `juego-3d`: el juego deja de traer su nivel dentro, lo recibe, y rechaza entero
  el que no pueda leer.

## Impact

**Base de datos.** **Dos** migraciones nuevas —`202606030023_seed_level_1_world_1.sql`,
que reescribe la fila entera e iguala `xp_reward`, y `202606030024_level_1_vertical_board.sql`,
que rediseña sólo `validation_rules` cuando el usuario vio el tablero jugándose—,
las dos **de datos y no de esquema**: ninguna columna cambia, así que
`apps/web/src/types/database.types.ts` no se regenera. **Ninguna se aplica hasta
que la sesión revisora haya leído su SQL**: ésa es la parada, y las dos la
pasaron. La 0023 la empujó el usuario; **la 0024 la empujé yo**, con la lectura ya
hecha y después de que él dijera «implementalo» mirando la pantalla —queda
anotado porque el reparto que el proyecto tiene escrito es que ese comando es
suyo—. Una migración aplicada no se edita: por eso el rediseño del tablero es una
segunda migración y no una corrección de la primera.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.ts` | **Nuevo.** La comprobación del `config` en la frontera, pura y sin Blockly ni `three` |
| `apps/web/src/game/levelConfig.test.ts` | **Nuevo.** Los casos del §7: lo válido, lo vacío y lo que no describe un tablero |
| `apps/web/src/game/GameScene.tsx` | `config` llega por propiedades; se va el `import` de `debugLevel`; el encuadre deja de estar atado a un 5 × 5; **fuera todos los modelos** —`Scenery`, `Obstacles`, `useLoader`, `Clone`, `GLTFLoader`— y las casillas pasan a ser cubos |
| `apps/web/src/game/GameSceneLoader.tsx` | Baja el nivel además del programa |
| `apps/web/src/game/BlockEditor.tsx` · `BlockEditorLoader.tsx` | El lienzo arranca con la disposición inicial que traiga el nivel, leída una sola vez |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | El banco de pruebas le pasa su propio nivel —`debugLevel`— y el sobre vacío |
| `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` | **Nuevo.** La pantalla de nivel: lee la fila, abre el sobre, comprueba el `config` y compone el juego |
| `apps/web/src/components/dashboard/student/StudentWorldLevelsModule.tsx` | Deja de inventar diez niveles y de resolver el mundo contra la maqueta |
| `apps/web/src/services/worlds.service.ts` | `mapLevelRow` deja de tirar `narrative`, `starter_code` y `validation_rules`; nace la lectura de un nivel por su id |
| `apps/web/src/types/world.types.ts` | `Level` gana esos tres campos |
| `apps/web/src/constants/routes.ts` | La ruta del nivel |
| `apps/web/src/router/AppRouter.tsx` | La registra |
| `apps/web/src/pages/Dashboard/Dashboard.tsx` | El colapso de `worlds/` deja de tragarse la pantalla nueva |
| `apps/web/src/game/level.ts` · `apps/web/public/models/README.md` | Las menciones a un **J7.4** que ya no existe, reescritas contra lo que hoy es verdad y no sólo renumeradas. La tercera vivía en el comentario de `SCENERY` y se fue con él |
| `apps/web/public/models/README.md` | Además: que **nadie carga estos 233 archivos desde el J7.1** y que están ahí a propósito, para el J13 |

**Documentación.** `docs/CONTEXT.md` §2.7, §2.9, §4.2b y §4.10 —y la lista de
prioridades—, `docs/ROADMAP-JUEGO.md` §3, `docs/ROADMAP.md` (pasos 20 y 23),
`supabase/README.md` y `openspec/config.yaml`.

**Lo que NO entra, y no se empieza:** mandar el intento al servidor (J9), el XP
(J10), los niveles 2 y 3 (J7.2 y J7.3), el aspecto (J13), y los logros y las
misiones, que no son del juego.
