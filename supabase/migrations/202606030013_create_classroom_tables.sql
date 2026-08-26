/*
 * Tablas del módulo de salones. Las políticas y los grant van en este mismo
 * archivo, no en una migración aparte: el proyecto se creó con RLS automática y
 * sin exposición automática de tablas, así que una tabla sin ellos existe y es
 * inaccesible. Juntos no pueden aplicarse por mitades ni divergir.
 */

create table if not exists public.class_groups (
    id uuid primary key default gen_random_uuid(),
    tutor_id uuid not null references auth.users (id) on delete cascade,
    public_id text not null unique check (public_id ~ '^CP-[A-Z0-9]{4}$'),
    name text not null check (length(trim(name)) > 0),
    grade_label text not null default '',
    /*
     * El profesor a cargo es texto libre que el tutor escribe al crear el
     * salón, y no tiene por qué coincidir con su propio nombre de perfil.
     * `tutor_id` es la identidad; esto es una etiqueta.
     */
    teacher_name text not null default '',
    capacity integer not null default 30 check (capacity between 1 and 100),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.class_memberships (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    student_id uuid not null references auth.users (id) on delete cascade,
    /*
     * La fecha de ingreso no decide qué historial ve el tutor de un niño que ya
     * jugaba antes de entrar. Se guarda para que esa decisión siga siendo
     * posible: no guardarla obligaría a inventarla después.
     */
    joined_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    constraint class_memberships_student_unique unique (student_id)
);

create table if not exists public.join_requests (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    student_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'rejected')),
    requested_at timestamptz not null default timezone('utc', now()),
    resolved_at timestamptz
);

create table if not exists public.invitations (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    invited_by uuid not null references auth.users (id) on delete cascade,
    email text not null,
    /*
     * `pgcrypto` está instalada con `with schema extensions` (migración 0001) y
     * ninguna migración anterior llama a una función suya, así que no hay
     * precedente de que resuelva sin calificar. Sin el prefijo, un search_path
     * sin `extensions` mata el push con 42883.
     */
    token text not null unique
        default encode(extensions.gen_random_bytes(24), 'hex'),
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'expired')),
    expires_at timestamptz not null
        default timezone('utc', now()) + interval '14 days',
    sent_at timestamptz not null default timezone('utc', now()),
    accepted_at timestamptz
);

create index if not exists class_groups_tutor_id_idx
    on public.class_groups (tutor_id);

create index if not exists class_memberships_group_id_idx
    on public.class_memberships (group_id);

create index if not exists join_requests_group_id_idx
    on public.join_requests (group_id);

create index if not exists join_requests_student_id_idx
    on public.join_requests (student_id);

/*
 * Parcial a propósito. El historial de solicitudes se acumula en filas —un niño
 * rechazado vuelve a pedir entrar insertando otra, no reabriendo la suya—, así
 * que la unicidad sólo puede aplicarse a las pendientes. Un único pendiente por
 * niño en toda la plataforma es la mitad de «un alumno, un salón».
 */
create unique index if not exists join_requests_one_pending_per_student_idx
    on public.join_requests (student_id)
    where status = 'pending';

create index if not exists invitations_group_id_idx
    on public.invitations (group_id);

create index if not exists invitations_email_idx
    on public.invitations (lower(email));

drop trigger if exists handle_class_groups_updated_at on public.class_groups;

create trigger handle_class_groups_updated_at
before update on public.class_groups
for each row
execute function public.set_current_timestamp_updated_at();

/*
 * La marca de resolución no la escribe quien actualiza: el tutor rechaza con un
 * update y la RPC acepta con otro, y ninguno de los dos debería tener que
 * acordarse de la fecha para que el dato sea consistente.
 */
create or replace function public.set_join_request_resolved_at()
returns trigger
language plpgsql
as $$
begin
    if old.status = 'pending' and new.status is distinct from old.status then
        new.resolved_at = timezone('utc', now());
    end if;

    return new;
end;
$$;

drop trigger if exists handle_join_requests_resolved_at on public.join_requests;

create trigger handle_join_requests_resolved_at
before update on public.join_requests
for each row
execute function public.set_join_request_resolved_at();

alter table public.class_groups enable row level security;
alter table public.class_memberships enable row level security;
alter table public.join_requests enable row level security;
alter table public.invitations enable row level security;

/*
 * El catálogo de salones es legible por cualquier autenticado porque el niño
 * tiene que encontrar un salón por su ID público antes de pertenecer a él. Lo
 * que cuelga del salón —alumnos, solicitudes, invitaciones— no lo es.
 */
drop policy if exists class_groups_select_authenticated on public.class_groups;
create policy class_groups_select_authenticated
on public.class_groups
for select
to authenticated
using (true);

drop policy if exists class_groups_insert_own on public.class_groups;
create policy class_groups_insert_own
on public.class_groups
for insert
to authenticated
with check (
    tutor_id = auth.uid()
    and exists (
        select 1
        from public.profiles profile_record
        where profile_record.id = auth.uid()
          and profile_record.role = 'tutor'
    )
);

drop policy if exists class_groups_delete_own on public.class_groups;
create policy class_groups_delete_own
on public.class_groups
for delete
to authenticated
using (tutor_id = auth.uid());

drop policy if exists class_memberships_select_related on public.class_memberships;
create policy class_memberships_select_related
on public.class_memberships
for select
to authenticated
using (
    student_id = auth.uid()
    or exists (
        select 1
        from public.class_groups group_record
        where group_record.id = class_memberships.group_id
          and group_record.tutor_id = auth.uid()
    )
);

/*
 * El niño se va por su cuenta y el tutor puede retirarlo. No hay política de
 * inserción: la única forma de entrar a un salón es `accept_join_request`, que
 * corre como definer y comprueba el cupo y el consentimiento.
 */
drop policy if exists class_memberships_delete_own_or_tutor on public.class_memberships;
create policy class_memberships_delete_own_or_tutor
on public.class_memberships
for delete
to authenticated
using (
    student_id = auth.uid()
    or exists (
        select 1
        from public.class_groups group_record
        where group_record.id = class_memberships.group_id
          and group_record.tutor_id = auth.uid()
    )
);

drop policy if exists join_requests_select_related on public.join_requests;
create policy join_requests_select_related
on public.join_requests
for select
to authenticated
using (
    student_id = auth.uid()
    or exists (
        select 1
        from public.class_groups group_record
        where group_record.id = join_requests.group_id
          and group_record.tutor_id = auth.uid()
    )
);

/*
 * La tercera pata de «un alumno, un salón», la que no cabe en una restricción
 * porque cruza dos tablas: quien ya pertenece a un salón no puede pedir entrar
 * a otro. El estado se fija a 'pending' aquí para que nadie se autoconceda una
 * solicitud ya aceptada.
 */
drop policy if exists join_requests_insert_own on public.join_requests;
create policy join_requests_insert_own
on public.join_requests
for insert
to authenticated
with check (
    student_id = auth.uid()
    and status = 'pending'
    and exists (
        select 1
        from public.profiles profile_record
        where profile_record.id = auth.uid()
          and profile_record.role = 'child'
    )
    and not exists (
        select 1
        from public.class_memberships membership_record
        where membership_record.student_id = auth.uid()
    )
);

/*
 * Cancelar sólo alcanza a lo pendiente. Sin la condición del estado, un niño
 * podría borrar su rechazo y volver a insertar como si no hubiera pasado nada,
 * que es justo lo que el historial pretende impedir.
 */
drop policy if exists join_requests_delete_own_pending on public.join_requests;
create policy join_requests_delete_own_pending
on public.join_requests
for delete
to authenticated
using (
    student_id = auth.uid()
    and status = 'pending'
);

/*
 * El único update permitido es el rechazo del tutor. Dejarle escribir
 * 'accepted' por aquí sería saltarse la RPC, y con ella el cupo y la
 * pertenencia: la solicitud quedaría aceptada y el niño fuera del salón.
 */
drop policy if exists join_requests_reject_by_tutor on public.join_requests;
create policy join_requests_reject_by_tutor
on public.join_requests
for update
to authenticated
using (
    status = 'pending'
    and exists (
        select 1
        from public.class_groups group_record
        where group_record.id = join_requests.group_id
          and group_record.tutor_id = auth.uid()
    )
)
with check (
    status = 'rejected'
    and exists (
        select 1
        from public.class_groups group_record
        where group_record.id = join_requests.group_id
          and group_record.tutor_id = auth.uid()
    )
);

drop policy if exists invitations_select_own_groups on public.invitations;
create policy invitations_select_own_groups
on public.invitations
for select
to authenticated
using (
    exists (
        select 1
        from public.class_groups group_record
        where group_record.id = invitations.group_id
          and group_record.tutor_id = auth.uid()
    )
);

drop policy if exists invitations_insert_own_groups on public.invitations;
create policy invitations_insert_own_groups
on public.invitations
for insert
to authenticated
with check (
    invited_by = auth.uid()
    and exists (
        select 1
        from public.class_groups group_record
        where group_record.id = invitations.group_id
          and group_record.tutor_id = auth.uid()
    )
);

drop policy if exists invitations_delete_own_groups on public.invitations;
create policy invitations_delete_own_groups
on public.invitations
for delete
to authenticated
using (
    exists (
        select 1
        from public.class_groups group_record
        where group_record.id = invitations.group_id
          and group_record.tutor_id = auth.uid()
    )
);

/*
 * `profiles_select_own` sigue en pie y no se toca: las políticas permisivas se
 * combinan con OR, así que esto añade acceso sin quitárselo a nadie. Sin ella,
 * la lista del salón mostraría alumnos sin nombre, porque cada perfil sólo es
 * legible por su dueño.
 */
drop policy if exists profiles_select_own_students on public.profiles;
create policy profiles_select_own_students
on public.profiles
for select
to authenticated
using (
    exists (
        select 1
        from public.class_memberships membership_record
        join public.class_groups group_record
          on group_record.id = membership_record.group_id
        where membership_record.student_id = profiles.id
          and group_record.tutor_id = auth.uid()
    )
    or exists (
        select 1
        from public.join_requests request_record
        join public.class_groups group_record
          on group_record.id = request_record.group_id
        where request_record.student_id = profiles.id
          and request_record.status = 'pending'
          and group_record.tutor_id = auth.uid()
    )
);

revoke all on public.class_groups from public;
revoke all on public.class_memberships from public;
revoke all on public.join_requests from public;
revoke all on public.invitations from public;

/*
 * `anon` aparte del pseudo-rol `public`: revocar de `public` no retira lo que
 * se haya concedido directamente a un rol. Si el proyecto tuviera privilegios
 * por defecto para `anon` en este esquema, las cuatro tablas nacerían legibles
 * sin sesión, y esta migración no puede dar por supuesto que no los tenga.
 */
revoke all on public.class_groups from anon;
revoke all on public.class_memberships from anon;
revoke all on public.join_requests from anon;
revoke all on public.invitations from anon;

/*
 * Nada de esto es público: sin sesión no hay salones que ver. Y el tutor no
 * puede actualizar un salón porque editarlo todavía no existe en la interfaz;
 * conceder el permiso ahora sería más difícil de retirar después.
 */
grant select, insert, delete on public.class_groups to authenticated;
grant select, delete on public.class_memberships to authenticated;
grant select, insert, update, delete on public.join_requests to authenticated;
grant select, insert, delete on public.invitations to authenticated;

/*
 * Aceptar es la única escritura de salones que no cabe en una sentencia: hay
 * que comprobar cuatro cosas y tocar dos tablas sin dejar un estado intermedio
 * en el que el niño sea miembro con la solicitud todavía pendiente.
 */
create or replace function public.accept_join_request(input_request_id uuid)
returns public.class_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
    authenticated_user_id uuid;
    request_record public.join_requests;
    group_capacity integer;
    current_members integer;
    created_membership public.class_memberships;
begin
    authenticated_user_id := auth.uid();

    if authenticated_user_id is null then
        raise exception 'Authentication required'
            using errcode = '42501';
    end if;

    select * into request_record
    from public.join_requests
    where id = input_request_id;

    if not found then
        raise exception 'Join request not found'
            using errcode = 'P0002';
    end if;

    if request_record.status <> 'pending' then
        raise exception 'Join request is already resolved'
            using errcode = '22023';
    end if;

    /*
     * El bloqueo va antes del recuento y no después: dos aceptaciones
     * simultáneas leerían el mismo número de alumnos, las dos lo encontrarían
     * por debajo del cupo y las dos insertarían. `unique (student_id)` no
     * protege de eso, porque son alumnos distintos.
     */
    select capacity into group_capacity
    from public.class_groups
    where id = request_record.group_id
      and tutor_id = authenticated_user_id
    for update;

    if not found then
        raise exception 'Only the tutor of the classroom can accept its join requests'
            using errcode = '42501';
    end if;

    select count(*) into current_members
    from public.class_memberships
    where group_id = request_record.group_id;

    if current_members >= group_capacity then
        raise exception 'Classroom is full'
            using errcode = '23514';
    end if;

    if exists (
        select 1
        from public.class_memberships membership_record
        where membership_record.student_id = request_record.student_id
    ) then
        raise exception 'Student already belongs to a classroom'
            using errcode = '23505';
    end if;

    insert into public.class_memberships (group_id, student_id)
    values (request_record.group_id, request_record.student_id)
    returning * into created_membership;

    update public.join_requests
    set status = 'accepted'
    where id = request_record.id;

    return created_membership;
end;
$$;

revoke execute on function public.accept_join_request(uuid) from public;
revoke execute on function public.accept_join_request(uuid) from anon;
grant execute on function public.accept_join_request(uuid) to authenticated;
