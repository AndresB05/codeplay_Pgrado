/*
 * ARREGLA `submit_level_attempt`, QUE LA 0036 DEJO ROTA. Sin esto NINGUNA
 * PARTIDA SE PUEDE GUARDAR: la llamada responde 42883 y el nino pierde lo que
 * acaba de jugar.
 *
 * Dos errores, los dos por reescribir de memoria una funcion que ya existia en
 * vez de partir de su texto:
 *
 *   1. `count_program_steps(input_submitted_code::jsonb)`. Esa funcion recibe
 *      TEXT y es ella quien hace el `cast` por dentro, capturando el 22P02 de
 *      las filas guardadas que no son JSON. Con el `::jsonb` de fuera no habia
 *      ninguna sobrecarga que encajara y la llamada entera fallaba.
 *   2. La escritura del intento dejo de pasar por `create_level_attempt` y paso
 *      a ser un `insert` a pelo, que se salta el acotado de la puntuacion a
 *      0..100 que aquella funcion hace. Hoy no cambiaba ningun numero porque
 *      `score_for_steps` ya acota, pero era una segunda verdad sobre como se
 *      escribe un intento.
 *
 * ESTA MIGRACION SE GENERO DESDE EL TEXTO DE LA 0033, no a mano: se tomo su
 * `submit_level_attempt` y se le insertaron solo el bloque de racha y logros,
 * las dos claves de la respuesta y la llamada a `upsert_my_progress` sin el
 * parametro de estrellas que la 0036 retiro. Comparada linea a linea con el
 * original, esas son las unicas diferencias.
 *
 * La leccion, para que no se repita: una funcion que ya existe se REESCRIBE
 * PARTIENDO DE SU TEXTO y se compara con el original antes de aplicar. Las dos
 * diferencias de arriba estaban a la vista en un diff de treinta lineas.
 */

create or replace function public.submit_level_attempt(
    input_level_id uuid,
    input_submitted_code text,
    input_is_success boolean default false,
    input_runtime_ms integer default null,
    input_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    level_row public.levels;
    optimal_steps integer;
    counted_steps integer;
    attempt_score integer;
    created_attempt public.level_attempts;
    previous_best integer;
    saved_progress public.user_progress;
    awarded_xp integer;
    current_total_xp integer;
    streak_profile public.profiles;
    unlocked jsonb := '[]'::jsonb;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    select *
    into level_row
    from public.levels
    where id = input_level_id
      and is_published = true;

    if not found then
        raise exception 'Level not found or unavailable'
            using errcode = 'P0002';
    end if;

    optimal_steps := case
        when jsonb_typeof(level_row.validation_rules->'optimalSteps') = 'number'
        then (level_row.validation_rules->>'optimalSteps')::integer
    end;

    counted_steps := public.count_program_steps(input_submitted_code);

    /*
     * SÓLO PUNTÚAN LOS INTENTOS CON ÉXITO. Con la regla vieja eso lo garantizaba
     * la transición a completado; al pasar la concesión a la marca hay que
     * decirlo aquí, o un programa eficiente que no llega a la meta cobraría XP
     * — y en el mundo 3, donde quedarse sin pasos es lo normal, sería lo
     * habitual.
     */
    attempt_score := case
        when coalesce(input_is_success, false)
        then public.score_for_steps(counted_steps, optimal_steps)
        else 0
    end;

    created_attempt := public.create_level_attempt(
        input_level_id,
        input_submitted_code,
        input_is_success,
        attempt_score,
        input_runtime_ms,
        input_metadata
    );

    /*
     * LA MARCA ANTERIOR SE LEE CON EL CERROJO PUESTO, y no por cautela: el XP
     * que esta función DICE haber concedido tiene que ser el que
     * `upsert_my_progress` concedió de verdad, y aquélla calcula su diferencia
     * contra la fila que bloquea. Leyendo sin `for update`, dos partidas a la
     * vez —que es lo que `React.StrictMode` provoca en desarrollo— podrían
     * colarse entre la lectura y el cerrojo y hacer que el número que la
     * pantalla enseña no sea el que la base sumó.
     *
     * Sin fila todavía no hay nada que bloquear, y la marca anterior es cero;
     * dos inserciones simultáneas las separa `user_progress_user_level_unique`.
     */
    select best_score
    into previous_best
    from public.user_progress
    where user_id = authenticated_user_id
      and level_id = input_level_id
    for update;

    if not found then
        previous_best := 0;
    end if;

    saved_progress := public.upsert_my_progress(
        input_level_id,
        case when coalesce(input_is_success, false) then 'completed' else 'in_progress' end,
        attempt_score
    );

    awarded_xp := round(
        greatest(saved_progress.best_score - previous_best, 0)::numeric
        * level_row.xp_reward / 100.0
    )::integer;

    /*
     * DE AQUI ABAJO, NADA PUEDE LLEVARSE POR DELANTE LO YA ESCRITO. El intento y
     * el progreso estan guardados cuando se llega aqui, asi que cualquier fallo
     * concediendo se traga: perder el nivel que el nino acaba de superar es
     * mucho peor que perder un logro, que se volvera a conceder en la siguiente
     * partida porque las condiciones se miran contra el historial.
     */
    begin
        if coalesce(input_is_success, false) then
            streak_profile := public.touch_streak(authenticated_user_id);
        else
            select *
            into streak_profile
            from public.profiles
            where id = authenticated_user_id;
        end if;

        unlocked := public.award_achievements(
            authenticated_user_id,
            input_level_id,
            input_submitted_code,
            coalesce(input_is_success, false),
            coalesce(input_metadata, '{}'::jsonb),
            coalesce(streak_profile.current_streak, 0)
        );
    exception
        when others then
            unlocked := '[]'::jsonb;
    end;

    /* DESPUES de conceder, para que incluya lo que los logros acaban de pagar. */
    select total_xp
    into current_total_xp
    from public.profiles
    where id = authenticated_user_id;

    return jsonb_build_object(
        'attempt_id', created_attempt.id,
        'score', attempt_score,
        'steps', counted_steps,
        'best_score', saved_progress.best_score,
        'completion_status', saved_progress.completion_status,
        'attempt_count', saved_progress.attempt_count,
        'awarded_xp', awarded_xp,
        'total_xp', current_total_xp,
        'unlocked_achievements', unlocked,
        'streak', jsonb_build_object(
            'current', coalesce(streak_profile.current_streak, 0),
            'max', coalesce(streak_profile.max_streak, 0),
            'last_day', streak_profile.last_streak_day
        )
    );
end;
$$;
