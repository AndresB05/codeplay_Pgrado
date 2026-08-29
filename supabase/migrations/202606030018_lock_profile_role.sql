/*
 * Cierra el cambio de rol después del alta, que la 0017 dejaba abierto.
 *
 * Lo que se midió y motiva esta migración: Supabase ENLAZA identidades por
 * correo verificado, así que entrar con Google con el correo de una cuenta que
 * ya existe NO crea usuario —le añade el proveedor— y el disparador no corre.
 * Sin nada que lo impida, `set_my_role` alcanzaba a esa cuenta: un niño con
 * membresía que entró desde /signup eligiendo «Tutor» quedó `tutor`, fuera de su
 * propio salón y sin vuelta atrás por la interfaz, mientras su tutor lo seguía
 * viendo listado como alumno.
 *
 * El rol es la reja de dos políticas de la 0013 —`class_groups_insert_own` exige
 * `tutor`, `join_requests_insert_own` exige `child`—, y por eso cambiarlo no es
 * editar un campo: es dejar una cuenta sin sitio.
 *
 * La 0017 no se corrige en el sitio, se reemplaza desde aquí, igual que la 0014
 * hizo con la 0013: tocar una migración ya aplicada dejaría el repositorio
 * describiendo un esquema que ninguna base ha tenido.
 */

/*
 * El dato que faltaba no era el rol —ése ya estaba— sino si ALGUIEN LLEGÓ A
 * ELEGIRLO. Un alta con contraseña lo declara en sus metadatos; una con Google
 * no puede.
 */
alter table public.profiles
    add column if not exists is_role_declared boolean not null default false;

/*
 * Backfill. Sin esto, todas las cuentas anteriores a esta migración seguirían
 * teniendo el rol sin declarar, y por tanto seguirían siendo ascendibles: es
 * decir, el agujero quedaría abierto justo para las cuentas que ya existen.
 *
 * Congela el rol que cada fila tenga AHORA, así que las filas que hayan quedado
 * con el rol estropeado se borran antes de aplicar esta migración, no después.
 */
update public.profiles
set is_role_declared = true
where is_role_declared = false;

/*
 * Mismo cuerpo que la 0011, con una sola diferencia: además del rol se registra
 * si venía declarado. Un valor manipulado sigue degradándose a 'child' sin
 * abortar el alta, y cuenta como NO declarado — quien mandó basura no eligió, y
 * dejarlo abierto le permite corregirse una vez.
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

    normalized_username := nullif(
        lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g')),
        ''
    );

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

/*
 * `set_my_role`, con dos rejas en vez de ninguna.
 *
 * La marca sola no bastaba: una cuenta nacida del botón de Google de /login
 * queda 'child' y sin declarar PARA SIEMPRE, así que un cambio de rol podría
 * alcanzarla meses después, cuando ya estuviera dentro de un salón. Por eso la
 * segunda condición mira los lazos: la marca corta a quien YA ELIGIÓ, y los
 * lazos cortan a quien YA CONSTRUYÓ algo con el rol que tiene.
 *
 * Una cuenta recién creada no tiene ninguno de los tres lazos, de modo que la
 * primera declaración legítima sigue funcionando. La reja sólo muerde cuando el
 * cambio rompería algo.
 *
 * Consultar esas tres tablas desde aquí no abre ningún ciclo de RLS: el cuerpo
 * corre con los privilegios del dueño y no expande políticas, que es lo mismo
 * que la 0014 aprovechó para romper la recursión de `join_requests`.
 *
 * Los dos rechazos llevan códigos distintos. La clase `ZC` cae en el tramo I-Z
 * que el estándar deja a la implementación, y no es ninguna de las dos que
 * PostgreSQL ocupa (`P0` de PL/pgSQL y `XX` de internal).
 */
create or replace function public.set_my_role(
    input_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    requested_role public.user_role;
    already_declared boolean;
    updated_profile public.profiles;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    if input_role is null or input_role not in ('child', 'tutor') then
        raise exception 'Role must be either child or tutor'
            using errcode = '22023';
    end if;

    requested_role := input_role::public.user_role;

    select is_role_declared
    into already_declared
    from public.profiles
    where id = authenticated_user_id;

    if not found then
        raise exception 'Profile not found'
            using errcode = 'P0002';
    end if;

    if already_declared then
        raise exception 'Role was already declared for this profile'
            using errcode = 'ZC001';
    end if;

    if exists (
        select 1
        from public.class_memberships membership_record
        where membership_record.student_id = authenticated_user_id
    ) or exists (
        select 1
        from public.join_requests request_record
        where request_record.student_id = authenticated_user_id
          and request_record.status = 'pending'
    ) or exists (
        select 1
        from public.class_groups group_record
        where group_record.tutor_id = authenticated_user_id
    ) then
        raise exception 'Role cannot change once the profile belongs to a classroom'
            using errcode = 'ZC002';
    end if;

    /*
     * El rol y la marca se escriben en la MISMA sentencia: si fueran dos, entre
     * ellas habría un instante con el rol ya cambiado y todavía sin bloquear.
     */
    update public.profiles
    set role = requested_role,
        is_role_declared = true
    where id = authenticated_user_id
    returning * into updated_profile;

    return updated_profile;
end;
$$;

revoke all on function public.set_my_role(text) from public, anon;

grant execute on function public.set_my_role(text) to authenticated;
