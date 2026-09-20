/*
 * DEVUELVE LA CONDICION QUE LA 0036 SE DEJO POR EL CAMINO.
 *
 * Al reescribir `upsert_my_progress` para quitarle las estrellas se perdio el
 * `if` que envuelve la concesion:
 *
 *     if saved_progress.completion_status = 'completed' then
 *         awarded_xp := round(...);
 *     end if;
 *
 * POR EL CAMINO NORMAL NO CAMBIABA NADA, y por eso no salto en ninguna prueba:
 * una partida fallida puntua cero, asi que `best_score` no sube y la diferencia
 * es cero de todos modos. Medido el 20-sep-2026: once partidas de prueba, todas
 * con `awarded_xp` correcto.
 *
 * Donde SI cambiaba es en la llamada directa. `upsert_my_progress` sigue
 * concedida a `authenticated` —es la unica via para escribir progreso sin
 * intento— y sin el `if` pagaba por una marca declarada con el nivel en
 * `in_progress`. El liston no baja mucho, porque declarar `completed` siempre
 * fue posible, pero era una diferencia que nadie decidio.
 *
 * Generada desde el texto de la 0033. Comparada linea a linea con aquella, la
 * UNICA diferencia son las estrellas, que ya no existen.
 */

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
            user_id,
            level_id,
            completion_status,
            best_score,
            attempt_count,
            completed_at,
            last_attempt_at
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
    else
        previous_best := current_progress.best_score;

        update public.user_progress
        set completion_status = case
                when current_progress.completion_status = 'completed' or normalized_completion_status = 'completed' then 'completed'
                else 'in_progress'
            end,
            best_score = greatest(current_progress.best_score, greatest(least(coalesce(input_best_score, 0), 100), 0)),
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
