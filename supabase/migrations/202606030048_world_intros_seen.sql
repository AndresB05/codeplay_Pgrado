/*
 * QUÉ EXPLICACIONES DE MUNDO HA VISTO CADA NIÑO, para que Leo no salga dos veces.
 *
 * Se guarda por cuenta y no en el navegador porque los equipos del aula son
 * compartidos: con `localStorage`, el segundo niño que se sentara en un equipo
 * no vería la explicación.
 *
 * Va en `profiles` y no en una tabla aparte porque es un dato por persona,
 * pequeño, y la lectura ya la cubre `profiles_select_own`. Por id de mundo y no
 * por slug: la 0043 renombró los slugs.
 */
alter table public.profiles
    add column if not exists seen_world_intros uuid[] not null default '{}';

/*
 * El cliente no puede escribir `profiles` —la 0009 le revocó el `update`—, así
 * que se anota por aquí, sólo en la fila propia, como `touch_last_seen` en la
 * 0046. Se llama al CERRAR la explicación, y por eso no devuelve si era la
 * primera vez: con `React.StrictMode` la pregunta se haría dos veces.
 */
create or replace function public.mark_world_intro_seen(input_world_id uuid)
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

    if not exists (
        select 1
        from public.worlds
        where id = input_world_id
    ) then
        raise exception 'World not found'
            using errcode = 'P0002';
    end if;

    update public.profiles
    set seen_world_intros = array_append(seen_world_intros, input_world_id)
    where id = auth.uid()
      and not (input_world_id = any(seen_world_intros));
end;
$$;

revoke all on function public.mark_world_intro_seen(uuid) from public, anon;

grant execute on function public.mark_world_intro_seen(uuid) to authenticated;
