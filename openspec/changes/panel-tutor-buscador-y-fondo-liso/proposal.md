## Why

El usuario probó el panel del tutor tras `panel-tutor-conectados-y-filtros` y le
quedan dos molestias. Para abrir la ficha de un explorador hay que encontrarlo
entre botones en fila: en su salón real son 26 nombres largos, seis filas, y
buscar uno es lento. Y las pantallas del tutor llevan el fondo ilustrado de la
selva, que en una pantalla de trabajo para adultos sobra.

## What Changes

- **Buscador de explorador** en el panel del tutor: se escribe parte del nombre
  —sin mayúsculas ni tildes, con la misma regla que los filtros de las tablas— y
  la lista se acota a una caja de unas tres filas que se desplaza. El elegido se
  ve siempre y la dirección del panel sigue llevándolo.
- **Fondo liso para el tutor**: fuera la ilustración del valle y la trama de
  lunares en las pantallas del tutor; queda el lavanda del tema. El niño no
  cambia.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `salones-tutor`: el explorador del seguimiento se busca por nombre.
- `sistema-visual`: las pantallas del tutor van sobre fondo liso.

## Impact

- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — el
  selector pasa a un componente nuevo, `teacher/StudentPicker.tsx`.
- `apps/web/src/components/dashboard/shared/rosterFilters.ts` — se exporta la
  comparación de nombres para reutilizarla.
- `apps/web/src/pages/TeacherDashboard/TeacherDashboard.tsx` — sin
  `jungle-surface` ni `<PanelBackdrop />`.
- `docs/ESTADO-DEL-PROYECTO.md` §2.1 — el fondo de la aplicación ya no es el
  mismo para los dos roles.
- **No toca Supabase:** ni esquema ni datos, no hace falta `db push`.
