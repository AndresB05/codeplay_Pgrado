/*
 * LA ÚLTIMA ACTIVIDAD CUENTA TAMBIÉN ENTRAR A LA PÁGINA, no sólo jugar.
 *
 * Lo pidió el usuario para la prueba: hasta ahora la columna del roster salía
 * de `user_progress.last_attempt_at`, y un niño que entraba a mirar sus trofeos
 * o su salón seguía apareciendo como «sin actividad».
 *
 * Va en `profiles` y no en una tabla aparte porque es un dato por persona y el
 * roster ya lee de ahí. El cliente no puede escribir `profiles` —la 0009 le
 * revocó el `update`, para que nadie se ponga XP a mano—, así que se toca por
 * una función que sólo alcanza a la fila propia.
 */
alter table public.profiles
    add column if not exists last_seen_at timestamptz;

/*
 * El minuto de margen es para la base, no para la precisión: el cliente llama
 * al entrar, al volver a la pestaña y cada pocos minutos, y sin él cada llamada
 * sería una escritura —y un disparo de `handle_profiles_updated_at`—.
 */
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    update public.profiles
    set last_seen_at = now()
    where id = auth.uid()
      and (last_seen_at is null or last_seen_at < now() - interval '1 minute');
end;
$$;

revoke all on function public.touch_last_seen() from public, anon;

grant execute on function public.touch_last_seen() to authenticated;

/*
 * Una columna más al final de la vista: `create or replace view` sólo admite
 * añadir columnas detrás de las que ya tiene. Ni tabla, ni política, ni `grant`
 * nuevo, y el filtro de a quién alcanza no se toca.
 */
create or replace view public.classroom_roster as
select
    membership_record.group_id,
    membership_record.student_id,
    membership_record.joined_at,
    profile_record.full_name,
    profile_record.avatar_key,
    profile_record.total_xp,
    profile_record.current_streak,
    profile_record.last_streak_day,
    profile_record.last_seen_at
from public.class_memberships as membership_record
inner join public.profiles as profile_record
    on profile_record.id = membership_record.student_id
where
    /*
     * IDÉNTICO A LA 0037, que lo copió literal de la 0015: `create or replace
     * view` sustituye la vista entera, así que este `where` es el que queda y
     * cualquier rama de más aquí amplía en silencio quién ve el roster de quién.
     */
    exists (
        select 1
        from public.class_groups as group_record
        where group_record.id = membership_record.group_id
          and group_record.tutor_id = auth.uid()
    )
    or exists (
        select 1
        from public.class_memberships as viewer_record
        where viewer_record.group_id = membership_record.group_id
          and viewer_record.student_id = auth.uid()
    );
