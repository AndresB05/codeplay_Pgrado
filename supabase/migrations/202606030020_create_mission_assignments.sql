/*
 * Asignación de una misión a un salón. Como en la 0013, la tabla, sus políticas
 * y sus grant van en el mismo archivo: el proyecto se creó con RLS automática y
 * sin exposición automática de tablas, así que una tabla sin ellos existe y es
 * inaccesible, y separarlos permitiría aplicar la mitad.
 */

create table if not exists public.mission_assignments (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    /*
     * TEXTO SIN CLAVE AJENA, Y A SABIENDAS. El catálogo de misiones vive hoy en
     * el cliente —cinco entradas en teacher/classroomsData.ts— y no existe
     * ninguna tabla a la que apuntar. Una clave ajena a `levels` sería mentira:
     * las misiones no son ninguno de los nueve niveles sembrados. Es provisional
     * y se cierra cuando el catálogo tenga tabla propia; hasta entonces, el
     * cliente ignora las claves que no reconoce en vez de romper la pantalla.
     */
    mission_key text not null check (length(trim(mission_key)) > 0),
    /*
     * Sin `default auth.uid()`, como `invitations.invited_by`: quien escribe lo
     * manda explícitamente. La política lo exige igual a `auth.uid()`, así que
     * omitirlo responde 42501 y no una fila con el autor equivocado.
     */
    assigned_by uuid not null references auth.users (id) on delete cascade,
    assigned_at timestamptz not null default timezone('utc', now()),
    /*
     * La misma misión en dos salones del mismo tutor es lo normal, no una
     * colisión: la unicidad es del par, nunca de la clave sola.
     */
    constraint mission_assignments_group_mission_unique unique (group_id, mission_key)
);

/*
 * No lleva índice suelto por `group_id`, al contrario que las tablas de la 0013:
 * la restricción única ya crea uno con `group_id` a la cabeza, que es como se
 * consulta esta tabla.
 */

alter table public.mission_assignments enable row level security;

/*
 * Cuelga del salón y no del tutor, y de ahí sale esta política: el niño se liga
 * a un salón por su pertenencia, no a una persona, y su vista no expone quién es
 * su tutor. Colgarla del tutor le obligaría a averiguarlo para leer sus propias
 * misiones.
 */
drop policy if exists mission_assignments_select_related on public.mission_assignments;
create policy mission_assignments_select_related
on public.mission_assignments
for select
to authenticated
using (
    exists (
        select 1
        from public.class_memberships membership_record
        where membership_record.group_id = mission_assignments.group_id
          and membership_record.student_id = auth.uid()
    )
    or exists (
        select 1
        from public.class_groups group_record
        where group_record.id = mission_assignments.group_id
          and group_record.tutor_id = auth.uid()
    )
);

/*
 * No hace falta consultar `profiles` para exigir el rol: ser tutor de un salón
 * ya lo implica, porque `class_groups_insert_own` lo comprobó al crearlo. Es
 * además lo que mantiene el grafo de políticas sin ciclos, porque `class_groups`
 * se lee con `using (true)` y ahí termina el recorrido.
 */
drop policy if exists mission_assignments_insert_by_tutor on public.mission_assignments;
create policy mission_assignments_insert_by_tutor
on public.mission_assignments
for insert
to authenticated
with check (
    assigned_by = auth.uid()
    and exists (
        select 1
        from public.class_groups group_record
        where group_record.id = mission_assignments.group_id
          and group_record.tutor_id = auth.uid()
    )
);

drop policy if exists mission_assignments_delete_by_tutor on public.mission_assignments;
create policy mission_assignments_delete_by_tutor
on public.mission_assignments
for delete
to authenticated
using (
    exists (
        select 1
        from public.class_groups group_record
        where group_record.id = mission_assignments.group_id
          and group_record.tutor_id = auth.uid()
    )
);

revoke all on public.mission_assignments from public;

/*
 * `anon` aparte del pseudo-rol `public`, como la 0013 y al contrario que la
 * 0009: revocar de `public` no retira lo que se haya concedido directamente a un
 * rol.
 */
revoke all on public.mission_assignments from anon;

/*
 * Sin `update`: retirar una misión es borrar la fila, y ningún campo de esta
 * tabla tiene sentido editar. Conceder el permiso ahora sería más difícil de
 * retirar después.
 */
grant select, insert, delete on public.mission_assignments to authenticated;
