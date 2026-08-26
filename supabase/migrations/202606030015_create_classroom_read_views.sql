/*
 * Dos lecturas que el cliente necesita y que las políticas de la 0013 no
 * conceden: cuántos alumnos tiene cada salón del catálogo, y quiénes son los
 * compañeros del salón propio. `class_memberships_select_related` alcanza la
 * fila del propio niño o la del tutor del salón, y nada más.
 *
 * Se conceden por vista y no ampliando esas políticas. Una política de
 * `class_memberships` que preguntara «¿pertenezco yo a ese salón?» consultaría
 * la tabla que protege y volvería a evaluarse a sí misma: es la misma familia
 * de fallo que dejó a los niños sin poder solicitar entrar hasta la 0014, y
 * aparece antes en la escritura que en la lectura. Aquí ninguna política se
 * toca, así que el grafo verificado de la 0013 queda como está.
 *
 * Ninguna de las dos vistas declara `security_invoker = true`, y es
 * deliberado: su dueño es el rol que aplica la migración, de modo que no
 * aplican la RLS de las tablas que consultan. Por eso el filtro de a quién
 * alcanza cada una va escrito DENTRO de la vista, y es lo primero que hay que
 * leer al revisarlas. El linter de Supabase las marcará como
 * `security_definer_view`; está previsto.
 */

/*
 * El catálogo ya es legible por cualquier autenticado —el niño tiene que
 * encontrar un salón por su ID público antes de pertenecer a él—, así que esta
 * vista no filtra filas: sólo añade el recuento. Lo añade porque sin él el
 * buscador no puede saber si a un salón le queda sitio, y la acción de
 * solicitar ingreso se ofrecería en salones llenos.
 *
 * Si alguna vez se restringe `class_groups_select_authenticated`, esta vista
 * hay que restringirla con ella: al no aplicar RLS, no se enteraría sola.
 */
create or replace view public.class_group_directory as
select
    group_record.id,
    group_record.tutor_id,
    group_record.public_id,
    group_record.name,
    group_record.grade_label,
    group_record.teacher_name,
    group_record.capacity,
    (
        select count(*)
        from public.class_memberships as membership_record
        where membership_record.group_id = group_record.id
    )::integer as member_count
from public.class_groups as group_record;

/*
 * El recuento es un agregado a propósito: revela si un salón está lleno, nunca
 * quién está dentro. Quiénes son sólo sale de `classroom_roster`, que sí
 * filtra.
 */

/*
 * El roster expone cuatro columnas de `profiles` y ninguna más: nombre, avatar,
 * XP y racha. Fuera quedan el correo, el país y el nombre de usuario, que no
 * pinta ninguna pantalla del salón.
 *
 * XP y racha están porque los niños se comparan dentro de su salón, que es la
 * forma acotada del ranking —la alternativa amable al ranking público de
 * menores—. Hoy valen 0 para todos: `total_xp` se incrementa en
 * `upsert_my_progress` y `current_streak` todavía no lo calcula nadie. Exponer
 * las columnas ahora evita volver a migrar la vista cuando esos números
 * empiecen a moverse.
 */
create or replace view public.classroom_roster as
select
    membership_record.group_id,
    membership_record.student_id,
    membership_record.joined_at,
    profile_record.full_name,
    profile_record.avatar_key,
    profile_record.total_xp,
    profile_record.current_streak
from public.class_memberships as membership_record
inner join public.profiles as profile_record
    on profile_record.id = membership_record.student_id
where
    /*
     * Dos ramas, y las dos preguntan por `auth.uid()` sin recibirlo como
     * parámetro: nadie puede consultar el roster de un salón ajeno pasando otro
     * identificador. La segunda consulta `class_memberships` desde una vista
     * sobre `class_memberships`, que aquí es inofensivo justamente porque una
     * vista no expande políticas.
     */
    exists (
        select 1
        from public.class_groups as group_record
        where group_record.id = membership_record.group_id
          and group_record.tutor_id = auth.uid()
    )
    or exists (
        select 1
        from public.class_memberships as viewer_record
        where viewer_record.group_id = membership_record.group_id
          and viewer_record.student_id = auth.uid()
    );

/*
 * `anon` aparte del pseudo-rol `public`, como en la 0013: revocar de `public`
 * no retira lo concedido directamente a un rol. Sin sesión no hay catálogo ni
 * roster que leer.
 */
revoke all on public.class_group_directory from public, anon, authenticated;
revoke all on public.classroom_roster from public, anon, authenticated;

grant select on public.class_group_directory to authenticated;
grant select on public.classroom_roster to authenticated;
