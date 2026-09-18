## Why

El paso 17 metió la ficha del explorador en el panel del tutor, y con eso
«seleccionar a un alumno y ver su avance» ya ocurre en dos clics. Lo que no
ocurre es ver **lo que le falta**, y eso no es un hueco de navegación sino de
dato.

`classroom_level_progress` sale de `user_progress`, así que **un nivel que el
alumno nunca empezó no tiene fila y no aparece en ninguna parte**. Medido el 18
de septiembre de 2026 contra la base real, con la cuenta de tutor de `.env`
(salón «salon pinpon», catálogo de 3 mundos × 3 niveles = 9):

| Explorador | Filas de progreso | Qué tiene |
| --- | --- | --- |
| six seven | 9 de 9 | todo superado, 29 partidas |
| Axoluk | 2 de 9 | Selva N1 y Costa N1, superados a la primera |
| Invitada Prueba | 0 | nunca ha jugado |

Y lo que la pantalla le dice hoy al tutor sobre Axoluk, comprobado en el
navegador con esa misma cuenta:

> Axoluk — **2 superados de 2 empezados** · 2 partidas · última actividad hace un
> momento

Dos filas, y **Cordillera Binaria no aparece**. El denominador de la ficha es lo
empezado, no el catálogo: la frase es cierta y no informa. El tutor no puede
distinguir a quien va por la mitad de quien va completo, que es justo lo que
viene a mirar.

Del catálogo, hoy sólo se trae `getCatalogSize()`, que devuelve **recuentos y no
la lista**. Sin la lista no hay forma de nombrar los siete niveles que faltan.

**Segundo hecho medido:** el explorador elegido vive en `useState`. Recargar
`/teacher/panel` lo pierde, y no hay forma de pasarle a nadie un enlace a la
ficha de un alumno.

## What Changes

- **La ficha del explorador enseña el catálogo completo, agrupado por mundo.**
  Cada mundo con su cabecera y su contador —«Cordillera Binaria · 0 de 3»— y
  debajo sus niveles, jugados y sin jugar. El que no se ha tocado sale en fila
  apagada, con «Sin empezar» donde iría la marca. La ficha de Axoluk pasa de 2
  filas a 9, tres de ellas bajo un mundo que no ha pisado.
- **La cabecera de la ficha cuenta sobre el catálogo**, no sobre lo empezado: «2
  de 9 niveles superados · 0 de 3 mundos terminados».
- **El alcance y el explorador elegidos pasan a la dirección**:
  `/teacher/panel/:groupId/:studentId`, con `all` en el tramo de salón cuando el
  alcance es «Todos». Recargar conserva la ficha y el enlace se puede compartir
  con quien ya podía verla.
- **El servicio se trae el catálogo, no su tamaño.** `getCatalogSize()` se
  sustituye por `getCatalog()`, que devuelve los mundos publicados con sus
  niveles publicados y en orden; los dos recuentos que el panel ya usaba salen
  de contar esa lista, así que el denominador del resumen no cambia de valor.
- **Ninguna migración.** Las tres vistas de la `0034` y la `0035` se quedan como
  están: lo que falta no está en el servidor, está en no haber pedido el
  catálogo.

**Lo que NO entra:** rachas y logros, que son el paso 22. Y el candado de
niveles, que sigue decidido para después de la prueba preliminar (§4.11): esta
ficha **describe** el avance, no lo ordena.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `salones-tutor`: la ficha del explorador pasa de enseñar lo jugado a enseñar
  el catálogo entero con lo jugado encima, y el alumno elegido pasa a vivir en
  la dirección.

## Impact

**Base de datos.** Ninguna. **No necesita `db push` ni `gen types`.**

**Código.**

- `apps/web/src/services/studentProgress.service.ts` — `getCatalog()` en lugar
  de `getCatalogSize()`: dos lecturas en paralelo, `worlds` y `levels`,
  publicadas y ordenadas.
- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — la función
  pura que cruza catálogo y progreso, y el recuento por mundo.
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — la ficha
  agrupada por mundo, y el alcance y el explorador leídos de la dirección.
- `apps/web/src/pages/TeacherDashboard/TeacherDashboard.tsx` y
  `apps/web/src/router/AppRouter.tsx` — la ruta con alumno.
- Tests de las tres piezas.

**Lo que NO cambia:** las vistas del servidor, el filtro que llevan dentro, y
que el detalle nivel a nivel lo vea sólo el tutor. La tabla de seguimiento del
salón sigue con sus dos columnas y su vista de resumen.
