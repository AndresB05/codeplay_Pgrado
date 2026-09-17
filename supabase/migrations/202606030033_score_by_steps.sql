/*
 * LA PUNTUACIÓN Y EL XP POR MARCA DE AGUA (J10).
 *
 * Hasta esta migración, `upsert_my_progress` concedía el `xp_reward` entero en
 * la transición a completado y cero después, así que un segundo intento perfecto
 * sumaba nada; y `score` y `best_score` se escribían en cero porque el contrato
 * §3 le quitó la puntuación al juego el 3-sep-2026 —la calcula el servidor
 * leyendo el programa— y nadie la calculaba todavía.
 *
 * Esta migración no crea ni altera ninguna tabla, ninguna política y ningún
 * grant de tabla. Son cinco cosas:
 *
 *   1. `count_program_steps`, que cuenta los pasos LEYENDO el programa.
 *   2. `score_for_steps`, la regla de puntuación.
 *   3. `submit_level_attempt`, una partida en una sola llamada.
 *   4. `upsert_my_progress`, que pasa a conceder por diferencia de marca.
 *   5. El recálculo de las marcas que ya existían y el cuadre de `total_xp`.
 *
 * EL JSON DE BLOCKLY SE DEJA RECORRER DESDE SQL, que era la duda que el J4 dejó
 * abierta para este paso —«si resulta incómodo, se cambia en el J10, con casos
 * reales delante»—. Con los casos delante: dos funciones recursivas sobre
 * `jsonb` y los operadores `->` y `->>` bastan, así que no hace falta ni
 * traductor propio ni formato nuevo.
 */

/*
 * UNA SECUENCIA DE BLOQUES, contada. Sirve igual para el programa entero que
 * para el cuerpo de un salto, que es otra secuencia colgada de su entrada.
 *
 * Devuelve `null` cuando encuentra algo que no entiende, y entonces el programa
 * ENTERO es ilegible: contar el resto saltándose el bloque raro daría un número
 * que no describe nada. Es la misma decisión que `readOrder` toma en el cliente,
 * y este archivo replica ese lector orden por orden a propósito — de que los dos
 * cuenten igual depende que la puntuación que ve el niño sea la que se guarda.
 *
 * El acumulador es `numeric` y no `integer` porque el campo de `avanzar` es un
 * número escrito por quien manda el intento: un valor absurdo desbordaría el
 * entero y la excepción se llevaría por delante el guardado de la partida.
 */
create or replace function public.count_block_chain(
    input_block jsonb,
    input_inside_jump boolean
)
returns numeric
language plpgsql
immutable
as $$
declare
    current_block jsonb;
    next_block jsonb;
    block_type text;
    body_steps numeric;
    steps_field jsonb;
    advance_steps numeric;
    total numeric := 0;
begin
    current_block := case
        when input_block is not null and jsonb_typeof(input_block) = 'object' then input_block
    end;

    while current_block is not null loop
        block_type := current_block->>'type';

        if block_type in ('codeplay_turn_left', 'codeplay_turn_right') then
            total := total + 1;

        elsif block_type = 'codeplay_jump' then
            /*
             * UN SALTO DENTRO DE OTRO no tiene regla —ni de coste ni de
             * movimiento—, así que no se cuenta a medias. El editor ya no deja
             * encajarlo; esto cubre lo que llegue por otro camino.
             */
            if input_inside_jump then
                return null;
            end if;

            body_steps := public.count_block_chain(
                current_block->'inputs'->'BODY'->'block',
                true
            );

            if body_steps is null then
                return null;
            end if;

            /* Vacío cuesta uno; con cuerpo, el doble de su cuerpo (contrato §4.4). */
            total := total + case when body_steps = 0 then 1 else 2 * body_steps end;

        elsif block_type = 'codeplay_advance' then
            steps_field := current_block->'fields'->'STEPS';

            if steps_field is null or jsonb_typeof(steps_field) <> 'number' then
                return null;
            end if;

            advance_steps := (steps_field #>> '{}')::numeric;

            if advance_steps < 1 or advance_steps <> trunc(advance_steps) then
                return null;
            end if;

            total := total + advance_steps;

        else
            /* Un tipo que no es de los nuestros, o un bloque sin tipo. */
            return null;
        end if;

        /*
         * LA CADENA SE ACABA EN CUANTO LO QUE SIGUE NO ES UN BLOQUE. Blockly
         * escribe `next.block` a `null` mientras se arrastra el bloque
         * siguiente, y eso no es un programa roto: es el bloque de abajo en el
         * aire. El cliente se para igual en vez de rechazar el programa.
         */
        next_block := current_block->'next'->'block';
        current_block := case
            when next_block is not null and jsonb_typeof(next_block) = 'object' then next_block
        end;
    end loop;

    return total;
end;
$$;

/*
 * LOS PASOS DE UN PROGRAMA GUARDADO, abriendo su sobre (contrato §4.3).
 *
 * `null` es «no se puede leer», y eso NO rechaza el intento: quien la llama
 * guarda la partida igual, con su programa intacto y sin puntuación. Perder el
 * registro de una partida que ocurrió sería peor que no puntuarla.
 *
 * Cero, en cambio, es un programa legible que no cuesta nada —el lienzo vacío—,
 * y tiene que poder distinguirse de lo anterior: el `case` del final de
 * `count_block_chain` devuelve cero, no `null`, para un montón que no existe.
 */
create or replace function public.count_program_steps(input_submitted_code text)
returns integer
language plpgsql
immutable
as $$
declare
    envelope jsonb;
    workspace jsonb;
    container jsonb;
    roots jsonb;
    chosen jsonb;
    total numeric;
begin
    if input_submitted_code is null then
        return null;
    end if;

    /*
     * La columna es `text` SIN `check`: nada valida lo que entra, y hay filas
     * guardadas que no son JSON —el `curl` del 2-sep-2026 metió una `'x'`—. El
     * `cast` de una de ellas levanta `22P02`, así que se captura: leerlas es
     * exactamente lo que esta función tiene que saber hacer sin morirse.
     */
    begin
        envelope := input_submitted_code::jsonb;
    exception
        when others then
            return null;
    end;

    if envelope is null or jsonb_typeof(envelope) <> 'object' then
        return null;
    end if;

    /* La versión va PEGADA a los bytes que describe, y sólo hay una válida. */
    if envelope->>'formatVersion' is distinct from 'grid-blockly-2' then
        return null;
    end if;

    workspace := envelope->'workspace';

    if workspace is null or jsonb_typeof(workspace) <> 'object' then
        return null;
    end if;

    container := workspace->'blocks';

    if container is null then
        return 0;
    end if;

    if jsonb_typeof(container) <> 'object' then
        return null;
    end if;

    roots := container->'blocks';

    if roots is null then
        return 0;
    end if;

    if jsonb_typeof(roots) <> 'array' then
        return null;
    end if;

    /*
     * SE CUENTA EL MONTÓN QUE EL JUEGO EJECUTA, no el primero del array: ese
     * orden es de construcción y no de pantalla (§4.3). El que empieza más
     * arriba, y más a la izquierda a igual altura. El `with ordinality` está
     * para los empates: sin él, dos montones en el mismo sitio se
     * desempatarían por donde el planificador quisiera, y el cliente se queda
     * con el que apareció antes.
     */
    select element
    into chosen
    from jsonb_array_elements(roots) with ordinality as t(element, element_index)
    order by
        case when jsonb_typeof(element->'y') = 'number' then (element->>'y')::numeric else 0 end,
        case when jsonb_typeof(element->'x') = 'number' then (element->>'x')::numeric else 0 end,
        t.element_index
    limit 1;

    total := public.count_block_chain(chosen, false);

    if total is null then
        return null;
    end if;

    /*
     * Lo que sobra del montón ejecutado SÍ cuenta —pisar la meta y dejar
     * bloques detrás se paga—, y lo que quedó en otros montones no: no se
     * ejecutó. El tope es el del entero, para que un número absurdo escrito en
     * un `avanzar` puntúe mal en vez de reventar la llamada.
     */
    return least(total, 2147483647)::integer;
end;
$$;

/*
 * LA REGLA DE PUNTUACIÓN, decidida por el usuario el 17-sep-2026 después de
 * medir tres candidatas contra los nueve programas resueltos a mano y sus
 * excesos: la EFICIENCIA, los pasos de la mejor solución sobre los usados.
 *
 * Los pasos justos dan 100 y cada paso de más resta, tanto más cuanto más corto
 * sea el nivel — en el primero, de cuatro pasos, un bloque olvidado cuesta 20.
 *
 * El `greatest(1, ...)` no es una precaución contra el redondeo: es la regla de
 * que RESOLVER SIEMPRE PAGA ALGO. Un programa disparatado que llega a la meta
 * baja a uno y no a cero, porque cero es lo que vale no haber resuelto el nivel
 * y las dos cosas no pueden decirse con el mismo número.
 *
 * Sin `optimalSteps` no hay contra qué comparar, y entonces es cero: un nivel
 * cuya configuración no lo trae no puntúa, en vez de puntuar un número
 * inventado.
 */
create or replace function public.score_for_steps(
    input_steps integer,
    input_optimal_steps integer
)
returns integer
language sql
immutable
as $$
    select case
        when input_steps is null
             or input_optimal_steps is null
             or input_steps < 1
             or input_optimal_steps < 1
        then 0
        else greatest(
            1,
            least(100, round(100.0 * input_optimal_steps / input_steps)::integer)
        )
    end;
$$;

/*
 * UNA PARTIDA TERMINADA, EN UNA SOLA LLAMADA.
 *
 * Eran dos —`create_level_attempt` y `upsert_my_progress`, independientes y sin
 * nada que las sincronizara— y dejan de serlo porque la puntuación sale de
 * contar el programa: `upsert_my_progress` NO RECIBE el programa y es la que
 * concede el XP, así que con dos llamadas habría que mandarlo dos veces o hacer
 * que la segunda buscara la fila que la primera acaba de escribir, acoplándose a
 * un orden que nada garantiza —el anfitrión hace las dos aunque la primera
 * falle, a propósito—.
 *
 * Y de paso `user_progress.attempt_count` pasa a contar PARTIDAS: con una
 * llamada por partida, coincide con las filas de `level_attempts` de ese nivel.
 * Hasta hoy eran dos contadores que nada sincronizaba.
 *
 * NO concede logros, aunque sea el sitio donde algún día se concederán (paso
 * 22): el catálogo no existe y `achievements` no tiene `grant insert` para
 * nadie.
 *
 * El estado del progreso NO es un parámetro: sale de `input_is_success`.
 * Pasarlo aparte dejaba dos cosas que pueden contradecirse —una partida con
 * éxito marcada como empezada— sin que nada lo impida.
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
        attempt_score,
        0
    );

    awarded_xp := round(
        greatest(saved_progress.best_score - previous_best, 0)::numeric
        * level_row.xp_reward / 100.0
    )::integer;

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
        'total_xp', current_total_xp
    );
end;
$$;

/*
 * `upsert_my_progress`, IGUAL QUE ESTABA SALVO LA CONCESIÓN DEL XP.
 *
 * Pasa de conceder el `xp_reward` entero en la transición a completado —una vez
 * por nivel y nunca más— a conceder la DIFERENCIA DE MARCA:
 *
 *     (marca nueva − marca anterior) × tope del nivel ÷ 100
 *
 * De ahí salen las tres consecuencias que el diseño pide: superar flojo paga lo
 * que valga la partida, mejorar paga la diferencia, y empeorar paga cero. Y no
 * hace falta llevar la cuenta de lo ya concedido, porque `best_score` ya está
 * acotado de 0 a 100 y nunca baja.
 *
 * SE CAMBIA AQUÍ Y NO SÓLO EN LA FUNCIÓN NUEVA porque si no la base se quedaría
 * con dos reglas contradictorias y la vieja seguiría regalando el tope entero a
 * quien la llamara. Sigue existiendo y sigue concedida al rol autenticado: es la
 * única vía para escribir progreso sin intento.
 *
 * Lo que un cliente puede falsear no cambia con esto. Antes bastaba llamarla con
 * `completed` para cobrar el tope; ahora hace falta además decir una marca, y se
 * cobra como mucho esa marca. Es el mismo bit de confianza que el contrato §5 ya
 * reconocía —`is_success`—, ni uno más.
 */
create or replace function public.upsert_my_progress(
    input_level_id uuid,
    input_completion_status text default 'in_progress',
    input_best_score integer default 0,
    input_stars_earned integer default 0,
    input_last_attempt_at timestamptz default timezone('utc', now())
)
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    current_progress public.user_progress;
    saved_progress public.user_progress;
    normalized_completion_status text;
    level_xp integer;
    previous_best integer := 0;
    awarded_xp integer := 0;
    effective_attempt_at timestamptz;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    normalized_completion_status := lower(coalesce(input_completion_status, 'in_progress'));

    if normalized_completion_status not in ('in_progress', 'completed') then
        raise exception 'Invalid completion status'
            using errcode = '22023';
    end if;

    effective_attempt_at := coalesce(input_last_attempt_at, timezone('utc', now()));

    select xp_reward
    into level_xp
    from public.levels
    where id = input_level_id
      and is_published = true;

    if not found then
        raise exception 'Level not found or unavailable'
            using errcode = 'P0002';
    end if;

    select *
    into current_progress
    from public.user_progress
    where user_id = authenticated_user_id
      and level_id = input_level_id
    for update;

    if not found then
        insert into public.user_progress (
            user_id,
            level_id,
            completion_status,
            best_score,
            stars_earned,
            attempt_count,
            completed_at,
            last_attempt_at
        )
        values (
            authenticated_user_id,
            input_level_id,
            normalized_completion_status,
            greatest(least(coalesce(input_best_score, 0), 100), 0),
            greatest(least(coalesce(input_stars_earned, 0), 3), 0),
            1,
            case
                when normalized_completion_status = 'completed' then effective_attempt_at
                else null
            end,
            effective_attempt_at
        )
        returning * into saved_progress;
    else
        previous_best := current_progress.best_score;

        update public.user_progress
        set completion_status = case
                when current_progress.completion_status = 'completed' or normalized_completion_status = 'completed' then 'completed'
                else 'in_progress'
            end,
            best_score = greatest(current_progress.best_score, greatest(least(coalesce(input_best_score, 0), 100), 0)),
            stars_earned = greatest(current_progress.stars_earned, greatest(least(coalesce(input_stars_earned, 0), 3), 0)),
            attempt_count = current_progress.attempt_count + 1,
            completed_at = case
                when current_progress.completed_at is not null then current_progress.completed_at
                when normalized_completion_status = 'completed' then effective_attempt_at
                else null
            end,
            last_attempt_at = effective_attempt_at
        where id = current_progress.id
        returning * into saved_progress;
    end if;

    /*
     * La marca sólo paga si el nivel QUEDA SUPERADO. Una marca que subiera con
     * el nivel en `in_progress` no puede pagar: sería XP por un intento que no
     * resolvió nada.
     */
    if saved_progress.completion_status = 'completed' then
        awarded_xp := round(
            greatest(saved_progress.best_score - previous_best, 0)::numeric
            * level_xp / 100.0
        )::integer;
    end if;

    if awarded_xp > 0 then
        update public.profiles
        set total_xp = total_xp + awarded_xp
        where id = authenticated_user_id;
    end if;

    return saved_progress;
end;
$$;

revoke all on function public.count_block_chain(jsonb, boolean) from public, anon;
revoke all on function public.count_program_steps(text) from public, anon;
revoke all on function public.score_for_steps(integer, integer) from public, anon;
revoke all on function public.submit_level_attempt(uuid, text, boolean, integer, jsonb) from public, anon;

grant execute on function public.submit_level_attempt(uuid, text, boolean, integer, jsonb) to authenticated;

/*
 * LAS MARCAS ANTERIORES A LA PUNTUACIÓN, RECALCULADAS. Decisión del usuario el
 * 17-sep-2026, y hay que tomarla porque las dos cosas dejan de significar lo
 * mismo: hasta hoy completar un nivel concedía el tope entero CON LA MARCA EN
 * CERO, así que dejarlas como están les permitiría volver a cobrar hasta 100
 * cada uno. Medido antes de escribir esto: tres niveles superados, marcas 0, 0 y
 * 90, y `total_xp` 300.
 *
 * La marca pasa a ser la mejor puntuación de los intentos CON ÉXITO cuyo
 * programa se pueda leer, y nunca baja de la que ya tuviera. Un nivel superado
 * cuyos intentos no se puedan leer conserva la suya: no hay nada que
 * recalcular, e inventarle una marca perfecta sería regalar una puntuación que
 * nadie midió.
 *
 * NO se reescribe el `score` de los intentos viejos. Se podría —los 14 del J9
 * son legibles—, y no se hace: la puntuación de un intento es de cuando se
 * jugó, y reescribirla borraría la única señal de que aquellas partidas se
 * jugaron sin puntuación. Lo que alguien lee es la marca, y ésa sí se recalcula.
 */
with scored as (
    select
        attempts.user_id,
        attempts.level_id,
        max(
            public.score_for_steps(
                public.count_program_steps(attempts.submitted_code),
                case
                    when jsonb_typeof(levels.validation_rules->'optimalSteps') = 'number'
                    then (levels.validation_rules->>'optimalSteps')::integer
                end
            )
        ) as best_score
    from public.level_attempts as attempts
    join public.levels as levels on levels.id = attempts.level_id
    where attempts.is_success = true
    group by attempts.user_id, attempts.level_id
)
update public.user_progress as progress
set best_score = scored.best_score
from scored
where scored.user_id = progress.user_id
  and scored.level_id = progress.level_id
  and scored.best_score > progress.best_score;

/*
 * Y EL XP CUADRADO CON LAS MARCAS: la suma de lo que ha concedido cada nivel
 * más lo que dieron los logros. Sin esto, la marca diría una cosa y el total
 * otra, y un nivel ya cobrado podría volver a pagar.
 *
 * Los logros se suman aunque hoy no haya ni una fila: atar la cuenta a que esa
 * tabla siga vacía sería dejar una bomba para el paso 22.
 */
update public.profiles as profiles
set total_xp = (
        select coalesce(sum(round(progress.best_score::numeric * levels.xp_reward / 100.0)), 0)
        from public.user_progress as progress
        join public.levels as levels on levels.id = progress.level_id
        where progress.user_id = profiles.id
    ) + (
        select coalesce(sum(achievements.awarded_xp), 0)
        from public.achievements as achievements
        where achievements.user_id = profiles.id
    );
