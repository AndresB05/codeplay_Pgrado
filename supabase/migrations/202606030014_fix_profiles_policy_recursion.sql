/*
 * Arregla la recursión que traía la migración 0013. Insertar una solicitud de
 * ingreso moría con 42P17: la política de inserción de `join_requests` consulta
 * `profiles` para comprobar el rol, y `profiles_select_own_students` consulta a
 * su vez `join_requests`. PostgreSQL corta la evaluación en cuanto una política
 * necesita volver a evaluar políticas de su propia tabla.
 *
 * La 0013 se queda como está: ya está aplicada, y corregirla en el sitio dejaría
 * el repositorio describiendo un esquema que ninguna base ha tenido.
 */

/*
 * `security definer` es lo que rompe el ciclo: el cuerpo corre con los
 * privilegios del dueño, así que sus consultas no expanden políticas de nadie.
 * `auth.uid()` va dentro y no es parámetro, de modo que cada quien sólo puede
 * preguntar por sus propios alumnos.
 */
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

revoke execute on function public.is_visible_student_of(uuid) from public;
revoke execute on function public.is_visible_student_of(uuid) from anon;
grant execute on function public.is_visible_student_of(uuid) to authenticated;

/*
 * La política se **reemplaza**, no se añade una segunda: las permisivas se
 * combinan con OR y se evalúan todas, así que dejar viva la anterior mantendría
 * el ciclo. La condición es la misma de la 0013, sólo cambia dónde se evalúa.
 *
 * `profiles_select_own` no se toca: no participa en el ciclo —compara `id` con
 * `auth.uid()` sin consultar ninguna tabla— y es la que sostiene que cada quien
 * lea su propio perfil.
 */
drop policy if exists profiles_select_own_students on public.profiles;

create policy profiles_select_own_students
on public.profiles
for select
to authenticated
using (public.is_visible_student_of(profiles.id));
