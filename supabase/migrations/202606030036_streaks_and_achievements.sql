/*
 * RACHAS Y LOGROS (paso 22).
 *
 * Las dos piezas llevaban semanas a medio poner y nunca se cerraron. Medido el
 * 18-sep-2026 con la cuenta de niño de `.env`, que tiene 900 XP y los nueve
 * niveles al 100: cero filas en `achievements`, `current_streak` a cero y
 * `max_streak` a cero. No faltaban logros: faltaba quien los concediera.
 *
 * Lo que esta migración aprovecha y NO reinventa:
 *   - `achievements` existe desde la 0005, con su único por
 *     (user_id, achievement_key) y SIN `grant insert` para nadie. Ese hueco es
 *     la puerta: sólo escribe una función `security definer`.
 *   - `profiles.current_streak` y `max_streak` existen desde la 0002.
 *   - `total_xp` ya suma `achievements.awarded_xp` desde la 0033, así que
 *     conceder experiencia por un logro cuadra la cuenta sin tocarla.
 *   - `count_block_chain` ya recorre el JSON de Blockly desde SQL. Las lecturas
 *     nuevas son hermanas suyas y copian su regla: ante un bloque que no
 *     entienden, el programa entero es ilegible.
 *
 * LO QUE EL SERVIDOR SE CREE SIN PODER COMPROBARLO sigue siendo UNA sola cosa, y
 * conviene decirlo en voz alta: `is_success`, más la observación de la caída que
 * entra aquí. Comprobar cualquiera de las dos exigiría ejecutar el programa
 * contra la rejilla dentro de la base —reimplementar el motor del juego— y eso
 * es un proyecto entero. La mitigación que el contrato §5 manda se aplica a los
 * CUATRO logros de partida: exigen un intento con éxito de ese nivel.
 */

-- ---------------------------------------------------------------------------
-- 1. EL CATÁLOGO, EN UN SOLO SITIO
-- ---------------------------------------------------------------------------

/*
 * Es tabla y no constante del cliente porque la Sala de Trofeos tiene que
 * pintar LO QUE FALTA, y eso exige la lista entera en el cliente. Con el
 * catálogo en SQL para conceder y una copia en TypeScript para pintar, las dos
 * se separan en cuanto alguien toque una. Es lo que ya le pasa a
 * `mission_assignments`, cuyo `mission_key` es texto suelto contra un catálogo
 * que sólo existe en el cliente.
 *
 * `achievements` SIGUE copiando título y descripción al conceder: sus columnas
 * son `not null` desde la 0005 y el efecto es bueno — renombrar un logro no
 * reescribe lo que el niño ya ganó.
 */
create table if not exists public.achievement_catalog (
    achievement_key text primary key,
    title text not null,
    description text not null,
    icon_name text not null,
    awarded_xp integer not null default 0 check (awarded_xp >= 0),
    /* `level`, `world`, `mastery`, `action`, `streak`. Ordena la Sala de Trofeos. */
    category text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.achievement_catalog enable row level security;

/*
 * El catálogo no es dato de nadie: es contenido, como `worlds` y `levels`, y se
 * lee entero. Sin esto la Sala de Trofeos no podría enseñar lo que falta, que es
 * la mitad de para qué existe.
 */
drop policy if exists achievement_catalog_read_all on public.achievement_catalog;
create policy achievement_catalog_read_all
on public.achievement_catalog
for select
to authenticated
using (true);

revoke all on public.achievement_catalog from public;
revoke insert, update, delete on public.achievement_catalog from anon, authenticated;
grant select on public.achievement_catalog to authenticated;

-- ---------------------------------------------------------------------------
-- 2. LOS VEINTE
-- ---------------------------------------------------------------------------

/*
 * LAS CLAVES DE NIVEL Y MUNDO SE DERIVAN DEL ORDEN, NO DEL UUID. Los
 * identificadores de la siembra no son los mismos en otro proyecto de Supabase,
 * y una clave ilegible convierte cualquier consulta de depuración en un
 * acertijo. El orden sí aguanta: un nivel rediseñado sigue siendo el tercero de
 * su mundo, y eso ya pasó con el mundo 2.
 *
 * El título del nivel se limpia del prefijo «Nivel N - » que llevan los nueve;
 * si algún día un título no lo lleva, `nullif` deja pasar el título entero en
 * vez de dejar el logro sin nombre.
 */
insert into public.achievement_catalog (
    achievement_key, title, description, icon_name, awarded_xp, category, sort_order
)
select
    'perfect_w' || world_record.sort_order || '_l' || level_record.sort_order,
    'Perfecto: ' || coalesce(nullif(split_part(level_record.title, ' - ', 2), ''), level_record.title),
    'Supera «' || coalesce(nullif(split_part(level_record.title, ' - ', 2), ''), level_record.title)
        || '» con la marca máxima: 100 de 100.',
    'medal',
    50,
    'level',
    world_record.sort_order * 10 + level_record.sort_order
from public.levels as level_record
join public.worlds as world_record on world_record.id = level_record.world_id
where level_record.is_published = true
on conflict (achievement_key) do nothing;

/*
 * MUNDO PERFECTO, y perfecto quiere decir los tres al 100: decisión del usuario
 * del 18-sep-2026. Son los que la Sala de Trofeos enseña como «Grandes trofeos»,
 * así que llevan título escrito a mano — derivarlo del nombre del mundo daba
 * «Dueño de Selva Algorítmica», que no se lee.
 */
insert into public.achievement_catalog (
    achievement_key, title, description, icon_name, awarded_xp, category, sort_order
)
values
    ('perfect_world_1', 'Dueño de la Selva',
     'Supera los tres niveles de Selva Algorítmica con 100 de 100.', 'crown', 200, 'world', 101),
    ('perfect_world_2', 'Dueño de la Cordillera',
     'Supera los tres niveles de Cordillera Binaria con 100 de 100.', 'crown', 200, 'world', 102),
    ('perfect_world_3', 'Dueño de la Costa',
     'Supera los tres niveles de Costa de Bugs con 100 de 100.', 'crown', 200, 'world', 103),
    ('perfect_all', 'Maestro Explorador',
     'Supera los nueve niveles del juego con 100 de 100.', 'trophy', 500, 'mastery', 201)
on conflict (achievement_key) do nothing;

/*
 * LOS DE ACCIÓN SE LEEN DEL PROGRAMA, y los tres EXIGEN LLEGAR A LA META —
 * corregido por el usuario el 18-sep-2026: «todos se tienen que ejecutar para
 * darte el logro». Cuatro giros sin resolver el nivel no conceden nada.
 *
 * COMPROBADO QUE LOS TRES CABEN CON LA META: sólo en Selva y Cordillera, porque
 * los tres niveles de Costa de Bugs tienen `stepLimit` igual a su óptimo —10, 17
 * y 14— y cortan la partida antes de llegar a 67 pasos. Si algún día Selva o
 * Cordillera ganan un tope, «Eso fue innecesario...» deja de poder ganarse y
 * nada avisará: queda escrito aquí.
 */
insert into public.achievement_catalog (
    achievement_key, title, description, icon_name, awarded_xp, category, sort_order
)
values
    ('no_dizzy', 'Sin mareos',
     'Da cuatro giros seguidos a la derecha —una vuelta entera— y aun así llega a la meta.',
     'compass', 100, 'action', 301),
    ('trying_to_fly', 'Intentando volar',
     'Usa diez bloques de salto en el mismo programa y llega a la meta.',
     'wing', 100, 'action', 302),
    ('unnecessary', 'Eso fue innecesario...',
     'Llega a la meta con un programa de 67 pasos. Ni uno menos.',
     'maze', 100, 'action', 303),
    ('ouch_my_knees', '¡Auch! mis rodillas',
     'En «La torre», cae cinco alturas de una sola vez y llega a la meta.',
     'bandage', 150, 'action', 304)
on conflict (achievement_key) do nothing;

insert into public.achievement_catalog (
    achievement_key, title, description, icon_name, awarded_xp, category, sort_order
)
values
    ('streak_3', 'Vuelvo mañana',
     'Supera algún nivel tres días seguidos.', 'flame', 75, 'streak', 401),
    ('streak_7', 'Semana completa',
     'Supera algún nivel siete días seguidos.', 'flame', 200, 'streak', 402),
    ('streak_30', 'Un mes sin fallar',
     'Supera algún nivel treinta días seguidos.', 'flame', 600, 'streak', 403)
on conflict (achievement_key) do nothing;

-- ---------------------------------------------------------------------------
-- 3. LA RACHA NECESITA UNA FECHA
-- ---------------------------------------------------------------------------

/*
 * `current_streak` es un contador SIN FECHA, y por eso no servía: no distingue
 * «tres días seguidos» de «tres días sueltos». La 0015 ya lo dejó anotado —«y
 * `current_streak` todavía no lo calcula nadie»— y el paso 17 volvió a medirlo.
 *
 * EL DÍA ES EL DE COLOMBIA, decidido por el usuario el 18-sep-2026 con la
 * medición delante: sobre los 28 intentos guardados, contar en UTC daba racha 2
 * y contar en hora local daba 0, porque las partidas de las 00:20 a la 01:43 UTC
 * del 18 son la noche del 17 en Colombia. Con UTC, al niño el día se le acabaría
 * a las siete de la tarde.
 */
alter table public.profiles
    add column if not exists last_streak_day date;

comment on column public.profiles.last_streak_day is
    'Último día (hora de Colombia) en que el niño superó algún nivel. Sin esto, current_streak no distingue días seguidos de días sueltos.';

-- ---------------------------------------------------------------------------
-- 4. LO QUE FALTABA LEER DEL PROGRAMA
-- ---------------------------------------------------------------------------

/*
 * CUÁNTOS BLOQUES DE SALTO TIENE UN PROGRAMA. Cuenta BLOQUES, no pasos: diez
 * saltos son diez bloques `codeplay_jump`, tengan cuerpo o no.
 *
 * Copia la forma de `count_block_chain`: recorre la cadena por `next.block`, se
 * mete en el cuerpo del salto y devuelve `null` ante cualquier bloque que no
 * entienda, porque contar el resto saltándose el raro daría un número que no
 * describe nada.
 */
create or replace function public.count_jump_blocks(input_block jsonb)
returns integer
language plpgsql
immutable
as $$
declare
    current_block jsonb;
    next_block jsonb;
    block_type text;
    body_jumps integer;
    total integer := 0;
begin
    current_block := case
        when input_block is not null and jsonb_typeof(input_block) = 'object' then input_block
    end;

    while current_block is not null loop
        block_type := current_block->>'type';

        if block_type = 'codeplay_jump' then
            total := total + 1;

            /*
             * El editor no deja anidar saltos, pero el cuerpo puede traer otros
             * bloques y hay que recorrerlo igual para llegar al final de la
             * cadena de dentro.
             */
            body_jumps := public.count_jump_blocks(current_block->'inputs'->'BODY'->'block');

            if body_jumps is null then
                return null;
            end if;

            total := total + body_jumps;

        elsif block_type not in ('codeplay_turn_left', 'codeplay_turn_right', 'codeplay_advance') then
            return null;
        end if;

        next_block := current_block->'next'->'block';
        current_block := case
            when next_block is not null and jsonb_typeof(next_block) = 'object' then next_block
        end;
    end loop;

    return total;
end;
$$;

/*
 * LA TIRADA MÁS LARGA DE GIROS A LA DERECHA SEGUIDOS, que es lo que «Sin
 * mareos» premia: cuatro seguidos son una vuelta entera sobre el sitio.
 *
 * SEGUIDOS quiere decir sin nada en medio: un «avanzar» entre dos giros rompe la
 * tirada, porque entonces no se dio una vuelta, se dio un rodeo. Los giros de
 * dentro de un salto cuentan en su propia tirada y no se pegan a los de fuera:
 * el salto los ejecuta en el aire, y mezclarlos diría que hubo una vuelta que no
 * se vio.
 */
create or replace function public.max_consecutive_right_turns(input_block jsonb)
returns integer
language plpgsql
immutable
as $$
declare
    current_block jsonb;
    next_block jsonb;
    block_type text;
    body_best integer;
    streak integer := 0;
    best integer := 0;
begin
    current_block := case
        when input_block is not null and jsonb_typeof(input_block) = 'object' then input_block
    end;

    while current_block is not null loop
        block_type := current_block->>'type';

        if block_type = 'codeplay_turn_right' then
            streak := streak + 1;
            best := greatest(best, streak);

        elsif block_type = 'codeplay_jump' then
            streak := 0;

            body_best := public.max_consecutive_right_turns(
                current_block->'inputs'->'BODY'->'block'
            );

            if body_best is null then
                return null;
            end if;

            best := greatest(best, body_best);

        elsif block_type in ('codeplay_turn_left', 'codeplay_advance') then
            streak := 0;

        else
            return null;
        end if;

        next_block := current_block->'next'->'block';
        current_block := case
            when next_block is not null and jsonb_typeof(next_block) = 'object' then next_block
        end;
    end loop;

    return best;
end;
$$;

/*
 * EL MONTÓN QUE EL JUEGO EJECUTA, sacado del sobre.
 *
 * NO es el primero del array: ese orden es de construcción y no de pantalla
 * (contrato §4.3). Es el que empieza más arriba, y más a la izquierda a igual
 * altura, con el orden del array desempatando — la misma regla que
 * `count_program_steps` aplica desde la 0033, y de la que depende que los logros
 * lean el MISMO programa que se puntuó.
 *
 * `count_program_steps` NO se reescribe encima de ésta, y es deliberado: aquélla
 * distingue «programa vacío» (cero) de «programa ilegible» (nulo), y ésta no lo
 * necesita —un programa raro simplemente no concede nada— así que devuelve nulo
 * en los dos casos. Hacer que la de puntuar dependa de ésta habría obligado a
 * colar esa distinción aquí dentro para no cambiar ni una marca ya guardada, y
 * no vale la pena por treinta líneas de navegación.
 */
create or replace function public.executed_root_block(input_submitted_code text)
returns jsonb
language plpgsql
immutable
as $$
declare
    envelope jsonb;
    roots jsonb;
    chosen jsonb;
begin
    if input_submitted_code is null then
        return null;
    end if;

    /* La columna es `text` SIN `check`, y hay filas guardadas que no son JSON. */
    begin
        envelope := input_submitted_code::jsonb;
    exception
        when others then
            return null;
    end;

    if envelope is null or jsonb_typeof(envelope) <> 'object'
       or envelope->>'formatVersion' is distinct from 'grid-blockly-2' then
        return null;
    end if;

    roots := envelope->'workspace'->'blocks'->'blocks';

    if roots is null or jsonb_typeof(roots) <> 'array' then
        return null;
    end if;

    select element
    into chosen
    from jsonb_array_elements(roots) with ordinality as t(element, element_index)
    order by
        case when jsonb_typeof(element->'y') = 'number' then (element->>'y')::numeric else 0 end,
        case when jsonb_typeof(element->'x') = 'number' then (element->>'x')::numeric else 0 end,
        t.element_index
    limit 1;

    return chosen;
end;
$$;

/*
 * Se conceden igual que las dos de la 0035, y por lo mismo: una función llamada
 * desde una vista o desde otra función comprueba su `execute` contra QUIEN LANZA
 * LA CONSULTA, no contra el dueño. No hay nada que proteger: reciben un JSON y
 * devuelven un número.
 */
grant execute on function public.count_jump_blocks(jsonb) to authenticated;
grant execute on function public.max_consecutive_right_turns(jsonb) to authenticated;
grant execute on function public.executed_root_block(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. LA RACHA, AL SUPERAR UN NIVEL
-- ---------------------------------------------------------------------------

/*
 * SÓLO SUBE CON UNA PARTIDA SUPERADA, decidido por el usuario: entrar y fallar
 * no cuenta. Vale cualquier nivel, incluso uno ya superado antes.
 *
 * Y sube UNA SOLA VEZ AL DÍA: tres niveles en una tarde son un día, no tres.
 *
 * Devuelve la racha ya actualizada para que quien la llame no tenga que volver a
 * leer el perfil.
 */
create or replace function public.touch_streak(input_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    today date;
    profile_row public.profiles;
    next_streak integer;
begin
    today := (timezone('America/Bogota', now()))::date;

    select *
    into profile_row
    from public.profiles
    where id = input_user_id
    for update;

    if not found then
        return null;
    end if;

    next_streak := case
        when profile_row.last_streak_day is null then 1
        when profile_row.last_streak_day = today then profile_row.current_streak
        when profile_row.last_streak_day = today - 1 then profile_row.current_streak + 1
        else 1
    end;

    update public.profiles
    set current_streak = next_streak,
        max_streak = greatest(max_streak, next_streak),
        last_streak_day = today
    where id = input_user_id
    returning * into profile_row;

    return profile_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. LA CONCESIÓN
-- ---------------------------------------------------------------------------

/*
 * CONCEDE LOS QUE CORRESPONDAN Y DEVUELVE LOS CONCEDIDOS, que es lo que la
 * pantalla necesita para avisar sin volver a consultar.
 *
 * El único de (user_id, achievement_key) de la 0005 es la red contra conceder
 * dos veces: el `on conflict do nothing` no devuelve fila, así que un logro
 * repetido no vuelve a avisar ni a pagar XP.
 *
 * NINGÚN LOGRO SE CONCEDE SIN ÉXITO EN LA PARTIDA cuando está atado a una, y los
 * de historial se comprueban contra `user_progress`, que escribió el servidor.
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
        earned_keys := earned_keys || ('perfect_w' || world_order || '_l' || level_row.sort_order);
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
        earned_keys := earned_keys || ('perfect_world_' || world_order);
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
        earned_keys := earned_keys || 'perfect_all';
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
            earned_keys := earned_keys || 'no_dizzy';
        end if;

        if jump_blocks is not null and jump_blocks >= 10 then
            earned_keys := earned_keys || 'trying_to_fly';
        end if;

        if program_steps is not null and program_steps = 67 then
            earned_keys := earned_keys || 'unnecessary';
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
                earned_keys := earned_keys || 'ouch_my_knees';
            end if;
        end if;
    end if;

    if coalesce(input_streak, 0) >= 3 then
        earned_keys := earned_keys || 'streak_3';
    end if;

    if coalesce(input_streak, 0) >= 7 then
        earned_keys := earned_keys || 'streak_7';
    end if;

    if coalesce(input_streak, 0) >= 30 then
        earned_keys := earned_keys || 'streak_30';
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

/*
 * LAS DOS QUE ESCRIBEN NO LAS LLAMA NADIE DESDE FUERA, y hay que decirlo con un
 * `revoke`: PostgreSQL concede `execute` a `public` por defecto, y las dos son
 * `security definer` y reciben el identificador del niño COMO PARÁMETRO. Sin
 * esto, cualquiera con sesión podría concederse los veinte logros de una
 * llamada, o regárselos a otro, y el único de la 0005 no lo impediría porque
 * conceder es justo lo que hacen.
 *
 * `submit_level_attempt` las alcanza igual: corre como su dueño.
 */
revoke all on function public.award_achievements(uuid, uuid, text, boolean, jsonb, integer) from public, anon, authenticated;
revoke all on function public.touch_streak(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. LA PARTIDA, QUE AHORA CONCEDE
-- ---------------------------------------------------------------------------

/*
 * `submit_level_attempt`, IGUAL QUE ESTABA salvo el final: cuenta el día,
 * concede los logros y los devuelve.
 *
 * SE HACE AQUÍ Y NO EN UN DISPARADOR sobre `user_progress` porque la pantalla
 * necesita saber QUÉ acaba de ganar para avisar, y con un disparador haría falta
 * una segunda consulta que correría contra el propio disparador.
 *
 * LA CONCESIÓN NO PUEDE TUMBAR LA PARTIDA. El intento y el progreso ya están
 * escritos cuando se llega aquí, así que cualquier fallo concediendo se traga y
 * la partida se devuelve igual: perder el nivel que el niño acaba de superar es
 * mucho peor que perder un logro, que se volverá a conceder en la siguiente.
 *
 * `total_xp` se lee DESPUÉS de conceder, así que incluye lo que los logros
 * acaban de pagar. Antes se leía antes, y no había diferencia porque nadie
 * concedía nada.
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

    counted_steps := public.count_program_steps(input_submitted_code::jsonb);

    attempt_score := case
        when coalesce(input_is_success, false)
        then public.score_for_steps(counted_steps, optimal_steps)
        else 0
    end;

    insert into public.level_attempts (
        user_id, level_id, submitted_code, is_success, score, runtime_ms, metadata
    )
    values (
        authenticated_user_id,
        input_level_id,
        input_submitted_code,
        coalesce(input_is_success, false),
        attempt_score,
        input_runtime_ms,
        coalesce(input_metadata, '{}'::jsonb)
    )
    returning * into created_attempt;

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

    /* De aquí abajo, nada puede llevarse por delante lo ya escrito. */
    begin
        if coalesce(input_is_success, false) then
            streak_profile := public.touch_streak(authenticated_user_id);
        else
            select * into streak_profile from public.profiles where id = authenticated_user_id;
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

-- ---------------------------------------------------------------------------
-- 8. FUERA LAS ESTRELLAS
-- ---------------------------------------------------------------------------

/*
 * La fila 22 del roadmap las incluye y el contrato §3 ya avisaba: «No mande
 * estrellas. El servidor todavía acepta un campo de estrellas por nivel, pero es
 * herencia de un diseño anterior, ninguna pantalla lo muestra y está previsto
 * retirarlo».
 *
 * MEDIDO ANTES DE BORRAR, y no es lo que parecía: de las nueve filas de progreso
 * de la cuenta de prueba, UNA tiene `stars_earned` a 2 —resto de una llamada
 * suelta a `upsert_my_progress`, la única vía que las escribió nunca— y las
 * otras ocho a cero. Los nueve niveles conceden `stars_reward` 3.
 *
 * Se borra igual, y el dato que se pierde es ese 2. Ninguna pantalla lo ha
 * mostrado jamás, no cuelga de él ninguna marca ni XP —la experiencia sale de
 * `best_score`— y el diseño del juego no tiene estrellas: conservarlo sería
 * guardar el residuo de una prueba por no haber mirado.
 *
 * `upsert_my_progress` PIERDE el parámetro, y por eso se vuelve a declarar
 * entera: dejar la firma vieja al lado dejaría dos funciones que hacen lo mismo
 * y una que sigue aceptando un dato que ya no existe.
 */
drop function if exists public.upsert_my_progress(uuid, text, integer, integer, timestamptz);

create or replace function public.upsert_my_progress(
    input_level_id uuid,
    input_completion_status text default 'in_progress',
    input_best_score integer default 0,
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
            user_id, level_id, completion_status, best_score, attempt_count,
            completed_at, last_attempt_at
        )
        values (
            authenticated_user_id,
            input_level_id,
            normalized_completion_status,
            greatest(least(coalesce(input_best_score, 0), 100), 0),
            1,
            case
                when normalized_completion_status = 'completed' then effective_attempt_at
                else null
            end,
            effective_attempt_at
        )
        returning * into saved_progress;

        previous_best := 0;
    else
        previous_best := current_progress.best_score;

        update public.user_progress
        set completion_status = case
                when current_progress.completion_status = 'completed' then 'completed'
                else normalized_completion_status
            end,
            best_score = greatest(
                current_progress.best_score,
                greatest(least(coalesce(input_best_score, 0), 100), 0)
            ),
            attempt_count = current_progress.attempt_count + 1,
            completed_at = case
                when current_progress.completed_at is not null then current_progress.completed_at
                when normalized_completion_status = 'completed' then effective_attempt_at
                else null
            end,
            last_attempt_at = effective_attempt_at
        where user_id = authenticated_user_id
          and level_id = input_level_id
        returning * into saved_progress;
    end if;

    awarded_xp := round(
        greatest(saved_progress.best_score - previous_best, 0)::numeric * level_xp / 100.0
    )::integer;

    if awarded_xp > 0 then
        update public.profiles
        set total_xp = total_xp + awarded_xp
        where id = authenticated_user_id;
    end if;

    return saved_progress;
end;
$$;

/* Una función recién creada la puede ejecutar `public`: se acota antes de conceder. */
revoke all on function public.upsert_my_progress(uuid, text, integer, timestamptz) from public, anon;
grant execute on function public.upsert_my_progress(uuid, text, integer, timestamptz) to authenticated;

alter table public.user_progress drop column if exists stars_earned;
alter table public.levels drop column if exists stars_reward;
