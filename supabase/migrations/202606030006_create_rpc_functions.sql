create or replace function public.update_my_profile(
    input_username text default null,
    input_full_name text default null,
    input_avatar_key text default null,
    input_country_code text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    normalized_username text;
    updated_profile public.profiles;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    if input_username is not null then
        normalized_username := nullif(
            lower(regexp_replace(trim(input_username), '[^a-zA-Z0-9_]', '', 'g')),
            ''
        );

        if normalized_username is null or normalized_username !~ '^[a-z0-9_]{3,30}$' then
            raise exception 'Username must be 3 to 30 characters and use only lowercase letters, numbers, or underscores'
                using errcode = '22023';
        end if;
    end if;

    update public.profiles
    set username = coalesce(normalized_username, username),
        full_name = coalesce(input_full_name, full_name),
        avatar_key = coalesce(input_avatar_key, avatar_key),
        country_code = coalesce(input_country_code, country_code)
    where id = authenticated_user_id
    returning * into updated_profile;

    if not found then
        raise exception 'Profile not found'
            using errcode = 'P0002';
    end if;

    return updated_profile;
end;
$$;

create or replace function public.create_level_attempt(
    input_level_id uuid,
    input_submitted_code text,
    input_is_success boolean default false,
    input_score integer default 0,
    input_runtime_ms integer default null,
    input_metadata jsonb default '{}'::jsonb
)
returns public.level_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    created_attempt public.level_attempts;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    if not exists (
        select 1
        from public.levels
        where id = input_level_id
          and is_published = true
    ) then
        raise exception 'Level not found or unavailable'
            using errcode = 'P0002';
    end if;

    insert into public.level_attempts (
        user_id,
        level_id,
        submitted_code,
        is_success,
        score,
        runtime_ms,
        metadata
    )
    values (
        authenticated_user_id,
        input_level_id,
        input_submitted_code,
        coalesce(input_is_success, false),
        greatest(least(coalesce(input_score, 0), 100), 0),
        input_runtime_ms,
        coalesce(input_metadata, '{}'::jsonb)
    )
    returning * into created_attempt;

    return created_attempt;
end;
$$;

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
    should_award_xp boolean := false;
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

        should_award_xp := normalized_completion_status = 'completed';
    else
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

        should_award_xp := current_progress.completion_status <> 'completed'
            and normalized_completion_status = 'completed';
    end if;

    if should_award_xp then
        update public.profiles
        set total_xp = total_xp + level_xp
        where id = authenticated_user_id;
    end if;

    return saved_progress;
end;
$$;

revoke all on function public.update_my_profile(text, text, text, text) from public, anon;
revoke all on function public.create_level_attempt(uuid, text, boolean, integer, integer, jsonb) from public, anon;
revoke all on function public.upsert_my_progress(uuid, text, integer, integer, timestamptz) from public, anon;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;
grant execute on function public.create_level_attempt(uuid, text, boolean, integer, integer, jsonb) to authenticated;
grant execute on function public.upsert_my_progress(uuid, text, integer, integer, timestamptz) to authenticated;
