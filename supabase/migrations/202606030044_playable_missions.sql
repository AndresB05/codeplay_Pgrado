/*
 * LAS MISIONES SE PUEDEN CUMPLIR.
 *
 * Hasta aquí una misión se asignaba, se guardaba y se veía, pero NO SE PODÍA
 * CUMPLIR, y el panel del tutor lo decía con todas las letras: «Todos aparecen
 * en Pendiente porque todavía no hay forma de cumplir una misión». El contrato
 * §8 dejaba abierto «cómo se relacionan las misiones que un profesor asigna con
 * los niveles del juego. Hoy son dos catálogos distintos y nada los une».
 *
 * QUÉ ES UNA MISIÓN, decidido por el usuario el 20-sep-2026: un reto sobre los
 * NUEVE NIVELES QUE YA EXISTEN, con una condición que comprueba el servidor
 * leyendo el historial del propio niño. No hay puzles nuevos, así que se puede
 * cumplir el mismo día.
 *
 * SON CUATRO Y NO MÁS, también por decisión suya: pocas y cumplibles de punta a
 * punta en la prueba preliminar, en vez de un catálogo grande a medio funcionar.
 * Ampliarlo es insertar filas aquí y añadir una rama en `award_missions`.
 *
 * LO QUE ESTA MIGRACIÓN APROVECHA Y NO REINVENTA:
 *   - `mission_assignments` existe desde la 0020, colgando del SALÓN, con su
 *     único por (group_id, mission_key). Lo que le faltaba era una tabla a la
 *     que apuntar: la propia 0020 lo dejó escrito como provisional.
 *   - `achievements` no tiene `grant insert` para nadie y por eso
 *     `award_achievements` es `security definer`. `mission_completions` nace con
 *     la misma puerta y por el mismo motivo.
 *   - `submit_level_attempt` ya concede logros y racha en dos bloques
 *     `begin … exception` SEPARADOS. Las misiones entran como un tercero, nunca
 *     dentro de los otros: compartir el `exception` haría que un fallo
 *     concediendo una misión revirtiera los logros ya escritos.
 *
 * POR QUÉ TABLA PROPIA Y NO `achievements`: su `unique (user_id,
 * achievement_key)` significa «una vez en la vida» y una misión es
 * REASIGNABLE —`mission_assignments` ya declara `unique (group_id, mission_key)`
 * porque la misma misión en dos salones es lo normal—. Misma maquinaria de
 * concesión, cardinalidad distinta. Lo pedía el contrato.
 */

-- ---------------------------------------------------------------------------
-- 1. EL CATÁLOGO, EN LA BASE Y NO EN EL CLIENTE
-- ---------------------------------------------------------------------------

/*
 * Vivía en `teacher/classroomsData.ts`, cinco entradas de TypeScript, y
 * `mission_assignments.mission_key` era texto suelto contra él. Es exactamente
 * el problema que el paso 22 resolvió para los logros con `achievement_catalog`,
 * y el motivo es el mismo: con una lista en SQL para conceder y otra en
 * TypeScript para pintar, las dos se separan en cuanto alguien toque una.
 */
create table if not exists public.mission_catalog (
    mission_key text primary key,
    title text not null,
    description text not null,
    difficulty_label text not null
        check (difficulty_label in ('Fácil', 'Intermedio', 'Difícil')),
    awarded_xp integer not null default 0 check (awarded_xp >= 0),
    sort_order integer not null default 0,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.mission_catalog enable row level security;

/*
 * El catálogo es contenido, como `worlds` y `levels`, y se lee entero: el tutor
 * necesita la lista para elegir qué asignar y el niño para leer la tarjeta de lo
 * asignado. No es secreto y no lleva dentro ninguna condición que revelar — las
 * condiciones viven en `award_missions`, igual que las de los logros.
 */
drop policy if exists mission_catalog_read_all on public.mission_catalog;
create policy mission_catalog_read_all
on public.mission_catalog
for select
to authenticated
using (true);

revoke all on public.mission_catalog from public;
revoke all on public.mission_catalog from anon;
grant select on public.mission_catalog to authenticated;

/*
 * LAS CUATRO.
 *
 * Tres piden SUPERAR los tres niveles de un mundo, y ahí está la raya que las
 * separa de los logros: `perfect_world_N` exige los tres AL 100, la misión
 * exige terminarlos. Un niño puede cumplir la misión sin tener el logro, que es
 * lo que las hace servir de tarea.
 *
 * LA CLAVE DE UNA MISIÓN DE MUNDO LLEVA EL ORDEN, NO EL UUID: `clear_world_2` es
 * el segundo mundo. Misma regla que `perfect_w2_l3` y por el mismo motivo — los
 * identificadores de la siembra no son los mismos en otro proyecto de Supabase,
 * y renombrar un mundo no toca ninguna clave, como acaba de comprobar la 0043.
 *
 * Se descartó una quinta —«supera tres niveles en el primer intento»— por ser la
 * única que necesitaba una subconsulta correlacionada sobre `min(created_at)`, y
 * porque dos intentos con la misma marca al milisegundo la habrían concedido de
 * más.
 */
insert into public.mission_catalog (
    mission_key, title, description, difficulty_label, awarded_xp, sort_order
)
values
    ('clear_world_1', 'Recorre el Sendero',
     'Supera los tres niveles del Sendero de los Patrones. No hace falta la marca máxima: basta con llegar a la meta en los tres.',
     'Fácil', 300, 1),
    ('clear_world_2', 'Cruza la Cordillera',
     'Supera los tres niveles de la Cordillera de la Abstracción, subidas incluidas.',
     'Intermedio', 400, 2),
    ('clear_world_3', 'Resuelve la Encrucijada',
     'Supera los tres niveles de la Encrucijada de las Decisiones, donde los pasos están contados.',
     'Difícil', 500, 3),
    ('flawless_3', 'Ni un paso de más',
     'Consigue 100 de 100 en tres niveles cualesquiera: resuélvelos con el número de pasos justo.',
     'Intermedio', 400, 4)
on conflict (mission_key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. LA ASIGNACIÓN POR FIN APUNTA A ALGO
-- ---------------------------------------------------------------------------

/*
 * La 0020 dejó `mission_key` como texto sin clave ajena y escribió por qué: «el
 * catálogo de misiones vive hoy en el cliente y no existe ninguna tabla a la que
 * apuntar. Es provisional y se cierra cuando el catálogo tenga tabla propia».
 * Ya la tiene.
 *
 * EL `delete` VA ANTES DEL `alter table`, o la clave ajena falla con las filas
 * que ya hubiera. Medido el 20-sep-2026: `mission_assignments` está VACÍA en la
 * base real, así que no se lleva nada por delante; se escribe igual porque en
 * otro proyecto de Supabase sí podría haber claves viejas (`m1`…`m5`).
 */
delete from public.mission_assignments
where mission_key not in (select mission_key from public.mission_catalog);

alter table public.mission_assignments
    drop constraint if exists mission_assignments_mission_key_fkey;

alter table public.mission_assignments
    add constraint mission_assignments_mission_key_fkey
    foreign key (mission_key)
    references public.mission_catalog (mission_key)
    on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. EL CUMPLIMIENTO, QUE SE GUARDA Y NO SE CALCULA
-- ---------------------------------------------------------------------------

/*
 * EL ÚNICO ES (user_id, mission_key), y es lo que hace cumplir la decisión del
 * usuario: UNA MISIÓN PAGA UNA SOLA VEZ EN LA VIDA. Reasignársela en otro salón
 * la enseña ya cumplida y no vuelve a pagar.
 *
 * `group_id` SE GUARDA, NO SE DERIVA. Lo exige el contrato: un niño que cambie
 * de salón haría desaparecer lo cumplido de los informes de su antiguo profesor
 * si el salón saliera de dónde está ahora.
 *
 * `awarded_xp` se copia al conceder, como en `achievements`: es lo que de verdad
 * se pagó, y cambiar el premio del catálogo no debe reescribir la cuenta de
 * quien ya cobró.
 */
create table if not exists public.mission_completions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    mission_key text not null references public.mission_catalog (mission_key) on delete cascade,
    group_id uuid not null references public.class_groups (id) on delete cascade,
    awarded_xp integer not null default 0 check (awarded_xp >= 0),
    completed_at timestamptz not null default timezone('utc', now()),
    constraint mission_completions_user_mission_unique unique (user_id, mission_key)
);

/*
 * El único ya crea el índice por (user_id, mission_key), que es como se consulta
 * desde el niño. El del tutor va por salón, y ése sí hace falta.
 */
create index if not exists mission_completions_group_id_idx
    on public.mission_completions (group_id);

alter table public.mission_completions enable row level security;

/*
 * TRES RAMAS, y cada una está por algo:
 *
 *   1. El propio niño, que ve lo suyo.
 *   2. El tutor del salón DONDE SE CUMPLIÓ. Es la rama que conserva los informes
 *      del tutor anterior cuando el niño se cambia.
 *   3. El tutor del salón DONDE EL NIÑO ESTÁ AHORA. Sin ella, un niño que
 *      cumplió la misión en otro salón le saldría «Pendiente» para siempre, y
 *      eso sería falso: no puede volver a cumplirla, el único se lo impide.
 *
 * ANÁLISIS DE CICLOS, DESDE LA ESCRITURA Y DESDE LA LECTURA (ROADMAP §1.3.5).
 * Desde la escritura es trivial: NO HAY política de escritura, porque no hay
 * `grant` que la active, y `security definer` no expande políticas. Desde la
 * lectura, esto consulta `class_groups` —que se lee con `using (true)` y ahí
 * termina el recorrido— y `class_memberships`, cuyas políticas no miran esta
 * tabla. Es el mismo grafo que ya recorre `mission_assignments_select_related`.
 */
drop policy if exists mission_completions_select_related on public.mission_completions;
create policy mission_completions_select_related
on public.mission_completions
for select
to authenticated
using (
    mission_completions.user_id = auth.uid()
    or exists (
        select 1
        from public.class_groups as group_record
        where group_record.id = mission_completions.group_id
          and group_record.tutor_id = auth.uid()
    )
    or exists (
        select 1
        from public.class_memberships as membership_record
        inner join public.class_groups as group_record
            on group_record.id = membership_record.group_id
        where membership_record.student_id = mission_completions.user_id
          and group_record.tutor_id = auth.uid()
    )
);

/*
 * Sin `insert`, `update` ni `delete` para nadie: la única puerta es una función
 * `security definer`, igual que en `achievements`. No es preferencia de diseño,
 * es lo que impide que el cliente se regale una misión y su XP.
 */
revoke all on public.mission_completions from public;
revoke all on public.mission_completions from anon;
grant select on public.mission_completions to authenticated;

-- ---------------------------------------------------------------------------
-- 4. LA CONCESIÓN
-- ---------------------------------------------------------------------------

/*
 * EVALÚA LAS MISIONES DEL SALÓN DEL NIÑO Y CONCEDE LAS QUE CUMPLA.
 *
 * La condición de cada misión vive AQUÍ y no en una columna `jsonb` del
 * catálogo, por lo mismo que las de los logros: un intérprete de condiciones
 * sería más código que las cuatro condiciones que tendría que interpretar, y el
 * catálogo se lee entero con cualquier sesión, así que una condición ahí dentro
 * sería pública.
 *
 * SÓLO SE MIRAN LAS ASIGNADAS AL SALÓN DEL NIÑO. Una misión que su tutor no le
 * puso no existe para él, que es la regla del modelo desde la 0020.
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
        where not exists (
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
 * Revocada para todos, como `award_achievements` y `touch_streak`: nadie la
 * llama desde fuera. Sus dos llamadores son funciones `security definer` de este
 * mismo esquema.
 */
revoke all on function public.award_missions(uuid) from public, anon, authenticated;

/*
 * ASIGNAR UNA MISIÓN A VARIOS SALONES, Y PONER AL DÍA A QUIEN YA LA CUMPLÍA.
 *
 * POR QUÉ DEJA DE SER UN `upsert` DE POSTGREST: la puesta al día escribe en
 * filas de OTROS usuarios —`mission_completions` y `profiles.total_xp` de sus
 * alumnos—, y eso el rol del tutor no lo puede hacer por ninguna vía directa.
 *
 * Y POR QUÉ SE PONE AL DÍA: sin esto, un salón donde varios ya terminaron el
 * mundo 1 saldría entero en «Pendiente» hasta que cada uno volviera a jugar —que
 * es exactamente el síntoma que este cambio viene a quitar, y que el tutor sí
 * tiene delante, al contrario que el desfase equivalente de los logros—.
 *
 * LA GARANTÍA SE MUEVE DE LA POLÍTICA A LA FUNCIÓN, y hay que escribirla dentro:
 * `security definer` NO expande las políticas de `mission_assignments`, así que
 * el `with check` de la 0020 no protege nada aquí. Se comprueba a mano que
 * TODOS los salones del argumento son de quien llama.
 *
 * QUEDA UN DESFASE QUE NO SE CIERRA: un niño que ENTRA al salón después de que
 * la misión se asignara, y que ya cumplía la condición, la verá cumplida en su
 * siguiente partida y no antes. Cerrarlo pide evaluar al aceptar una solicitud
 * de ingreso, que es otra superficie.
 */
create or replace function public.assign_mission_to_groups(
    input_group_ids uuid[],
    input_mission_key text
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
     * `on conflict do nothing` y no calcular el subconjunto: con «Todos»
     * elegido se mandan también los salones que ya la tienen, y así no hay que
     * decidir cuáles con estado que puede estar viejo.
     */
    with inserted as (
        insert into public.mission_assignments (group_id, mission_key, assigned_by)
        select requested.group_id, input_mission_key, authenticated_user_id
        from unnest(input_group_ids) as requested(group_id)
        on conflict (group_id, mission_key) do nothing
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

revoke all on function public.assign_mission_to_groups(uuid[], text) from public, anon;
grant execute on function public.assign_mission_to_groups(uuid[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. LA PARTIDA, QUE AHORA TAMBIÉN CUMPLE MISIONES
-- ---------------------------------------------------------------------------

/*
 * GENERADA DESDE EL TEXTO DE LA 0040, no de memoria, y diffeada contra él antes
 * de aplicar. Es la primera de las tres lecciones que costaron seis migraciones
 * el 20-sep-2026 (CONTEXT.md §2.11): la 0038 arregló dos diferencias que estaban
 * a la vista en un diff de treinta líneas.
 *
 * El diff contra la 0040 enseña cuatro cosas y ninguna más: las dos variables
 * nuevas, el bloque de misiones, las dos claves nuevas de la respuesta, y una
 * línea de comentario que decía «lo que los logros acaban de pagar» y ahora
 * nombra también las misiones.
 *
 * La firma no cambia, así que `create or replace` conserva los `grant` que le
 * puso la 0033.
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
    award_error text;
    completed_missions jsonb := '[]'::jsonb;
    missions_error text;
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

    /*
     * LAS MISIONES, EN SU PROPIO BLOQUE. No comparte el `exception` con los
     * logros a proposito: el `exception when others` abre una subtransaccion, y
     * compartirlo haria que un fallo concediendo una mision revirtiera los
     * logros que el bloque de arriba ya escribio. Es la misma trampa que la 0040
     * pago con la racha.
     *
     * Va DESPUES de los logros y ANTES de leer el total, porque las misiones
     * tambien pagan XP y el total que se devuelve tiene que incluirlas.
     */
    begin
        completed_missions := public.award_missions(authenticated_user_id);
    exception
        when others then
            completed_missions := '[]'::jsonb;
            missions_error := sqlstate || ' ' || sqlerrm;
    end;

    /* DESPUES de conceder, para que incluya lo que los logros y las misiones acaban de pagar. */
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
        'completed_missions', completed_missions,
        'missions_error', missions_error,
        'streak', jsonb_build_object(
            'current', coalesce(streak_profile.current_streak, 0),
            'max', coalesce(streak_profile.max_streak, 0),
            'last_day', streak_profile.last_streak_day
        )
    );
end;
$$;

