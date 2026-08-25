do $$
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('child', 'tutor');
    end if;
end
$$;

/*
 * El check sobra: el enum ya restringe el dominio, y mantener los dos obliga a
 * tocar dos sitios para añadir un valor. Se retira para dejar una sola fuente.
 *
 * Va ANTES de la conversión, no después: ALTER COLUMN TYPE revalida los
 * constraints que mencionan la columna, y éste la compara con literales de
 * texto. Con el check todavía vivo, PostgreSQL intenta evaluar
 * `user_role = text`, que no existe, y la migración aborta con 42883.
 */
alter table public.profiles
    drop constraint if exists profiles_role_valid;

/*
 * El cambio de tipo tampoco cabe en una sola sentencia: el default 'child' es
 * un literal text y PostgreSQL no lo convierte solo. Hay que retirarlo, alterar
 * la columna con USING, y volver a ponerlo ya tipado.
 */
alter table public.profiles
    alter column role drop default;

alter table public.profiles
    alter column role type public.user_role
    using role::public.user_role;

alter table public.profiles
    alter column role set default 'child'::public.user_role;

/*
 * La función se recompila contra el tipo nuevo. El cuerpo es el mismo de la
 * migración 0010; sólo cambia el tipo de `requested_role`, que ya no puede ser
 * un text cualquiera.
 */
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    raw_username text;
    normalized_username text;
    raw_role text;
    requested_role public.user_role;
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
     * Un valor manipulado reventaría la conversión al enum y con ella el alta
     * entera, de modo que aquí se degrada a 'child' en lugar de propagar el
     * error. El tipo sigue siendo la última defensa.
     */
    raw_role := new.raw_user_meta_data ->> 'role';

    if raw_role is null or raw_role not in ('child', 'tutor') then
        requested_role := 'child'::public.user_role;
    else
        requested_role := raw_role::public.user_role;
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
