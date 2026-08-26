## Context

Ver `proposal.md` — Why. Lo que hace falta saber para entender el arreglo:

- **PostgreSQL corta la recursión entre políticas, no la resuelve.** Cuando
  evaluar la política de una tabla exige volver a evaluar políticas de esa misma
  tabla, la operación entera aborta con 42P17. No hay un límite de profundidad
  que se pueda subir ni una forma de «desactivarlo para esta consulta».
- **El ciclo es `join_requests` → `profiles` → `join_requests`.** Sólo falla la
  **inserción** en `join_requests`. Comprobado con sesión real del niño: los
  `select` sobre `profiles`, `class_groups`, `class_memberships` y
  `join_requests` funcionan los cuatro, y el `insert` en `class_memberships` se
  deniega como debe (`42501`, sin permiso). El daño está acotado a esa escritura.
- **`security definer` rompe el ciclo porque cambia quién evalúa.** El cuerpo de
  una función así corre con los privilegios de su dueño, que no está sujeto a
  RLS sobre esas tablas, de modo que sus consultas internas **no expanden
  políticas**. La cadena termina en la función.

### Cómo se coló, para no repetirlo

El design del paso 9 afirma que la cadena «termina y ninguna política se consulta
a sí misma». El razonamiento se hizo **desde la lectura de `profiles`**:
`profiles` → `class_memberships` → `class_groups`, cuya política de lectura es
`using (true)` y no consulta nada. Por ahí, en efecto, termina.

Lo que nadie recorrió fue el camino inverso: **desde la escritura de
`join_requests`**, que es donde se cierra el círculo. Y la política de `profiles`
consulta dos tablas, no una; la rama de `class_memberships` se verificó y la de
`join_requests`, tres líneas más abajo en la misma política, no.

Lo revisaron dos sesiones y las dos miraron el grafo en la misma dirección. De
ahí la comprobación que este cambio añade a `docs/ROADMAP.md` §1.3: el análisis
de ciclos se hace **desde cada operación de escritura**, no sólo desde las
lecturas.

## Goals / Non-Goals

**Goals:**

- Que un niño pueda solicitar entrar a un salón.
- Que el tutor siga viendo **el nombre** de sus alumnos y de quien le solicita
  entrada. Es el propósito entero de la política que se toca.
- Que no se vuelva visible ningún perfil que hoy no lo sea.
- Que el registro del proyecto deje de dar a entender que el paso 9 quedó limpio.

**Non-Goals:**

- Revisar el resto de las políticas del paso 9. Las que se verifican aquí son
  las del ciclo y sus vecinas inmediatas; el barrido completo es de
  `usuarios-de-prueba`, que sigue en pausa.
- Tocar `usuarios-de-prueba`: ni sus artefactos, ni sus tareas, ni los dos
  salones de prueba que dejó creados. Hacen falta al reanudar.

## Decisions

### 1. Una migración nueva, no editar la 0013

La 0013 ya está aplicada contra la base real. Corregirla en el sitio dejaría el
repositorio describiendo un esquema que ninguna base ha tenido nunca: quien
clonara y ejecutara las migraciones desde cero obtendría algo distinto de lo que
hay en producción, y el fallo desaparecería del registro como si no hubiera
ocurrido. Se añade la 0014 y la 0013 se queda como está, con su recursión
incluida, que es lo que de verdad pasó.

### 2. La condición no cambia, sólo dónde se evalúa

`is_visible_student_of(profile_id)` contiene exactamente los dos `exists` que hoy
están en el `using` de la política: pertenencia a un salón del tutor que llama, o
solicitud **pendiente** en uno de ellos. No se amplía ni se recorta el alcance.

```sql
create or replace function public.is_visible_student_of(profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.class_memberships membership_record
        join public.class_groups group_record
          on group_record.id = membership_record.group_id
        where membership_record.student_id = profile_id
          and group_record.tutor_id = auth.uid()
    ) or exists (
        select 1
        from public.join_requests request_record
        join public.class_groups group_record
          on group_record.id = request_record.group_id
        where request_record.student_id = profile_id
          and request_record.status = 'pending'
          and group_record.tutor_id = auth.uid()
    );
$$;
```

`stable` porque no escribe y su resultado no cambia dentro de una misma
sentencia; eso permite al planificador no reevaluarla fila a fila.
`set search_path = public` por lo mismo que las RPC existentes: una función
`security definer` sin `search_path` fijo es una puerta abierta.

### 3. `revoke execute` antes del `grant`

PostgreSQL concede `execute` a `PUBLIC` por defecto, así que una función nueva
nace ejecutable por cualquiera, `anon` incluido. Es la lección que quedó escrita
en `supabase/README.md` al terminar el paso 9, y el borrador de esta función se
había escrito sin ella.

Que `anon` pudiera llamarla no filtraría nada —sin sesión, `auth.uid()` es nulo y
los dos `exists` salen falsos— pero conceder por omisión es exactamente lo que
esa lección dice que no se haga.

### 4. Recrear la política, no crear una segunda

Aquí sí se reemplaza, al revés que en el paso 9. Allí se **añadió**
`profiles_select_own_students` junto a `profiles_select_own` porque eran accesos
distintos y sumarlos no quitaba nada a nadie. Aquí la política nueva es la misma
condición reescrita: dejar viva la anterior mantendría el ciclo, porque las
políticas permisivas se combinan con OR y todas se evalúan.

`drop policy if exists` delante, como el resto de la migración 0013, para que
sea reejecutable.

### 5. `profiles_select_own` sigue intacta

No participa en el ciclo —compara `id` con `auth.uid()` y no consulta ninguna
tabla— y es la que sostiene que cada quien lea su propio perfil. Ni se toca ni se
menciona en la migración salvo para no tocarla.

## Risks / Trade-offs

**Un `security definer` en una política es una excepción a la regla de que RLS lo
gobierne todo.** → Acotada: la función responde `true`/`false` sobre una relación
que ya era pública para el tutor, y no devuelve datos. Cualquiera puede llamarla,
pero sólo obtiene respuestas sobre **sus propios** alumnos, porque `auth.uid()`
está dentro del cuerpo y no es un parámetro.

**El arreglo podría cortar el ciclo y de paso dejar al tutor sin ver nombres**, y
eso pasaría desapercibido si sólo se comprueba que la inserción ya funciona. → Es
la mitad (b) de la verificación, y no es opcional: con el tutor autenticado hay
que leer el **nombre** del niño que solicitó entrar. Un arreglo que devuelva
identificadores sueltos no es un arreglo.

**Podría haber más ciclos que este no cubre.** → Se recorren los otros caminos
que consultan `profiles` desde una política —crear salón como tutor, y el
`select` de perfiles con cada sesión—, pero el barrido completo de las políticas
del paso 9 sigue siendo de `usuarios-de-prueba`. Lo que este cambio no verifique
se queda escrito como no verificado.

## Migration Plan

1. Escribir `supabase/migrations/202606030014_fix_profiles_policy_recursion.sql`.
2. **Pausa.** `npx supabase db push` lo lanza el usuario.
3. Verificar las dos mitades con las sesiones reales que ya existen:
   **(a)** el niño inserta una solicitud y pasa; **(b)** el tutor ve el nombre
   del que solicita y el de sus alumnos, y ningún perfil ajeno se ha vuelto
   visible —con la sesión del niño, `profiles` sigue devolviendo una sola fila—.
4. Recorrer los demás caminos que consultan `profiles` desde una política.
5. Documentar y cerrar.

**Vuelta atrás.** Una migración que recree la política con los dos `exists` en
línea y borre la función. Volvería el fallo, así que sólo tiene sentido si el
arreglo resultara peor que el problema.

## Open Questions

Ninguna.
