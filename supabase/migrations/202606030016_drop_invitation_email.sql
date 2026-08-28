/*
 * `invitations.email` era el único sitio del esquema donde se almacenaba la
 * dirección de correo de alguien SIN cuenta: la escribía el tutor, no su dueño,
 * y en una plataforma para niños ese tercero puede ser un menor. Nadie la había
 * autorizado, a nadie se le había informado, y nada la borraba nunca — la
 * aplicación sólo insertaba, y `expires_at` y `status` no los evaluaba ninguna
 * consulta—. Encima la finalidad que la justificaba no ocurre: el envío real de
 * correos es el paso 19 y no hay servicio contratado, así que se conservaba sin
 * plazo un dato personal para algo que no pasa.
 *
 * Se elimina la columna en vez de dejar de escribirla desde el cliente por dos
 * motivos: dejar de escribir no borra lo que ya está dentro, y una columna
 * `not null` viva se vuelve a llenar en cuanto alguien la encuentre disponible,
 * sin volver a hacerse esta pregunta.
 *
 * LA TABLA SE QUEDA A PROPÓSITO. El token con `extensions.gen_random_bytes`
 * calificado, la caducidad, las tres políticas y la cascada de la 0013 siguen
 * sirviendo tal cual para el paso 19, cuando exista el envío y el enlace
 * canjeable. Lo que se va es el dato personal, no el trabajo. Hasta ese paso la
 * tabla queda sin escrituras, y eso está anotado como deuda en `CONTEXT.md`.
 *
 * Ninguna política, ningún `grant` y ninguna otra tabla se tocan: el grafo de
 * RLS verificado en la 0013 y la 0014 queda exactamente como estaba.
 */

drop index if exists public.invitations_email_idx;

alter table public.invitations
    drop column if exists email;
