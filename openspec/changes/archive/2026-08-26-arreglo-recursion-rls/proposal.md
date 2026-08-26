## Why

Un niño **no puede solicitar entrar a ningún salón**. La escritura muere con
`42P17: infinite recursion detected in policy for relation "join_requests"`.
Es el flujo central del módulo de salones, y está roto desde que se aplicó la
migración `202606030013_create_classroom_tables.sql`.

Reproducido dos veces por separado, con sesión real de la cuenta de prueba del
niño, mientras se implementaba `usuarios-de-prueba` (paso 11).

El ciclo lo forman dos piezas de esa migración que funcionan bien por separado:

1. La política de inserción de `join_requests` comprueba el rol del que escribe,
   y para eso consulta `profiles`.
2. `profiles_select_own_students` deja al tutor leer el perfil de sus alumnos, y
   para eso consulta `class_memberships` **y `join_requests`**.

Insertar una solicitud expande las políticas de `profiles`, que vuelven a
expandir las de `join_requests`. PostgreSQL corta la evaluación con 42P17.

**Sólo era observable con una sesión autenticada.** La verificación del paso 9
llegó hasta donde llega una clave anónima —las tablas existen y `anon` no lee
ninguna— y quedó anotado que ninguna política por rol o pertenencia estaba
comprobada. Esta es la primera comprobación que se hizo con sesión real, y salió
a la primera.

## What Changes

- **Migración nueva** `202606030014_fix_profiles_policy_recursion.sql`.
- **Función `is_visible_student_of(uuid)`**, `security definer`, `stable`, con
  `set search_path = public`. Responde si un perfil pertenece a un alumno del
  tutor que llama, sea por pertenencia o por solicitud pendiente. Al ser
  `security definer`, sus consultas internas corren con los privilegios del
  dueño y **no expanden políticas de nadie**: ahí se rompe el ciclo.
- **`revoke execute` a `public` y `anon`, `grant execute` a `authenticated`**.
  PostgreSQL concede `execute` a `PUBLIC` por defecto; es la lección que quedó
  escrita en `supabase/README.md` al terminar el paso 9.
- **`profiles_select_own_students` se recrea** apoyada en esa función, con
  `drop policy if exists` delante. **Quién ve qué no cambia**: la condición es
  la misma, sólo cambia dónde se evalúa.
- `profiles_select_own` sigue sin tocarse.

## Capabilities

### Modified Capabilities

- `backend-supabase`: el requisito «El tutor ve el nombre de los niños de su
  salón» describe un acceso de lectura que hoy, además de concederse, **impide
  escribir en otra tabla**. Se añade que ese acceso no puede interferir con las
  demás operaciones, que es la parte que la implementación incumplía.

`auth-sesion` **no se toca**: esto es esquema, no acceso. El cambio
`usuarios-de-prueba`, que sí lo modifica, queda **en pausa donde está** y se
reanuda desde su tarea 7.3 cuando esta migración esté aplicada.

## Impact

**Base de datos**

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/202606030014_fix_profiles_policy_recursion.sql` | **Nuevo.** La función, sus permisos y la política recreada |
| `supabase/migrations/202606030013_create_classroom_tables.sql` | **No se toca.** Ya está aplicada; corregirla en el sitio dejaría la base y el repositorio contando historias distintas |
| `supabase/README.md` | Entrada 14 |

**Código de la aplicación**

Ninguno. Ni una línea. `apps/web/src/types/database.types.ts` **tampoco se
regenera**: la función nueva no es una RPC que el cliente vaya a llamar, y las
tablas y columnas no cambian.

**Documentación**

- `docs/CONTEXT.md` §2.7 y `docs/ROADMAP.md`: el paso 9 está marcado ✅ y su
  documentación da a entender que las políticas quedaron correctas. Hay que
  anotar que la 0013 salió con esta recursión, que sólo era observable con
  sesión real, y qué la corrigió.
- `docs/ROADMAP.md` §1.3: una comprobación más antes de aprobar un `apply`. El
  análisis de ciclos entre políticas se hace **desde cada operación de
  escritura**, no sólo desde las lecturas.

**Dependencia de Supabase.** Necesita `npx supabase db push`, que pide la
contraseña de la base por consola y **lo lanza el usuario**.

**Fuera de alcance.** Todo lo demás de `usuarios-de-prueba`, que sigue en pausa:
las comprobaciones 7.3 a 7.9, el `grep` sobre `dist/` y su documentación. Y la
comprobación del cupo, que además necesita una tercera cuenta.
