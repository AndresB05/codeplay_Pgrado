/*
 * LOS LOGROS DE HISTORIAL SE MIRAN SOBRE EL HISTORIAL ENTERO (paso 22).
 *
 * Medido el 20-sep-2026 con la cuenta de `.env`, que tenia los nueve niveles al
 * 100 desde antes: jugando dos niveles recibio «Maestro Explorador» y solo DOS
 * de los nueve «Perfecto: ...». El de todo barria el historial y los de nivel
 * miraban unicamente el nivel de esa partida, asi que la Sala de Trofeos
 * quedaba diciendo dos cosas incompatibles a la vez.
 *
 * Ahora los tres —nivel, mundo y todo— salen de la misma pregunta: que dice el
 * historial AHORA MISMO. El unico de (user_id, achievement_key) sigue siendo lo
 * que impide conceder dos veces, asi que barrer de mas no cuesta nada.
 *
 * `perfect_all` deja ademas de depender de contar mundos completos y pasa a
 * preguntar directamente si queda algun nivel publicado por debajo de 100: son
 * la misma condicion, y la segunda no se descuadra si algun dia entra un mundo
 * publicado sin niveles.
 *
 * Generada desde el texto de la 0040.
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
    earned_key text;
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
    /*
     * EL HISTORIAL SE MIRA ENTERO, no solo el nivel de esta partida. Medido el
     * 20-sep-2026: mirando solo el nivel jugado, una cuenta con los nueve al 100
     * recibia «Maestro Explorador» y le faltaban SIETE «Perfecto: ...», porque
     * aquel barre el historial y estos no. Un nino con todo perfecto al que le
     * faltan siete logros de nivel se lee como un fallo, y lo era.
     *
     * Barrer los nueve cuesta una consulta sobre las filas del propio nino, y de
     * paso arregla a quien ya tenia progreso antes de que los logros existieran:
     * cobra lo suyo en la siguiente partida en vez de tener que rejugarlo todo.
     */
    for earned_key in
        select 'perfect_w' || world_record.sort_order || '_l' || level_record.sort_order
        from public.user_progress as progress_record
        inner join public.levels as level_record
            on level_record.id = progress_record.level_id
           and level_record.is_published = true
        inner join public.worlds as world_record
            on world_record.id = level_record.world_id
        where progress_record.user_id = input_user_id
          and progress_record.best_score >= 100
    loop
        earned_keys := array_append(earned_keys, earned_key);
    end loop;

    /*
     * UN MUNDO PERFECTO son sus niveles publicados TODOS al 100. Un mundo sin
     * ningun nivel publicado no cuenta: no se puede terminar lo que no existe, y
     * es la misma regla con la que `getCatalog()` lo deja fuera del catalogo.
     */
    for earned_key in
        select 'perfect_world_' || world_record.sort_order
        from public.worlds as world_record
        where world_record.is_published = true
          and exists (
              select 1 from public.levels
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
                and coalesce(progress_record.best_score, 0) < 100
          )
    loop
        earned_keys := array_append(earned_keys, earned_key);
    end loop;

    /* Y el de todo: que no falte ni un nivel publicado. */
    if not exists (
        select 1
        from public.levels as level_record
        left join public.user_progress as progress_record
            on progress_record.level_id = level_record.id
           and progress_record.user_id = input_user_id
        where level_record.is_published = true
          and coalesce(progress_record.best_score, 0) < 100
    ) then
        earned_keys := array_append(earned_keys, 'perfect_all');
    end if;

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
