## 1. La migración

- [x] 1.1 Escribir `supabase/migrations/202606030043_rename_worlds.sql` con el
      `update` de las tres filas de `public.worlds` —`slug`, `title`,
      `description` y `region_label`—, localizadas por su `slug` viejo. Verificar
      releyendo el archivo que los tres nombres nuevos y los tres `region_label`
      coinciden con la tabla de `design.md` — Decisions.
- [x] 1.2 Añadir en la misma migración el `update` de `public.achievement_catalog`
      sobre `perfect_world_1`, `perfect_world_2` y `perfect_world_3`, con el
      título y la descripción nuevos. Verificar que **no** hay ningún `update`
      sobre `public.achievements` ni sobre los nueve `perfect_wN_lM`.
- [x] 1.3 Añadir al final de la migración la comprobación de recuento que aborta
      si no se actualizaron exactamente tres mundos y tres logros, con `raise
      exception`. Verificar leyendo el SQL que el `raise` está dentro de un
      bloque que se ejecuta siempre, no dentro de un `exception when others`.
- [x] 1.4 Escribir dentro de la migración, en comentario, por qué
      `public.achievements` se queda con los nombres viejos (`CONTEXT.md` §2.11).
- [x] 1.5 **PARADA — el SQL se lee antes del `db push`** (`ROADMAP.md` §1.3,
      punto 9). Esta casilla la marca quien haya leído la migración entera, no
      quien la escribió.
- [x] 1.6 El **usuario** lanza `npx supabase db push`. Verificar en la salida que
      aplica `202606030043` y **ninguna otra**; si arrastra más, parar y mirar
      por qué hay migraciones sin aplicar.

## 2. La landing

- [x] 2.1 En `apps/web/src/components/home/WorldsSection.tsx`, sustituir «La
      Selva de las Secuencias» por «Sendero de los Patrones» y su descripción por
      una que describa ordenar pasos y reconocer el patrón. Verificar que el
      texto nuevo no nombra bucles, condicionales ni depuración.
- [x] 2.2 En el mismo archivo, sustituir «El Espacio de los Bucles» por
      «Cordillera de la Abstracción» y «El Océano Condicional» por «Encrucijada
      de las Decisiones», con descripciones que describan saltar y subir por
      tramos, y comparar rutas con un tope de pasos. Verificar con `grep` que en
      `apps/web/src` no queda ninguna de las seis cadenas viejas fuera de las
      fixturas de test.

## 3. Las fixturas de los tests

- [x] 3.1 Actualizar los nombres de mundo en
      `apps/web/src/components/dashboard/teacher/classroomsData.test.ts`,
      `apps/web/src/components/dashboard/teacher/TeacherPanelModule.test.tsx` y
      `apps/web/src/services/studentProgress.service.test.ts`. Verificar con
      `git diff` que **sólo cambian cadenas de fixtura**: ningún `it(` cambia de
      nombre, ninguno se añade y ninguno se retira.

## 4. Verificación contra la base real

- [x] 4.1 Con la cuenta de niño de `apps/web/.env`, consultar por REST
      `worlds?select=slug,title,description,region_label,sort_order` y comprobar
      que los tres llevan nombre, descripción, `slug` y rótulo nuevos, y que los
      tres `sort_order` siguen siendo 1, 2 y 3.
- [x] 4.2 Consultar `achievement_catalog?select=achievement_key,title,description`
      y comprobar que los tres `perfect_world_N` llevan los nombres nuevos y que
      los nueve `perfect_wN_lM` **no han cambiado**.
- [x] 4.3 Consultar `achievements?select=achievement_key,title` con la cuenta que
      ya tiene logros concedidos y comprobar que **conserva los nombres viejos**.
      Si esta consulta devolviera los nombres nuevos, la migración estaría mal.
- [x] 4.4 Abrir la aplicación con `npm run dev`, entrar con el botón «Sin login»
      de niño —disparándolo por JS, no por coordenadas— y comprobar en la lista
      de mundos y en la lista de niveles de uno de ellos que se leen los nombres
      nuevos y el rótulo del pilar. Comprobar además la landing sin sesión.

## 5. Cierre

- [x] 5.1 `npm run lint`, `npm run test:run` y `npm run build`: los tres pasan.
- [x] 5.2 Propagar a `docs/CONTEXT.md` —§2.6 los nombres y que los de la landing
      son copia a mano, §2.11 que el catálogo se puso al día y lo concedido no—,
      a `docs/ROADMAP.md` §3.3 y a `openspec/config.yaml` si cambió algo de las
      convenciones. Verificar con `npx openspec doctor` que el YAML sigue
      parseando.
