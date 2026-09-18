## Why

El paso 17 hizo que el panel del tutor cuente progreso real, pero **sólo el que
había cuando se cargó la aplicación**. Medido el 18 de septiembre de 2026, justo
después de que el usuario jugara un nivel con la segunda cuenta del salón:

| Acción | Qué dice el panel |
| --- | --- |
| Ir a Ajustes y volver al panel | «1 de 3 · 9 de 27» — el dato de antes de la partida |
| Recargar la página | «2 de 3 · 10 de 27» |

`ClassroomsProvider` carga una vez por sesión de aplicación y sólo se repone con
los avisos de Realtime de dos tablas —`join_requests` y `class_memberships`— que
no incluyen el progreso.

**La sincronización en vivo se evaluó y se descartó, con la medición hecha.** La
salida evidente era publicar `user_progress` en `supabase_realtime`, como el paso
18 hizo con las tablas de salones. **No habría funcionado**, y se comprobó antes
de escribir la migración: Realtime entrega un cambio exactamente a quien la
política de lectura de esa tabla le deja leer la fila, y la de `user_progress` es
`auth.uid() = user_id`. El tutor no la pasa para las filas de sus alumnos —eso
es justo lo que el paso 17 dejó intacto a propósito, concediendo la lectura por
vista—, así que habría recibido eventos de su propio progreso y de nada más.

La medición, con tres sesiones escuchando a la vez una tabla ya publicada y una
escritura real: recibió el evento **sólo** quien también podía leer la fila por
REST. Las dos columnas coincidieron en los tres casos.

## What Changes

- **El panel se pone al día al abrirse**, y también **cuando la ventana recupera
  el foco**. Es el caso que se encontró: el tutor entra a mirar, o vuelve a la
  pestaña después de que los niños jueguen.
- La recarga usa el **camino silencioso** que estrenó el paso 18: no declara
  espera —el panel se blanquearía en mitad de una lectura— pero sí la apaga.
- **Ninguna migración, ninguna política, ninguna tabla publicada.**

**Por qué no la difusión por disparador, que sí daría tiempo real.**
`realtime.broadcast_changes()` desde un disparador es la salida buena y la que el
roadmap ya propone para el paso 27: llega a quien debe sin tocar políticas, y
además **no reparte el sobre vacío a la clave anónima**, así que resolvería de
paso el coste de privacidad que publicar una tabla añade. Se aplaza porque son
cuatro piezas nuevas —disparador, canal privado, autorización de
`realtime.messages` y cliente— y la prueba preliminar es **un despliegue
prototipo delante de un salón de universitarios**. Lo que compra es que el panel
se mueva solo mientras nadie lo toca; lo que arriesga es estrenar cuatro piezas
sin rodaje delante de usuarios reales.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `store-salones`: hasta ahora el store se reponía sólo cuando la base avisaba.
  Pasa a reponerse además cuando quien mira vuelve a mirar.

## Impact

**Base de datos.** Ninguna. **No necesita `db push` ni `gen types`.**

**Código.**

- `apps/web/src/context/ClassroomsContext.ts` — expone el refresco silencioso,
  que el provider ya tiene y no publicaba.
- `apps/web/src/context/ClassroomsProvider.tsx` — lo pasa al contexto.
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` y
  `teacher/TeacherGroupDetailModule.tsx` — lo piden al montarse.
- La escucha del foco, en un sitio único que las dos pantallas comparten.
- Tests del store y de las dos pantallas.

**Lo que NO cambia:** el store sigue siendo el único que habla con el servicio,
y ningún componente consulta Supabase por su cuenta.
