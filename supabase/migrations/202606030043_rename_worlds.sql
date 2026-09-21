/*
 * LOS TRES MUNDOS CAMBIAN DE NOMBRE, y con ellos su descripción y su rótulo.
 *
 * Eran «Selva Algorítmica», «Cordillera Binaria» y «Costa de Bugs», y la landing
 * anterior al login anunciaba otros tres distintos. Dos problemas, no uno: la
 * plataforma se contradecía consigo misma, y cinco de esos seis nombres prometían
 * lo que los cuatro bloques del juego —avanzar, dos giros y saltar— no permiten
 * practicar. Las descripciones mentían igual: «secuencias, condiciones y bucles»,
 * «funciones y estructuras de datos», «Depura código».
 *
 * Los nombres nuevos apuntan a los pilares del pensamiento computacional, y el
 * `region_label` pasa a nombrar el pilar en lugar de la región colombiana. Es lo
 * que `DISENO-DEL-JUEGO.md` §2 ya fijaba por mundo, y lo decidió el usuario el
 * 20-sep-2026.
 *
 * POR QUÉ UN `update` Y NO REESCRIBIR LA SIEMBRA DE LA 0012: aquella migración
 * está aplicada y registrada en la base remota, así que el `push` no la volvería
 * a ejecutar. Una migración aplicada no se reescribe.
 *
 * EL `slug` SE RENOMBRA CON EL TÍTULO. No lo consume ninguna pantalla —
 * `worlds.service.ts` lo mapea y nadie lo lee—, y dejar `costa-de-bugs`
 * apuntando a «Encrucijada de las Decisiones» es la clase de renombrado a medias
 * que convierte cualquier consulta de depuración en un acertijo. El proyecto ya
 * pagó una vez por eso: ver `CONTEXT.md` §4.2b.
 *
 * NINGUNA CLAVE SE ROMPE. `perfect_wN_lM` y `perfect_world_N` salen del
 * `sort_order` del mundo y del nivel, nunca del nombre, y ningún `sort_order`
 * cambia aquí. Los nueve títulos de nivel tampoco cambian, así que los nueve
 * logros de nivel no se tocan.
 */

do $$
declare
    updated_worlds integer;
    updated_catalog integer;
begin
    /*
     * Un `update from (values ...)` y no tres sueltos: así el recuento de abajo
     * es uno solo y dice si alguna fila se quedó sin renombrar. Se localiza por
     * `slug`, que tiene `unique`, y no por `sort_order`, que lo es de hecho pero
     * no de derecho.
     */
    update public.worlds as world_record
    set slug = renamed.new_slug,
        title = renamed.new_title,
        description = renamed.new_description,
        region_label = renamed.new_region
    from (values
        (
            'selva-algoritmica',
            'sendero-de-los-patrones',
            'Sendero de los Patrones',
            'Ordena los pasos del explorador y encuentra el patrón que resuelve cada tablero: avanzar y girar hasta la meta.',
            'Algoritmos y patrones'
        ),
        (
            'cordillera-binaria',
            'cordillera-de-la-abstraccion',
            'Cordillera de la Abstracción',
            'Parte el camino en tramos y súbelo por partes: saltar, subir y rodear hasta llegar a lo más alto.',
            'Descomposición y abstracción'
        ),
        (
            'costa-de-bugs',
            'encrucijada-de-las-decisiones',
            'Encrucijada de las Decisiones',
            'Varios caminos llegan a la meta, pero sólo algunos caben en los pasos que tienes: mira el tablero, compara y elige.',
            'Evaluación de problemas'
        )
    ) as renamed(old_slug, new_slug, new_title, new_description, new_region)
    where world_record.slug = renamed.old_slug;

    get diagnostics updated_worlds = row_count;

    /*
     * EL CATÁLOGO DE LOGROS NO SE ACTUALIZA SOLO. Los tres `perfect_world_N` se
     * sembraron en la 0036 con el nombre del mundo ESCRITO A MANO en el título y
     * dentro de la descripción, porque derivarlo daba «Dueño de Selva
     * Algorítmica», que no se lee. Renombrar el mundo los deja nombrando algo que
     * ya no existe, y eso es un defecto, no un registro histórico.
     *
     * Los nueve `perfect_wN_lM` NO se tocan: salen del título del nivel, y los
     * nueve títulos de nivel siguen igual.
     */
    update public.achievement_catalog as catalog_record
    set title = renamed.new_title,
        description = renamed.new_description
    from (values
        (
            'perfect_world_1',
            'Dueño del Sendero',
            'Supera los tres niveles del Sendero de los Patrones con 100 de 100.'
        ),
        (
            'perfect_world_2',
            'Dueño de la Cordillera',
            'Supera los tres niveles de la Cordillera de la Abstracción con 100 de 100.'
        ),
        (
            'perfect_world_3',
            'Dueño de la Encrucijada',
            'Supera los tres niveles de la Encrucijada de las Decisiones con 100 de 100.'
        )
    ) as renamed(achievement_key, new_title, new_description)
    where catalog_record.achievement_key = renamed.achievement_key;

    get diagnostics updated_catalog = row_count;

    /*
     * UN `update` QUE NO TOCA NINGUNA FILA NO FALLA, y sin esta comprobación la
     * migración pasaría en silencio dejando los nombres viejos. El error tiene
     * que aparecer en el `push` y no tres días después en una pantalla.
     */
    if updated_worlds <> 3 then
        raise exception 'El renombrado esperaba tres mundos y actualizó %', updated_worlds
            using errcode = 'P0001';
    end if;

    if updated_catalog <> 3 then
        raise exception 'El renombrado esperaba tres logros de mundo y actualizó %', updated_catalog
            using errcode = 'P0001';
    end if;
end;
$$;

/*
 * `public.achievements` NO SE TOCA, Y ES UNA DECISIÓN.
 *
 * Esa tabla es el registro de lo CONCEDIDO y copia título y descripción del
 * catálogo en el momento de conceder —sus columnas son `not null` desde la
 * 0005—. Un niño que ganó «Dueño de la Selva» lo sigue teniendo así: renombrar
 * un mundo no reescribe lo que alguien ya ganó. Ver `CONTEXT.md` §2.11.
 *
 * Queda escrito aquí porque la siguiente persona que vea un `achievements` con
 * nombres viejos junto a un catálogo con nombres nuevos va a pensar que falta un
 * `update`. No falta.
 */
