## Why

En la prueba preliminar los niños no entendieron que en el mundo 3 (Encrucijada
de las Decisiones) los pasos están contados: el contador «Pasos restantes» está
en pantalla, pero no lo leen porque no parece importante. Hace falta que alguien
se lo diga en el momento justo y de forma que llame la atención: Leo, la mascota.

## What Changes

- La primera vez que una cuenta abre un nivel del mundo 3, la pantalla se
  oscurece y Leo entra desde abajo, con su burbuja, para explicar en tres
  burbujas cortas que los pasos están contados, dónde está el contador y que hay
  que buscar el camino más corto. Se pasa con «Siguiente» y se cierra con
  «¡Entendido!», Escape o tocando fuera.
- Haberlo visto **se guarda por cuenta en Supabase**, no en el navegador: los
  equipos del aula son compartidos y un niño que llega a un equipo donde otro ya
  lo vio tiene que verlo igual.
- Dentro de los niveles del mundo 3 hay un botón para volver a ver a Leo.
- Con «reducir movimiento» activado en el sistema, Leo y su burbuja aparecen sin
  desplazarse.
- El componente recibe el mundo, la imagen y las burbujas por parámetro, pero
  sólo se monta en el mundo 3.
- Usa la ilustración definitiva `apps/web/src/assets/brand/leo-explains.webp`.
  No toca ningún hueco de mascota (`.mascot-slot`, `ImagePlaceholder`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `contenido-mundos`: se añade el requisito de la explicación de Leo al entrar
  por primera vez a un nivel del mundo 3, y el de volver a verla.
- `backend-supabase`: se añade la operación que deja al niño anotar, sólo en su
  propia fila, que ya vio la explicación de un mundo.

## Impact

- **Base de datos:** una migración nueva,
  `supabase/migrations/202606030048_world_intros_seen.sql`: una columna en
  `profiles` y una función `security definer` que sólo alcanza a la fila propia,
  igual que `touch_last_seen` en la 0046. **Necesita `supabase db push`**, que
  lanza el usuario, y después `npx supabase gen types typescript --linked`, que
  también pide credenciales: sin los tipos regenerados `npm run build` no pasa.
- **Código:**
  - `apps/web/src/services/profile.service.ts`: leer y anotar las explicaciones
    vistas.
  - `apps/web/src/components/dashboard/student/WorldIntro.tsx` (nuevo): el
    diálogo de Leo.
  - `apps/web/src/components/dashboard/student/StudentLevelModule.tsx`: lo monta
    en el mundo 3 y añade el botón para repetirlo.
  - `apps/web/src/main.css`: la entrada desde abajo y su versión sin movimiento.
- `apps/web/src/types/database.types.ts`: regenerado por la CLI, nunca a mano.
- Frontera del store de salones: no se toca.
