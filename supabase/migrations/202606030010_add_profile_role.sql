alter table public.profiles
    add column if not exists role text not null default 'child';

alter table public.profiles
    drop constraint if exists profiles_role_valid;

alter table public.profiles
    add constraint profiles_role_valid check (role in ('child', 'tutor'));

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    raw_username text;
    normalized_username text;
    requested_role text;
begin
    raw_username := coalesce(
        new.raw_user_meta_data ->> 'username',
        split_part(coalesce(new.email, ''), '@', 1)
    );

    normalized_username := nullif(
        lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g')),
        ''
    );

    /*
     * El rol llega en los metadatos del registro, así que viene del navegador.
     * Un valor manipulado haría fallar el check de la columna y con él el alta
     * entera, de modo que aquí se degrada a 'child' en lugar de propagar el
     * error. El check sigue siendo la última defensa.
     */
    requested_role := new.raw_user_meta_data ->> 'role';

    if requested_role is null or requested_role not in ('child', 'tutor') then
        requested_role := 'child';
    end if;

    insert into public.profiles (
        id,
        username,
        full_name,
        avatar_key,
        country_code,
        role
    )
    values (
        new.id,
        case
            when normalized_username is null then null
            when exists (
                select 1
                from public.profiles profile_record
                where lower(profile_record.username) = normalized_username
            ) then null
            else normalized_username
        end,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        coalesce(new.raw_user_meta_data ->> 'avatar_key', 'colibri'),
        coalesce(new.raw_user_meta_data ->> 'country_code', 'CO'),
        requested_role
    );

    return new;
end;
$$;
