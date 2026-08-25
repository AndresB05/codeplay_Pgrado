create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    raw_username text;
    normalized_username text;
begin
    raw_username := coalesce(
        new.raw_user_meta_data ->> 'username',
        split_part(coalesce(new.email, ''), '@', 1)
    );

    normalized_username := nullif(
        lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g')),
        ''
    );

    insert into public.profiles (
        id,
        username,
        full_name,
        avatar_key,
        country_code
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
        coalesce(new.raw_user_meta_data ->> 'country_code', 'CO')
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();
