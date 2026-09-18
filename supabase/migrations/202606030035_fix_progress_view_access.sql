/*
 * DOS ARREGLOS DE LA 0034, encontrados al medirla.
 *
 * Esta migración no crea ni altera ninguna tabla, ninguna política y ningún
 * `grant` de tabla.
 *
 *
 * 1. CONTAR PASOS DESDE UNA VISTA.
 *
 * La 0034 llama a `count_program_steps` desde `classroom_level_attempts` dando
 * por hecho que una vista sin `security_invoker` ejecutaría la función como su
 * dueño. NO ES ASÍ, y está medido: pedir la columna `steps` respondía `42501`
 * —«permission denied for function count_program_steps»— a cualquiera, tutor o
 * niño, mientras que pedir cualquier otra columna de la misma vista respondía
 * 200.
 *
 * La distinción que faltaba: una vista así SÍ sortea la RLS y los permisos de
 * las TABLAS que consulta, porque ésos se comprueban contra su dueño; el
 * `execute` de una FUNCIÓN se comprueba contra quien lanza la consulta. La 0033
 * revocó las dos funciones de conteo de `public` y de `anon` y nunca se las
 * concedió a `authenticated`, porque hasta la 0034 nadie las llamaba desde
 * fuera de `submit_level_attempt`, que es `security definer` y por eso no lo
 * notaba.
 *
 * SE CONCEDE EL `EXECUTE` EN VEZ DE HACERLAS `SECURITY DEFINER`, y el motivo es
 * que no hay nada que proteger: las dos reciben un texto y devuelven un número,
 * sin leer ni escribir ninguna tabla. El cliente ya calcula lo mismo en
 * JavaScript —`readOrder`, que aquel SQL replica orden por orden a propósito—,
 * así que conceder el cálculo no entrega nada que quien juega no tenga ya.
 * Elevar privilegios para algo que no los necesita habría sido lo caro.
 *
 * Las dos, no sólo la de fuera: `count_program_steps` no es `security definer`,
 * así que llama a `count_block_chain` con los permisos de quien la invocó.
 * Conceder sólo la primera dejaría el mismo `42501` una llamada más adentro.
 *
 * `anon` sigue fuera. Las tres vistas de la 0034 ya le están revocadas, y sin
 * sesión no hay ningún intento que contar.
 */

grant execute on function public.count_block_chain(jsonb, boolean) to authenticated;
grant execute on function public.count_program_steps(text) to authenticated;

/*
 * 2. EL RESUMEN SE VE ENTRE COMPAÑEROS DE SALÓN; EL DETALLE, NO.
 *
 * Decisión del usuario del 18-sep-2026, y sigue el precedente de la 0015: el
 * roster ya expone el XP y la racha de un niño a sus compañeros, «la forma
 * acotada del ranking». El mundo en el que anda y cuándo jugó por última vez
 * son del mismo orden, y la alternativa dejaba dos columnas vacías al lado de un
 * XP que sí se ve.
 *
 * Lo que NO se ensancha es el detalle: `classroom_level_progress` y
 * `classroom_level_attempts` se quedan con el filtro estrecho de la 0034 —el
 * propio alumno, o el tutor de su salón—, porque nivel a nivel e intento a
 * intento es el material del informe del profesor, no del ranking del recreo.
 *
 * Por eso esta vista deja de construirse SOBRE la de progreso y pasa a consultar
 * `user_progress` con su propio alcance. Es el precio de que las dos tengan
 * filtros distintos: heredarlo era lo que evitaba dos copias del mismo `where`,
 * y ya no es el mismo.
 */
create or replace view public.classroom_student_activity as
with visible_students as (
    select auth.uid() as student_id
    where auth.uid() is not null

    union

    select membership_record.student_id
    from public.class_memberships as membership_record
    inner join public.class_groups as group_record
        on group_record.id = membership_record.group_id
    where group_record.tutor_id = auth.uid()

    union

    /*
     * Los compañeros del salón propio, con el mismo patrón que la segunda rama
     * de `classroom_roster`: se pregunta por `auth.uid()` sin recibirlo como
     * parámetro, y consultar `class_memberships` desde una vista sobre
     * `class_memberships` es inofensivo porque una vista no expande políticas.
     */
    select membership_record.student_id
    from public.class_memberships as membership_record
    where membership_record.group_id in (
        select viewer_record.group_id
        from public.class_memberships as viewer_record
        where viewer_record.student_id = auth.uid()
    )
),
visible_progress as (
    select
        progress_record.user_id as student_id,
        membership_record.group_id,
        level_record.world_id,
        world_record.title as world_title,
        progress_record.completion_status,
        progress_record.best_score,
        progress_record.attempt_count,
        progress_record.last_attempt_at
    from public.user_progress as progress_record
    inner join visible_students
        on visible_students.student_id = progress_record.user_id
    inner join public.levels as level_record
        on level_record.id = progress_record.level_id
    inner join public.worlds as world_record
        on world_record.id = level_record.world_id
    left join public.class_memberships as membership_record
        on membership_record.student_id = progress_record.user_id
),
published_level_counts as (
    select
        level_record.world_id,
        count(*)::integer as published_levels
    from public.levels as level_record
    where level_record.is_published = true
    group by level_record.world_id
),
completed_by_world as (
    select
        visible_progress.student_id,
        visible_progress.world_id,
        (count(*) filter (where visible_progress.completion_status = 'completed'))::integer as completed_levels
    from visible_progress
    group by visible_progress.student_id, visible_progress.world_id
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
latest_level as (
    select distinct on (visible_progress.student_id)
        visible_progress.student_id,
        visible_progress.world_id as current_world_id,
        visible_progress.world_title as current_world_title
    from visible_progress
    where visible_progress.last_attempt_at is not null
    order by visible_progress.student_id, visible_progress.last_attempt_at desc
),
totals as (
    select
        visible_progress.student_id,
        visible_progress.group_id,
        count(*)::integer as attempted_levels,
        (count(*) filter (where visible_progress.completion_status = 'completed'))::integer as completed_levels,
        sum(visible_progress.attempt_count)::integer as total_attempts,
        round(
            avg(visible_progress.best_score) filter (where visible_progress.completion_status = 'completed')
        )::integer as average_best_score,
        max(visible_progress.last_attempt_at) as last_attempt_at
    from visible_progress
    group by visible_progress.student_id, visible_progress.group_id
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
