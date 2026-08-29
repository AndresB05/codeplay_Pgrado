/*
 * El nombre de usuario derivado del correo abortaba el alta entera.
 *
 * Lo que se midió: `202606030002` exige `username ~ '^[a-z0-9_]{3,30}$'`, y
 * `handle_new_user_profile` sólo convertía a `null` la cadena VACÍA. Nada acotaba
 * el mínimo de 3 ni el máximo de 30, así que un correo como `ab@gmail.com` —o uno
 * con más de 30 caracteres antes de la arroba— reventaba el `insert` y Supabase
 * respondía «Database error saving new user», sin decir una palabra del nombre de
 * usuario. Afectaba al registro con contraseña igual que al de Google.
 *
 * Quien cede es la derivación, no el formato: el `check` de la 0002 se queda
 * intacto porque el formato es del dominio y lo consumirá cualquier pantalla de
 * perfil futura. Un nombre que no encaja se descarta a `null`, que es lo que la
 * propia función ya hacía con el duplicado.
 *
 * Truncar a 30 o rellenar los cortos habría inventado un nombre que nadie eligió
 * y que además podría chocar con otro, reintroduciendo el fallo por la puerta del
 * duplicado.
 *
 * La 0018 no se corrige en su sitio, se reemplaza desde aquí: tocar una migración
 * ya aplicada dejaría el repositorio describiendo un esquema que ninguna base ha
 * tenido. Mismo cuerpo que la 0018 con una sola diferencia, la derivación.
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
    role_was_declared boolean;
begin
    raw_username := coalesce(
        new.raw_user_meta_data ->> 'username',
        split_part(coalesce(new.email, ''), '@', 1)
    );

    normalized_username := lower(
        regexp_replace(coalesce(raw_username, ''), '[^a-zA-Z0-9_]', '', 'g')
    );

    /*
     * La misma expresión del `check` de la 0002, no un recuento de caracteres:
     * dos formas de escribir la condición acabarían divergiendo. Se comprueba
     * DESPUÉS de normalizar, que es donde está la trampa —`a.b@x.com` normaliza
     * a `ab`, que son 2— y también descarta la cadena vacía, así que el `nullif`
     * que había aquí sobra.
     */
    if normalized_username !~ '^[a-z0-9_]{3,30}$' then
        normalized_username := null;
    end if;

    raw_role := new.raw_user_meta_data ->> 'role';

    if raw_role is null or raw_role not in ('child', 'tutor') then
        requested_role := 'child'::public.user_role;
        role_was_declared := false;
    else
        requested_role := raw_role::public.user_role;
        role_was_declared := true;
    end if;

    insert into public.profiles (
        id,
        username,
        full_name,
        avatar_key,
        country_code,
        role,
        is_role_declared
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
        requested_role,
        role_was_declared
    );

    return new;
end;
$$;
