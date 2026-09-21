/*
 * CADA USUARIO PUEDE BORRAR SU PROPIA CUENTA desde Ajustes.
 *
 * Lo pidió el usuario para la prueba con usuarios: quien se equivoca al darse de
 * alta —rol, correo, nombre— no debe quedarse atado a una cuenta que no le sirve
 * para hacer la prueba.
 *
 * Basta con borrar la fila de `auth.users`: TODAS las tablas que cuelgan de un
 * usuario lo hacen con `on delete cascade` —perfil, progreso, intentos, logros,
 * salones del tutor con sus miembros y solicitudes, misiones cumplidas—, así que
 * no queda nada huérfano y no hay que enumerar tablas aquí que se queden viejas.
 *
 * `security definer` porque el cliente no tiene ni debe tener permiso sobre el
 * esquema `auth`. Y `auth.uid()` se lee dentro, sin parámetro: así sólo se puede
 * borrar la cuenta propia, se manipule como se manipule la llamada.
 */
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    authenticated_user_id uuid;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    delete from auth.users
    where id = authenticated_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;

grant execute on function public.delete_my_account() to authenticated;
