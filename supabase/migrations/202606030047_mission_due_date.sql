/*
 * LAS MISIONES PUEDEN TENER FECHA LÍMITE, y al pasar se retiran solas.
 *
 * Lo pidió el usuario el 21-sep-2026: al asignar, el tutor elige el último día
 * para cumplirla —hoy o cualquiera posterior— o la deja sin límite, que es lo
 * que había hasta ahora y lo que queda en las filas que ya existen.
 *
 * `due_date` ES UN DÍA, NO UN INSTANTE, y se lee con el día de Colombia, como la
 * racha (0036): la misión vale hasta el final de ese día. Un `timestamptz`
 * obligaría al tutor a elegir una hora que no le importa.
 *
 * «RETIRARSE SOLA» ES DEJAR DE EXISTIR PARA TODOS, no borrar la fila: nada corre
 * a medianoche para hacerlo. La fila vencida se queda, pero la política de
 * lectura la oculta —al niño y al tutor— y `award_missions` no la mira. Así da
 * igual cuándo se consulte: nunca hay un momento en que siga viva por no haber
 * pasado nadie a limpiarla.
 *
 * REASIGNARLA ES LA SEGUNDA OPORTUNIDAD: `assign_mission_to_groups` le pone la
 * fecha nueva a la fila vencida. Quien ya la cumplió no vuelve a cobrarla,
 * porque `mission_completions` guarda una fila por niño y misión para siempre
 * (0044). Quien no llegó a tiempo pero ya cumple la condición la cobra en ese
 * momento, por la puesta al día que la función ya hacía.
 */

alter table public.mission_assignments
    add column if not exists due_date date;

/*
 * Una sola definición de «sigue vigente», para la política y para las dos
 * funciones: tres copias de la comparación acabarían diciendo cosas distintas.
 * `stable` porque depende de `now()`.
 */
create or replace function public.mission_assignment_is_active(input_due_date date)
returns boolean
language sql
stable
set search_path = public
as $$
    select input_due_date is null
        or input_due_date >= (timezone('America/Bogota', now()))::date;
$$;

revoke all on function public.mission_assignment_is_active(date) from public, anon;

/* La evalúa la política con los permisos de quien lee, así que lo necesita. */
grant execute on function public.mission_assignment_is_active(date) to authenticated;

/*
 * La política de lectura de la 0020, copiada literal, con la vigencia delante.
 * Realtime reparte según esta misma política, así que tampoco anuncia filas
 * vencidas.
 */
drop policy if exists mission_assignments_select_related on public.mission_assignments;

create policy mission_assignments_select_related
on public.mission_assignments
for select
to authenticated
using (
    public.mission_assignment_is_active(due_date)
    and (
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
    )
);

/*
 * GENERADA DESDE EL TEXTO DE LA 0044, no de memoria (CONTEXT.md §2.11). El diff
 * contra ella enseña dos líneas: la vigencia en el bucle y en la elección del
 * salón que se guarda. La firma no cambia, y `create or replace` conserva el
 * `revoke` total que le puso la 0044.
 */
create or replace function public.award_missions(input_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    earned_keys text[] := '{}';
    mission_record record;
    world_order integer;
    flawless_levels integer;
    is_earned boolean;
    granted jsonb;
begin
    for mission_record in
        select distinct assignment.mission_key
        from public.mission_assignments as assignment
        inner join public.class_memberships as membership
            on membership.group_id = assignment.group_id
           and membership.student_id = input_user_id
        where public.mission_assignment_is_active(assignment.due_date)
          and not exists (
            select 1
            from public.mission_completions as done
            where done.user_id = input_user_id
              and done.mission_key = assignment.mission_key
        )
    loop
        is_earned := false;

        /*
         * El orden del mundo sale de la clave, nunca del UUID. El `~` de dígitos
         * evita que una clave futura mal formada reviente la conversión y con
         * ella la partida entera.
         */
        world_order := case
            when split_part(mission_record.mission_key, '_', 1) = 'clear'
             and split_part(mission_record.mission_key, '_', 2) = 'world'
             and split_part(mission_record.mission_key, '_', 3) ~ '^[0-9]+$'
            then split_part(mission_record.mission_key, '_', 3)::integer
        end;

        if world_order is not null then
            /*
             * SUPERAR, NO LA MARCA MÁXIMA: es lo que separa esta misión del
             * logro `perfect_world_N`, que exige los tres al 100.
             *
             * Un mundo sin ningún nivel publicado no cuenta: no se puede
             * terminar lo que no existe, y es la misma regla con la que
             * `award_achievements` lo deja fuera.
             */
            is_earned := exists (
                select 1
                from public.worlds as world_record
                where world_record.sort_order = world_order
                  and world_record.is_published = true
                  and exists (
                      select 1
                      from public.levels
                      where world_id = world_record.id and is_published = true
                  )
                  and not exists (
                      select 1
                      from public.levels as level_record
                      left join public.user_progress as progress_record
                          on progress_record.level_id = level_record.id
                         and progress_record.user_id = input_user_id
                      where level_record.world_id = world_record.id
                        and level_record.is_published = true
                        and coalesce(progress_record.completion_status, 'in_progress') <> 'completed'
                  )
            );

        elsif mission_record.mission_key = 'flawless_3' then
            /* Tres niveles CUALESQUIERA al 100, no los de un mundo concreto. */
            select count(*)
            into flawless_levels
            from public.user_progress as progress_record
            inner join public.levels as level_record
                on level_record.id = progress_record.level_id
               and level_record.is_published = true
            where progress_record.user_id = input_user_id
              and progress_record.best_score >= 100;

            is_earned := flawless_levels >= 3;
        end if;

        if is_earned then
            /* `array_append` y NUNCA `array || 'literal'`: ver CONTEXT.md §2.11. */
            earned_keys := array_append(earned_keys, mission_record.mission_key);
        end if;
    end loop;

    if array_length(earned_keys, 1) is null then
        return '[]'::jsonb;
    end if;

    /*
     * EL SALÓN SE GUARDA, no se deriva después. Es el salón por el que la misión
     * le llegó; con varias asignaciones posibles gana la más antigua, que es la
     * que se la puso primero.
     */
    with inserted as (
        insert into public.mission_completions (user_id, mission_key, group_id, awarded_xp)
        select
            input_user_id,
            catalog.mission_key,
            (
                select assignment.group_id
                from public.mission_assignments as assignment
                inner join public.class_memberships as membership
                    on membership.group_id = assignment.group_id
                   and membership.student_id = input_user_id
                where assignment.mission_key = catalog.mission_key
                  and public.mission_assignment_is_active(assignment.due_date)
                order by assignment.assigned_at
                limit 1
            ),
            catalog.awarded_xp
        from public.mission_catalog as catalog
        where catalog.mission_key = any (earned_keys)
        on conflict (user_id, mission_key) do nothing
        returning mission_key
    )
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'key', catalog.mission_key,
                'title', catalog.title,
                'description', catalog.description,
                'awarded_xp', catalog.awarded_xp
            )
            order by catalog.sort_order
        ),
        '[]'::jsonb
    )
    into granted
    from inserted
    inner join public.mission_catalog as catalog
        on catalog.mission_key = inserted.mission_key;

    /* Lo que las misiones acaban de pagar entra en el total del perfil. */
    update public.profiles
    set total_xp = total_xp + coalesce((
        select sum((element->>'awarded_xp')::integer)
        from jsonb_array_elements(granted) as element
    ), 0)
    where id = input_user_id;

    return granted;
end;
$$;

/*
 * LA FIRMA CAMBIA —gana la fecha—, así que la vieja se borra: dejar las dos haría
 * ambigua para PostgREST una llamada con dos argumentos. El valor por defecto
 * mantiene funcionando el cliente anterior mientras se despliega el nuevo: sin
 * fecha, la misión no vence, que es lo que siempre hizo.
 *
 * GENERADA DESDE EL TEXTO DE LA 0044. El diff contra ella: la firma, el rechazo
 * de fechas pasadas y el `do update` de la inserción.
 */
drop function if exists public.assign_mission_to_groups(uuid[], text);

create or replace function public.assign_mission_to_groups(
    input_group_ids uuid[],
    input_mission_key text,
    input_due_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    assigned_count integer := 0;
    caught_up integer := 0;
    member_id uuid;
    missions_error text;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    /* Sin destino no hay nada que hacer, y no es un error: ver `assignMission`. */
    if input_group_ids is null or array_length(input_group_ids, 1) is null then
        return jsonb_build_object('assigned', 0, 'caught_up', 0, 'missions_error', null);
    end if;

    if not exists (
        select 1 from public.mission_catalog where mission_key = input_mission_key
    ) then
        raise exception 'Unknown mission %', input_mission_key
            using errcode = '23503';
    end if;

    /*
     * Hoy vale: la misión dura hasta el final del día que se elige. Se rechaza
     * aquí y no sólo en el calendario, que la fecha la puede mandar cualquiera.
     */
    if input_due_date is not null
       and input_due_date < (timezone('America/Bogota', now()))::date then
        raise exception 'Due date % is in the past', input_due_date
            using errcode = 'ZC020';
    end if;

    if exists (
        select 1
        from unnest(input_group_ids) as requested(group_id)
        where not exists (
            select 1
            from public.class_groups as group_record
            where group_record.id = requested.group_id
              and group_record.tutor_id = authenticated_user_id
        )
    ) then
        raise exception 'Not the tutor of every requested classroom'
            using errcode = '42501';
    end if;

    /*
     * YA NO ES `do nothing`: la fila de una misión vencida sigue en la tabla
     * —oculta por la política, inerte para `award_missions`—, y reasignarla es
     * ponerle la fecha nueva. Con «Todos» elegido, los salones que ya la tenían
     * también se quedan con la fecha que se acaba de elegir.
     */
    with inserted as (
        insert into public.mission_assignments (group_id, mission_key, assigned_by, due_date)
        select requested.group_id, input_mission_key, authenticated_user_id, input_due_date
        from unnest(input_group_ids) as requested(group_id)
        on conflict (group_id, mission_key) do update
        set due_date = excluded.due_date,
            assigned_by = excluded.assigned_by,
            assigned_at = timezone('utc', now())
        returning 1
    )
    select count(*) into assigned_count from inserted;

    /*
     * BLOQUE APARTE, Y AQUÍ LA SUBTRANSACCIÓN SE QUIERE: si conceder falla, se
     * revierte lo concedido pero NO la asignación, que ya está escrita arriba.
     * Asignar y conceder son dos operaciones y la primera vale por sí sola.
     *
     * `caught_up` se pone a cero en el manejador porque la variable en memoria
     * SOBREVIVE al `rollback` de la subtransacción: dejarla con lo que contó
     * antes de fallar haría que la respuesta mintiera. Es la trampa que la 0040
     * pagó con la racha.
     */
    begin
        for member_id in
            select distinct membership.student_id
            from public.class_memberships as membership
            where membership.group_id = any (input_group_ids)
        loop
            if jsonb_array_length(public.award_missions(member_id)) > 0 then
                caught_up := caught_up + 1;
            end if;
        end loop;
    exception
        when others then
            caught_up := 0;
            missions_error := sqlstate || ' ' || sqlerrm;
    end;

    return jsonb_build_object(
        'assigned', assigned_count,
        'caught_up', caught_up,
        'missions_error', missions_error
    );
end;
$$;

revoke all on function public.assign_mission_to_groups(uuid[], text, date) from public, anon;
grant execute on function public.assign_mission_to_groups(uuid[], text, date) to authenticated;
