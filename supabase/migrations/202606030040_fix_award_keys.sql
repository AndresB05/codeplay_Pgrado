/*
 * DOS FALLOS QUE EL DIAGNOSTICO DE LA 0039 DESTAPO, medidos el 20-sep-2026
 * jugando contra la base: la partida se guardaba, y ni un logro se concedia.
 *
 * 1. `22P02 malformed array literal: "perfect_all"`.
 *
 *    `earned_keys || 'perfect_all'` es AMBIGUO. PostgreSQL tiene
 *    `anyarray || anyelement` y `anyarray || anyarray`, y con un literal de
 *    cadena sin tipo a la derecha prefiere el segundo: intenta leer
 *    'perfect_all' como un `text[]` y revienta. Las claves que se construyen
 *    concatenando —'perfect_w' || world_order || ...— llegan ya tipadas como
 *    `text` y por eso ESAS no fallaban, que es lo que hacia el sintoma
 *    desconcertante.
 *
 *    Se pasa a `array_append`, que no tiene esa ambiguedad, en las DIEZ y no
 *    solo en las ocho rotas: dejar dos formas conviviendo es invitar a que la
 *    proxima clave se escriba con la mala.
 *
 * 2. LA RESPUESTA MENTIA SOBRE LA RACHA. El bloque `exception` abre una
 *    subtransaccion, asi que al fallar los logros se revertia TAMBIEN lo que
 *    `touch_streak` acababa de escribir — pero la variable en memoria ya tenia
 *    el valor nuevo, y la respuesta decia «racha 1» con la base a cero.
 *
 *    Pasan a ser DOS bloques protegidos: la racha en el suyo y los logros en el
 *    otro. Un logro que falle ya no se lleva por delante el dia contado, y el
 *    motivo de cada uno viaja etiquetado.
 *
 * Generada desde el texto de la 0036 y la 0039.
 */

create or replace function public.award_achievements(
    input_user_id uuid,
    input_level_id uuid,
    input_submitted_code text,
    input_is_success boolean,
    input_metadata jsonb,
    input_streak integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    earned_keys text[] := '{}';
    level_row public.levels;
    world_order integer;
    program_steps numeric;
    executed_root jsonb;
    jump_blocks integer;
    right_turns integer;
    max_drop numeric;
    perfect_worlds integer;
    unlocked jsonb;
begin
    /*
     * Dos consultas y no un `join` con `into`: `select a.*, b.col into fila,
     * escalar` NO reparte las columnas de `a` en la variable de fila, las asigna
     * una a una en orden, y el resultado es una fila mal armada sin error que lo
     * delate.
     */
    select *
    into level_row
    from public.levels
    where id = input_level_id;

    if not found then
        return '[]'::jsonb;
    end if;

    select sort_order
    into world_order
    from public.worlds
    where id = level_row.world_id;

    if not found then
        return '[]'::jsonb;
    end if;

    /*
     * LOS DE HISTORIAL. Se miran siempre, con éxito o sin él: el niño puede
     * tener el nivel al 100 de antes y estar fallando ahora, y aun así merecer
     * el logro del mundo que acaba de completar con otro nivel.
     */
    if exists (
        select 1
        from public.user_progress
        where user_id = input_user_id
          and level_id = input_level_id
          and best_score >= 100
    ) then
        earned_keys := array_append(earned_keys, 'perfect_w' || world_order || '_l' || level_row.sort_order);
    end if;

    /* El mundo, si sus tres niveles publicados están al 100. */
    if not exists (
        select 1
        from public.levels as levels
        left join public.user_progress as progress
            on progress.level_id = levels.id
           and progress.user_id = input_user_id
        where levels.world_id = level_row.world_id
          and levels.is_published = true
          and coalesce(progress.best_score, 0) < 100
    ) then
        earned_keys := array_append(earned_keys, 'perfect_world_' || world_order);
    end if;

    select count(*)::integer
    into perfect_worlds
    from public.worlds as worlds
    where worlds.is_published = true
      and exists (select 1 from public.levels where world_id = worlds.id and is_published = true)
      and not exists (
          select 1
          from public.levels as levels
          left join public.user_progress as progress
              on progress.level_id = levels.id
             and progress.user_id = input_user_id
          where levels.world_id = worlds.id
            and levels.is_published = true
            and coalesce(progress.best_score, 0) < 100
      );

    if perfect_worlds >= (
        select count(*)
        from public.worlds as worlds
        where worlds.is_published = true
          and exists (select 1 from public.levels where world_id = worlds.id and is_published = true)
    ) then
        earned_keys := array_append(earned_keys, 'perfect_all');
    end if;

    /*
     * LOS DE PARTIDA. Aquí sí manda `input_is_success`: cuatro giros sin llegar
     * a la meta no conceden nada.
     */
    if coalesce(input_is_success, false) then
        program_steps := public.count_program_steps(input_submitted_code);
        executed_root := public.executed_root_block(input_submitted_code);
        jump_blocks := public.count_jump_blocks(executed_root);
        right_turns := public.max_consecutive_right_turns(executed_root);

        if right_turns is not null and right_turns >= 4 then
            earned_keys := array_append(earned_keys, 'no_dizzy');
        end if;

        if jump_blocks is not null and jump_blocks >= 10 then
            earned_keys := array_append(earned_keys, 'trying_to_fly');
        end if;

        if program_steps is not null and program_steps = 67 then
            earned_keys := array_append(earned_keys, 'unnecessary');
        end if;

        /*
         * LA CAÍDA ES UNA OBSERVACIÓN DEL JUEGO, no un dato comprobable: no se
         * lee del programa sin ejecutar la rejilla dentro de la base. Se cree al
         * mismo nivel que `is_success`, del que ya depende toda la experiencia,
         * y acotada por él. Una clave ausente o con basura no concede y no
         * rompe, que es la misma regla que `count_block_chain` aplica a un
         * bloque que no entiende.
         */
        if world_order = 2 and level_row.sort_order = 3
           and jsonb_typeof(input_metadata->'maxDrop') = 'number' then
            max_drop := (input_metadata->>'maxDrop')::numeric;

            if max_drop >= 5 then
                earned_keys := array_append(earned_keys, 'ouch_my_knees');
            end if;
        end if;
    end if;

    if coalesce(input_streak, 0) >= 3 then
        earned_keys := array_append(earned_keys, 'streak_3');
    end if;

    if coalesce(input_streak, 0) >= 7 then
        earned_keys := array_append(earned_keys, 'streak_7');
    end if;

    if coalesce(input_streak, 0) >= 30 then
        earned_keys := array_append(earned_keys, 'streak_30');
    end if;

    if array_length(earned_keys, 1) is null then
        return '[]'::jsonb;
    end if;

    /*
     * El título y la descripción se COPIAN del catálogo, no se referencian:
     * `achievements` los tiene `not null` desde la 0005 y así renombrar un logro
     * no reescribe lo que el niño ya ganó.
     */
    with inserted as (
        insert into public.achievements (
            user_id, achievement_key, title, description, icon_name, awarded_xp
        )
        select
            input_user_id,
            catalog.achievement_key,
            catalog.title,
            catalog.description,
            catalog.icon_name,
            catalog.awarded_xp
        from public.achievement_catalog as catalog
        where catalog.achievement_key = any (earned_keys)
        on conflict (user_id, achievement_key) do nothing
        returning achievement_key, title, description, icon_name, awarded_xp
    )
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'key', inserted.achievement_key,
                'title', inserted.title,
                'description', inserted.description,
                'icon_name', inserted.icon_name,
                'awarded_xp', inserted.awarded_xp
            )
            order by inserted.achievement_key
        ),
        '[]'::jsonb
    )
    into unlocked
    from inserted;

    /* Lo que los logros acaban de pagar entra en el total del perfil. */
    update public.profiles
    set total_xp = total_xp + coalesce((
        select sum((element->>'awarded_xp')::integer)
        from jsonb_array_elements(unlocked) as element
    ), 0)
    where id = input_user_id;

    return unlocked;
end;
$$;

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
    award_error text;
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
    exception
        when others then
            select *
            into streak_profile
            from public.profiles
            where id = authenticated_user_id;

            award_error := 'racha: ' || sqlstate || ' ' || sqlerrm;
    end;

    begin
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
            award_error := coalesce(award_error || ' | ', '') || sqlstate || ' ' || sqlerrm;

            /*
             * La racha se RELEE de la base, no se deja la de memoria: el bloque
             * de arriba ya la escribio y este no la toca, pero si algun dia
             * volvieran a compartir bloque, la variable diria lo que se revirtio.
             */
            select *
            into streak_profile
            from public.profiles
            where id = authenticated_user_id;
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
        'achievements_error', award_error,
        'streak', jsonb_build_object(
            'current', coalesce(streak_profile.current_streak, 0),
            'max', coalesce(streak_profile.max_streak, 0),
            'last_day', streak_profile.last_streak_day
        )
    );
end;
$$;
