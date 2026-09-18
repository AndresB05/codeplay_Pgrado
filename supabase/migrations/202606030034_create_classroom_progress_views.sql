/*
 * EL PROGRESO DE UN SALÓN, LEÍBLE POR SU TUTOR (paso 17).
 *
 * Hasta aquí el tutor no podía ver ni una fila del progreso de sus alumnos: la
 * política `user_progress_select_own` de la 0009 es `auth.uid() = user_id`, y
 * medido con sesión de tutor el 18-sep-2026, `user_progress` y `level_attempts`
 * devuelven cero filas. Por eso el panel enseñaba ceros: no le faltaba cálculo,
 * le faltaba permiso.
 *
 * Esta migración NO crea ni altera ninguna tabla, ninguna política y ningún
 * `grant` de tabla. Son tres vistas de sólo lectura y sus permisos.
 *
 * Se conceden por vista y no ampliando las políticas, por lo mismo que la 0015:
 * una política de `user_progress` que preguntara «¿tutelo yo a su dueño?»
 * consultaría `class_memberships` y `class_groups`, y esa familia de consulta
 * cruzada es la que cerró el ciclo que dejó a los niños sin poder solicitar
 * entrar hasta la 0014. Aquí ninguna política se toca.
 *
 * NINGUNA DE LAS TRES DECLARA `security_invoker = true`, y es deliberado: su
 * dueño es el rol que aplica la migración, así que no aplican la RLS de las
 * tablas que consultan. Por eso el filtro de a quién alcanza cada una va escrito
 * DENTRO, y es lo primero que hay que leer al revisarlas. El linter de Supabase
 * las marcará como `security_definer_view`; está previsto, igual que con las dos
 * de la 0015.
 *
 * Ese mismo hecho es lo que deja contar los pasos: `count_program_steps` está
 * revocada de `public` y de `anon` por la 0033 y nunca se concedió a
 * `authenticated`, así que sólo se puede invocar desde algo que corra como su
 * dueño.
 *
 * EL ALCANCE NO SE RECORTA POR `joined_at`, y es una decisión del usuario del
 * 18-sep-2026: el tutor ve el historial completo del alumno, incluido lo que
 * jugó antes de entrar al salón. La fecha sigue guardada, así que acotar más
 * tarde no exigirá migrar nada.
 */

/*
 * UNA FILA POR ALUMNO VISIBLE Y NIVEL CON PROGRESO.
 *
 * El conjunto de alumnos visibles se construye hacia adelante —el propio
 * usuario, más los alumnos de los salones que tutela— en vez de recorrer
 * `profiles` preguntando por cada uno. Son dos ramas y las dos preguntan por
 * `auth.uid()` sin recibirlo como parámetro: nadie alcanza el progreso ajeno
 * pasando otro identificador.
 *
 * La pertenencia entra por `left join` y sólo aporta el salón: colgar la
 * proyección de ella dejaría sin ver su propio progreso al niño que todavía no
 * está en ningún salón. El `left join` no multiplica filas porque un alumno
 * pertenece como máximo a un salón, que es invariante del modelo desde la 0013.
 */
create or replace view public.classroom_level_progress as
with visible_students as (
    select auth.uid() as student_id
    where auth.uid() is not null

    union

    select membership_record.student_id
    from public.class_memberships as membership_record
    inner join public.class_groups as group_record
        on group_record.id = membership_record.group_id
    where group_record.tutor_id = auth.uid()
)
select
    progress_record.user_id as student_id,
    membership_record.group_id,
    progress_record.level_id,
    level_record.world_id,
    level_record.title as level_title,
    level_record.sort_order as level_sort_order,
    world_record.title as world_title,
    world_record.sort_order as world_sort_order,
    progress_record.completion_status,
    progress_record.best_score,
    progress_record.attempt_count,
    progress_record.completed_at,
    progress_record.last_attempt_at,
    /*
     * El óptimo es configuración del nivel, no algo que mande quien juega, así
     * que se lee de `validation_rules`. El `case` sobre `jsonb_typeof` es el
     * mismo que usa `submit_level_attempt`: un nivel sin óptimo o con un óptimo
     * que no es número da `null`, y no rompe la consulta.
     */
    case
        when jsonb_typeof(level_record.validation_rules->'optimalSteps') = 'number'
        then (level_record.validation_rules->>'optimalSteps')::integer
    end as optimal_steps
from public.user_progress as progress_record
inner join visible_students
    on visible_students.student_id = progress_record.user_id
inner join public.levels as level_record
    on level_record.id = progress_record.level_id
inner join public.worlds as world_record
    on world_record.id = level_record.world_id
left join public.class_memberships as membership_record
    on membership_record.student_id = progress_record.user_id;

/*
 * UNA FILA POR ALUMNO VISIBLE, RESUMIENDO SU ACTIVIDAD.
 *
 * Se construye SOBRE la vista anterior en vez de repetir su filtro: una vista
 * sobre otra hereda el alcance, y dos copias del mismo `where` se contradicen en
 * cuanto alguien edite una.
 *
 * Existe aparte porque la tabla de seguimiento del salón sólo necesita dos
 * datos por alumno —el mundo y la última actividad—, y la ve también el niño con
 * sus compañeros: sin este resumen, abrir la lista del salón se llevaría el
 * historial entero de todos para pintar dos columnas.
 *
 * `average_best_score` promedia SÓLO lo superado. Contar los niveles empezados y
 * no terminados hundiría la media con ceros que no hablan de eficiencia sino de
 * que la partida no llegó al final.
 */
create or replace view public.classroom_student_activity as
with published_level_counts as (
    select
        level_record.world_id,
        count(*)::integer as published_levels
    from public.levels as level_record
    where level_record.is_published = true
    group by level_record.world_id
),
completed_by_world as (
    select
        progress_record.student_id,
        progress_record.world_id,
        (count(*) filter (where progress_record.completion_status = 'completed'))::integer as completed_levels
    from public.classroom_level_progress as progress_record
    group by progress_record.student_id, progress_record.world_id
),
finished_worlds as (
    select
        completed_by_world.student_id,
        count(*)::integer as completed_worlds
    from completed_by_world
    inner join published_level_counts
        on published_level_counts.world_id = completed_by_world.world_id
    where completed_by_world.completed_levels >= published_level_counts.published_levels
    group by completed_by_world.student_id
),
/*
 * El mundo actual es el del ÚLTIMO nivel intentado, con éxito o sin él:
 * `last_attempt_at` se escribe en cada partida terminada, no sólo en las que
 * superan el nivel. Un alumno atascado sigue estando donde está.
 */
latest_level as (
    select distinct on (progress_record.student_id)
        progress_record.student_id,
        progress_record.world_id as current_world_id,
        progress_record.world_title as current_world_title
    from public.classroom_level_progress as progress_record
    where progress_record.last_attempt_at is not null
    order by progress_record.student_id, progress_record.last_attempt_at desc
),
/*
 * El salón entra en el `group by` y no en un agregado porque `max()` no existe
 * para `uuid`, y porque no hace falta: un alumno pertenece como máximo a uno, así
 * que agrupar por los dos sigue dando una fila por alumno.
 */
totals as (
    select
        progress_record.student_id,
        progress_record.group_id,
        count(*)::integer as attempted_levels,
        (count(*) filter (where progress_record.completion_status = 'completed'))::integer as completed_levels,
        sum(progress_record.attempt_count)::integer as total_attempts,
        round(
            avg(progress_record.best_score) filter (where progress_record.completion_status = 'completed')
        )::integer as average_best_score,
        max(progress_record.last_attempt_at) as last_attempt_at
    from public.classroom_level_progress as progress_record
    group by progress_record.student_id, progress_record.group_id
)
select
    totals.student_id,
    totals.group_id,
    totals.attempted_levels,
    totals.completed_levels,
    coalesce(finished_worlds.completed_worlds, 0) as completed_worlds,
    totals.total_attempts,
    totals.average_best_score,
    totals.last_attempt_at,
    latest_level.current_world_id,
    latest_level.current_world_title
from totals
left join finished_worlds
    on finished_worlds.student_id = totals.student_id
left join latest_level
    on latest_level.student_id = totals.student_id;

/*
 * UNA FILA POR INTENTO DE UN ALUMNO VISIBLE.
 *
 * Repite el conjunto de alumnos visibles porque su granularidad no sale de la
 * vista de progreso: un nivel tiene una fila de progreso y varios intentos.
 *
 * `submitted_code` NO SE EXPONE. El tutor necesita cuántos pasos tuvo cada
 * intento, no el programa que el niño escribió; y exponerlo abriría además la
 * solución de cada nivel a cualquiera que tutele a alguien que lo haya resuelto.
 *
 * LOS PASOS LOS CUENTA EL SERVIDOR, no `metadata`. Ese objeto lo escribe el
 * cliente al mandar la partida y hoy coincide con lo que cuenta el servidor
 * —medido—, pero informar de un número que manda quien juega convertiría el
 * informe del tutor en algo que el niño puede escribir. `count_program_steps`
 * devuelve `null` para un programa que no sabe leer, y eso viaja tal cual: un
 * cero diría que se resolvió sin hacer nada.
 */
create or replace view public.classroom_level_attempts as
with visible_students as (
    select auth.uid() as student_id
    where auth.uid() is not null

    union

    select membership_record.student_id
    from public.class_memberships as membership_record
    inner join public.class_groups as group_record
        on group_record.id = membership_record.group_id
    where group_record.tutor_id = auth.uid()
)
select
    attempt_record.id as attempt_id,
    attempt_record.user_id as student_id,
    membership_record.group_id,
    attempt_record.level_id,
    level_record.world_id,
    attempt_record.is_success,
    attempt_record.score,
    public.count_program_steps(attempt_record.submitted_code) as steps,
    case
        when jsonb_typeof(level_record.validation_rules->'optimalSteps') = 'number'
        then (level_record.validation_rules->>'optimalSteps')::integer
    end as optimal_steps,
    attempt_record.created_at
from public.level_attempts as attempt_record
inner join visible_students
    on visible_students.student_id = attempt_record.user_id
inner join public.levels as level_record
    on level_record.id = attempt_record.level_id
left join public.class_memberships as membership_record
    on membership_record.student_id = attempt_record.user_id;

/*
 * `anon` aparte del pseudo-rol `public`, como en la 0013 y la 0015: revocar de
 * `public` no retira lo concedido directamente a un rol. Sin sesión no hay
 * progreso que leer.
 */
revoke all on public.classroom_level_progress from public, anon, authenticated;
revoke all on public.classroom_student_activity from public, anon, authenticated;
revoke all on public.classroom_level_attempts from public, anon, authenticated;

grant select on public.classroom_level_progress to authenticated;
grant select on public.classroom_student_activity to authenticated;
grant select on public.classroom_level_attempts to authenticated;
