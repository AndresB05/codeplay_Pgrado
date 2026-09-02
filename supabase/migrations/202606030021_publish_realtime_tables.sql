/*
 * Publicación en vivo de las tres tablas que sostienen la sincronización del
 * paso 18: la solicitud que le entra al tutor, la pertenencia que resuelve o
 * retira, y la misión que asigna o quita.
 *
 * ESTA MIGRACIÓN SÓLO AÑADE TABLAS, Y ESO ES TODO LO QUE HACE FALTA. La
 * publicación `supabase_realtime` YA EXISTE en el proyecto y YA TIENE ACTIVADAS
 * LAS CUATRO OPERACIONES —insert, update, delete y truncate—; lo que no tiene es
 * una sola tabla, y una publicación vacía no emite un solo evento. Comprobado en
 * el panel de Supabase el 2 de septiembre de 2026, no deducido de estas
 * migraciones. Por eso aquí no hay `create publication` ni nada que toque qué
 * operaciones emite: las dos cosas chocarían contra el estado real de la base.
 *
 * NO SE AMPLÍA LA IDENTIDAD DE RÉPLICA, y no es un olvido. Realtime no filtra
 * los `delete` por seguridad a nivel de fila —cuando llega el evento la fila ya
 * no existe, así que no hay contra qué evaluar la política— y los entrega a
 * todos los suscriptores de la tabla. Con la identidad por defecto lo que viaja
 * es la clave primaria y nada más: un uuid suelto, sin `group_id` y sin
 * `student_id`. `replica identity full` haría viajar la fila entera, o sea MÁS
 * filtración y no menos. Se acepta a sabiendas: el cliente no lee el contenido
 * del aviso, sólo vuelve a consultar, y esa consulta sí pasa por la RLS.
 *
 * NO SE PUBLICAN `class_groups`, `profiles` NI `invitations`. Publicar una tabla
 * es barato de escribir y caro de razonar, y ninguna de ellas tiene un caso que
 * sincronizar hoy. Que el niño vea desaparecer un salón borrado le llega igual,
 * porque el borrado arrastra en cascada sus pertenencias y sus solicitudes, que
 * sí están aquí.
 */

/*
 * `alter publication ... add table` no admite `if not exists` y falla si la
 * tabla ya está publicada, así que la comprobación va delante: el esquema tiene
 * que poder reproducirse desde cero y volver a aplicarse sin reventar.
 *
 * Sin guarda sobre la existencia de la publicación, a propósito: si no
 * estuviera, esto debe fallar con un motivo a la vista y no saltarse el trabajo
 * en silencio.
 */
do $$
declare
    target_table text;
begin
    foreach target_table in array array[
        'join_requests',
        'class_memberships',
        'mission_assignments'
    ]
    loop
        if not exists (
            select 1
            from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = target_table
        ) then
            execute format(
                'alter publication supabase_realtime add table public.%I',
                target_table
            );
        end if;
    end loop;
end;
$$;
