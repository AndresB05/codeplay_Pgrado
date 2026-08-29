/*
 * Fija el rol del perfil DESPUÉS del alta, que es lo único que sirve cuando el
 * alta no pudo declararlo: `signInWithOAuth` no admite metadatos, así que una
 * cuenta creada con Google nace 'child' por el disparador de la 0011 aunque
 * quien se registró hubiera elegido «Tutor».
 *
 * Tiene que ser una función `security definer` porque la 0009 revoca
 * `insert, update, delete` sobre `profiles` a `anon` y `authenticated`, y esa
 * tabla no tiene ninguna política de `update`: el cliente no puede escribir su
 * propio rol por ninguna vía directa, y así se queda.
 *
 * `security definer` además no expande políticas —es lo que la 0014 usó para
 * romper la recursión de `join_requests`—, de modo que este `update` no vuelve a
 * evaluar las políticas de `profiles` y no hay ciclo que analizar.
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
    updated_profile public.profiles;
begin
    /*
     * `auth.uid()` se lee aquí dentro y NO es parámetro: es lo que hace
     * imposible fijar el rol de otra persona por mucho que se manipule la
     * llamada desde el navegador.
     */
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    /*
     * El parámetro es `text` y no `public.user_role` a propósito. Con el enum,
     * un valor inválido muere en la conversión que hace PostgREST antes de
     * entrar aquí, y el error que llega no dice qué se esperaba. Con `text` el
     * rechazo es explícito, como el del nombre de usuario en `update_my_profile`.
     * El enum sigue siendo la última defensa, igual que en el disparador.
     */
    if input_role is null or input_role not in ('child', 'tutor') then
        raise exception 'Role must be either child or tutor'
            using errcode = '22023';
    end if;

    requested_role := input_role::public.user_role;

    update public.profiles
    set role = requested_role
    where id = authenticated_user_id
    returning * into updated_profile;

    if not found then
        raise exception 'Profile not found'
            using errcode = 'P0002';
    end if;

    return updated_profile;
end;
$$;

/*
 * Revocar de `public` no basta: no retira lo concedido directamente a un rol, y
 * eso ya se anotó a cuenta de la 0009. Por eso `anon` va aparte.
 */
revoke all on function public.set_my_role(text) from public, anon;

grant execute on function public.set_my_role(text) to authenticated;
