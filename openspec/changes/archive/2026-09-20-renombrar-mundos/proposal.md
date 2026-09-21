## Why

Los tres mundos se llaman hoy **«Selva Algorítmica», «Cordillera Binaria» y
«Costa de Bugs»**, y la landing anterior al login anuncia **otros tres**: «La
Selva de las Secuencias», «El Espacio de los Bucles» y «El Océano Condicional».
Son **dos problemas distintos y conviene no mezclarlos**:

1. **La plataforma se contradice consigo misma.** Quien llega por la landing lee
   tres nombres y al entrar encuentra otros tres. Ninguno de los dos juegos de
   nombres remite al otro.
2. **Cinco de esos seis nombres prometen lo que el juego no tiene.** Los cuatro
   bloques —avanzar, dos giros y saltar— no permiten bucles, condicionales,
   funciones, estructuras de datos ni depuración. «El Espacio de los Bucles», «El
   Océano Condicional», «Cordillera Binaria» y «Costa de Bugs» mienten, y las
   **descripciones de mundo de la base mienten igual**: «secuencias, condiciones
   y bucles», «funciones y estructuras de datos», «Depura código». Es la misma
   frontera por la que el paso 17 retiró las barras de habilidades y por la que
   el paso 22 dejó esas ideas fuera del catálogo de logros.

Decisión del usuario del 20-sep-2026: los nombres nuevos apuntan a **los pilares
del pensamiento computacional** en lugar de a la naturaleza colombiana.

## What Changes

- **Los tres mundos se renombran** en `worlds`, por migración:

  | Orden | Antes | Ahora |
  | --- | --- | --- |
  | 1 | Selva Algorítmica | **Sendero de los Patrones** |
  | 2 | Cordillera Binaria | **Cordillera de la Abstracción** |
  | 3 | Costa de Bugs | **Encrucijada de las Decisiones** |

- **Las tres descripciones se reescriben** para decir lo que cada mundo pide de
  verdad: ordenar pasos y reconocer el patrón; partir el camino y subirlo por
  tramos; comparar rutas y elegir la que cabe en los pasos disponibles.
- **`region_label` pasa a nombrar el pilar** en lugar de la región colombiana —
  «Algoritmos y patrones», «Descomposición y abstracción», «Evaluación de
  problemas», que es lo que `DISENO-DEL-JUEGO.md` §2 fija para cada mundo—. Es el
  rótulo que la pantalla de niveles pinta bajo «Selecciona un nivel».
- **Los `slug` se renombran con ellos.** No los consume ningún código —
  `worlds.service.ts` los mapea y nadie los lee—, y dejar `costa-de-bugs`
  apuntando a «Encrucijada de las Decisiones» convierte cualquier consulta de
  depuración en un acertijo.
- **El catálogo de logros se pone al día en la misma migración.** Los tres
  `perfect_world_N` llevan el nombre del mundo **escrito a mano** en su título y
  dentro de su descripción, así que renombrar un mundo **no los actualiza solo**:
  pasan a «Dueño del Sendero», «Dueño de la Cordillera» y «Dueño de la
  Encrucijada».
- **Lo ya concedido en `achievements` se queda con el nombre viejo, a
  propósito.** Es la regla que el paso 22 fijó y que la propia tabla sostiene
  copiando título y descripción al conceder: quien lo ganó sigue viendo el nombre
  con el que lo ganó.
- **La landing deja de anunciar tres nombres inventados** y anuncia los tres
  reales, con descripciones que describen la mecánica que el niño se va a
  encontrar.
- Los **nueve títulos de nivel NO cambian**: salieron del puzle y lo describen.
  Por eso los nueve `perfect_wN_lM` del catálogo tampoco se tocan.
- **Ninguna clave se rompe.** `perfect_wN_lM` y `perfect_world_N` se derivan del
  `sort_order`, no del nombre, y el `sort_order` no cambia.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `contenido-mundos`: se añade el requisito de que el nombre y la descripción de
  un mundo digan lo que ese mundo enseña de verdad y sean **los mismos en toda la
  plataforma**, landing incluida.
- `logros-y-rachas`: el requisito del catálogo gana que **renombrar contenido no
  actualiza el catálogo solo** —hace falta ponerlo al día—, y que lo ya concedido
  conserva el nombre viejo también cuando lo renombrado es el mundo y no el
  logro.

## Impact

**Base de datos — necesita `db push`, que lanza el usuario.** Una migración
nueva, `202606030043_rename_worlds.sql`: `update` sobre `public.worlds` (slug,
título, descripción y `region_label` de las tres filas) y `update` sobre
`public.achievement_catalog` (título y descripción de `perfect_world_1`,
`perfect_world_2` y `perfect_world_3`). **No toca `public.achievements`.**

**Código de la aplicación:**

- `apps/web/src/components/home/WorldsSection.tsx` — los tres nombres y las tres
  descripciones de la landing.

**Tests cuyas fixturas nombran los mundos viejos:**

- `apps/web/src/components/dashboard/teacher/classroomsData.test.ts`
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.test.tsx`
- `apps/web/src/services/studentProgress.service.test.ts`

**No se toca:**

- `apps/web/src/types/database.types.ts` — ninguna columna cambia, así que no hay
  nada que regenerar.
- `apps/web/src/components/dashboard/student/worlds/worldsData.ts` — sus tres
  mundos («Bosque de Bucles», «Volcán de Variables», «Océano de Objetos») son el
  repliegue de maqueta y **también prometen lo que el juego no tiene**, pero son
  mundos inventados distintos de éstos y su suerte es la del `ROADMAP.md` §3.3.
  Queda anotado, no arreglado de paso.
