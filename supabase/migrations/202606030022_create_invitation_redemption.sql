/*
 * El canje de una invitación, que es lo que la tabla `invitations` lleva
 * esperando desde la 0013 sin recibir una sola escritura.
 *
 * POR QUÉ TIENE QUE SER UNA FUNCIÓN Y NO ESCRITURAS DEL CLIENTE. Los permisos
 * que la 0013 le dio a `invitations` son tres muros, y ninguno se toca aquí:
 *
 *   1. Sus tres políticas —`select`, `insert` y `delete`— son del TUTOR del
 *      salón, así que quien tiene el token no puede ni leer su propia fila.
 *   2. El grant es `select, insert, delete` SIN `update`: nadie, tutor
 *      incluido, puede marcarla aceptada desde el cliente.
 *   3. `class_memberships` no tiene política de inserción, y no la va a tener.
 *
 * Con esos tres, el canje no se puede componer desde el navegador ni aunque se
 * quiera. NO hacen falta Edge Functions —un runtime nuevo, un despliegue aparte
 * y una clave de servicio que este proyecto no tiene— para hacer lo que una
 * función `security definer` ya hace tres veces en este esquema.
 *
 * ESTA MIGRACIÓN NO CREA NI ALTERA NINGUNA TABLA, NINGUNA POLÍTICA Y NINGÚN
 * GRANT DE TABLA. El grafo de RLS verificado en la 0013 y la 0014 queda
 * exactamente como estaba, y `accept_join_request` no se toca: el canje es una
 * función aparte que copia su forma, no una generalización de las dos.
 */

/*
 * `set search_path = public` NO es decoración heredada de copiar el modelo. Sin
 * esa línea, quien llama puede anteponer un esquema propio a su search_path y
 * hacer que `profiles`, `class_groups`, `class_memberships` y `join_requests`
 * resuelvan a TABLAS SUYAS mientras el cuerpo corre con los privilegios del
 * dueño de la función: la comprobación de rol y la de pertenencia se esquivarían
 * las dos, y la pertenencia acabaría insertada en la tabla real con las
 * condiciones comprobadas contra una falsa. Las nueve funciones `security
 * definer` de estas migraciones la llevan, sin una sola excepción.
 */
create or replace function public.redeem_invitation(input_token text)
returns public.class_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    invitation_record public.invitations;
    group_capacity integer;
    current_members integer;
    created_membership public.class_memberships;
begin
    /*
     * Se lee aquí dentro y NO es parámetro, igual que en `set_my_role`: es lo
     * que hace imposible canjear en nombre de otra persona por mucho que se
     * manipule la llamada desde el navegador.
     */
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    /*
     * El rol se comprueba aquí y no por política porque aquí no hay ninguna que
     * lo haga: la inserción en `class_memberships` no pasa por RLS al correr
     * como definer. Un `tutor` que abre un enlace se queda fuera, y desde la
     * 0018 no puede cambiarse el rol para entrar.
     */
    if not exists (
        select 1
        from public.profiles profile_record
        where profile_record.id = authenticated_user_id
          and profile_record.role = 'child'
    ) then
        raise exception 'Only a child account can redeem an invitation'
            using errcode = '42501';
    end if;

    /*
     * La invitación se bloquea antes de mirarla. Un enlace es de un solo uso, y
     * sin el bloqueo dos canjes simultáneos del MISMO token la encuentran los
     * dos en `pending` y los dos inscriben a dos niños distintos, que es la
     * misma carrera del cupo por otra puerta.
     *
     * El orden de bloqueo es siempre invitación y después salón. Nadie lo toma
     * al revés: `accept_join_request` sólo bloquea el salón.
     */
    select * into invitation_record
    from public.invitations
    where token = input_token
    for update;

    if not found then
        raise exception 'Invitation not found'
            using errcode = 'ZC010';
    end if;

    if invitation_record.status = 'accepted' then
        raise exception 'Invitation already redeemed'
            using errcode = 'ZC012';
    end if;

    /*
     * La caducidad la impone la FECHA, no la columna. `status` admite 'expired'
     * desde la 0013, pero nada lo escribe y nada va a escribirlo: no hay grant
     * de `update` sobre esta tabla y esta función sólo escribe 'accepted'. Se
     * comprueban las dos cosas igualmente, para que el día que algo marque la
     * columna no haya dos verdades.
     */
    if invitation_record.status = 'expired'
       or invitation_record.expires_at <= timezone('utc', now()) then
        raise exception 'Invitation has expired'
            using errcode = 'ZC011';
    end if;

    /*
     * El bloqueo va antes del recuento y no después, copiado de
     * `accept_join_request` por el mismo motivo: dos ingresos simultáneos
     * leerían el mismo número de alumnos, los dos lo encontrarían por debajo del
     * cupo y los dos insertarían. `unique (student_id)` no protege de eso,
     * porque son alumnos distintos.
     */
    select capacity into group_capacity
    from public.class_groups
    where id = invitation_record.group_id
    for update;

    if not found then
        raise exception 'Classroom not found'
            using errcode = 'P0002';
    end if;

    select count(*) into current_members
    from public.class_memberships
    where group_id = invitation_record.group_id;

    if current_members >= group_capacity then
        raise exception 'Classroom is full'
            using errcode = '23514';
    end if;

    if exists (
        select 1
        from public.class_memberships membership_record
        where membership_record.student_id = authenticated_user_id
    ) then
        raise exception 'Student already belongs to a classroom'
            using errcode = '23505';
    end if;

    /*
     * LA SOLICITUD PENDIENTE SE CANCELA, NO SE RESUELVE, y esta es la decisión
     * que nadie había tomado. Sin ella, un niño con una solicitud viva en el
     * salón A que canjea un enlace del salón B queda dentro de B con esa
     * solicitud todavía en pie: media violación de «un alumno, un salón», y una
     * solicitud que ya no significa nada en la bandeja del tutor de A.
     *
     * No se marca 'accepted' ni 'rejected' porque sería escribir en el historial
     * algo que no ocurrió: ningún tutor la resolvió. Con 'accepted' en A además
     * contradiría a la pertenencia, que está en B. Borrarla es EXACTAMENTE la
     * cancelación que el niño podía hacer él mismo por
     * `join_requests_delete_own_pending`, y el historial ya modela una
     * cancelación como la ausencia de fila.
     *
     * El `status = 'pending'` va escrito y no implícito: sin él, este `delete`
     * —que corre como definer y no pasa por ninguna política— se llevaría por
     * delante el historial resuelto, que es inmutable a propósito.
     */
    delete from public.join_requests
    where student_id = authenticated_user_id
      and status = 'pending';

    insert into public.class_memberships (group_id, student_id)
    values (invitation_record.group_id, authenticated_user_id)
    returning * into created_membership;

    /*
     * `accepted_at` se escribe aquí a mano porque `invitations` no tiene el
     * disparador que `join_requests` sí tiene para su `resolved_at`.
     */
    update public.invitations
    set status = 'accepted',
        accepted_at = timezone('utc', now())
    where id = invitation_record.id;

    return created_membership;
end;
$$;

/*
 * Mirar sin gastar. Existe porque el muro 1 deja al invitado sin poder leer su
 * propia fila: sin esta función, la pantalla del enlace no puede decir a qué
 * salón invita ni si sigue sirviendo, y habría que pulsar «Entrar» a ciegas para
 * descubrir que caducó — un clic que gasta un enlace de un solo uso.
 *
 * `stable` y sin una sola escritura: es la mitad que describe, no la que actúa.
 * La caducidad la vuelve a decidir `redeem_invitation` por su cuenta, así que lo
 * que devuelva esto no autoriza nada.
 */
create or replace function public.preview_invitation(input_token text)
returns table (
    group_name text,
    group_public_id text,
    free_seats integer,
    state text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    invitation_record public.invitations;
    group_record public.class_groups;
    current_members integer;
begin
    /*
     * Exige sesión, y por eso no se concede a `anon`: con el token en la mano se
     * sabe el nombre de un salón, así que sin sesión un salón no revela nada. El
     * invitado que todavía no tiene cuenta ve el nombre un segundo después, al
     * volver del registro.
     */
    if auth.uid() is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    select * into invitation_record
    from public.invitations
    where token = input_token;

    if not found then
        raise exception 'Invitation not found'
            using errcode = 'ZC010';
    end if;

    select * into group_record
    from public.class_groups
    where id = invitation_record.group_id;

    if not found then
        raise exception 'Classroom not found'
            using errcode = 'P0002';
    end if;

    select count(*) into current_members
    from public.class_memberships
    where group_id = group_record.id;

    /*
     * Caducada y usada NO se devuelven como error: son estados que la pantalla
     * cuenta, y sólo el token que no existe es un fallo. El orden importa —una
     * invitación canjeada y además pasada de fecha es 'used', porque eso es lo
     * que le ocurrió—.
     */
    return query
    select
        group_record.name,
        group_record.public_id,
        greatest(group_record.capacity - current_members, 0),
        case
            when invitation_record.status = 'accepted' then 'used'
            when invitation_record.status = 'expired'
                 or invitation_record.expires_at <= timezone('utc', now()) then 'expired'
            else 'valid'
        end;
end;
$$;

/*
 * `anon` va aparte del pseudo-rol `public` en las dos: revocar de `public` no
 * retira lo que se haya concedido directamente a un rol. Ya se anotó a cuenta de
 * la 0009 y vale igual para las funciones.
 */
revoke execute on function public.redeem_invitation(text) from public;
revoke execute on function public.redeem_invitation(text) from anon;
grant execute on function public.redeem_invitation(text) to authenticated;

revoke execute on function public.preview_invitation(text) from public;
revoke execute on function public.preview_invitation(text) from anon;
grant execute on function public.preview_invitation(text) to authenticated;
