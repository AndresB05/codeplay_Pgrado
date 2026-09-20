/*
 * LA FECHA DE LA RACHA, TAMBIÉN EN EL ROSTER (paso 22).
 *
 * La 0036 dejó la racha contando días de verdad, y con ella la regla que hace
 * falta para leerla: `current_streak` SÓLO SE RECALCULA AL JUGAR, así que un
 * niño que lleve una semana sin entrar sigue teniendo escrito el 3 que dejó.
 * Quien la muestre tiene que compararla con `last_streak_day` y enseñar cero si
 * no es de hoy ni de ayer.
 *
 * `classroom_roster` expone `current_streak` desde la 0015 y NO la fecha, así
 * que la tabla de seguimiento —la que los compañeros ven unos de otros— no
 * podría aplicar esa regla y enseñaría rachas muertas como si siguieran vivas.
 *
 * Y conviene anotar por qué esta migración existe, porque la 0015 creyó haberla
 * evitado: «exponer las columnas ahora evita volver a migrar la vista cuando
 * esos números empiecen a moverse». Se expuso el contador y no la fecha, y sin
 * la fecha el contador no se puede interpretar. Adelantar una columna sólo
 * ahorra la migración si se adelantan TODAS las que ese dato necesita para
 * significar algo.
 *
 * Es una columna más en una vista que ya existe: ni tabla, ni política, ni
 * `grant` nuevo. El filtro de a quién alcanza la vista no se toca.
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
    profile_record.last_streak_day
from public.class_memberships as membership_record
inner join public.profiles as profile_record
    on profile_record.id = membership_record.student_id
where
    /*
     * IDÉNTICO A LA 0015, copiado literal y no reescrito: `create or replace
     * view` sustituye la vista entera, así que este `where` es el que queda y
     * cualquier rama de más aquí amplía en silencio quién ve el roster de quién.
     *
     * Son DOS ramas —el tutor del salón, y un compañero del mismo salón— y las
     * dos preguntan por `auth.uid()` sin recibirlo como parámetro. El propio
     * alumno entra por la segunda: está en su salón.
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
