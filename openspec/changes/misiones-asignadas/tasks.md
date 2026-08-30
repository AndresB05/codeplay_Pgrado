## 1. Migración

- [x] 1.1 Escribir `supabase/migrations/202606030020_create_mission_assignments.sql` con la tabla, sus índices, sus políticas y sus `grant` **en el mismo archivo**, siguiendo la forma de la 0013. Incluye `revoke all ... from public` **y** `from anon` por separado, y deja escrito en un comentario **por qué `mission_key` es texto sin clave ajena**. Verificar leyendo el archivo: tabla, `unique (group_id, mission_key)`, cascada al borrar el salón, tres políticas (`select`/`insert`/`delete`), sin `update`, y el `grant` limitado a `select, insert, delete` sobre `authenticated`
- [x] 1.2 Recorrer el grafo de políticas **desde el `insert` y desde el `delete`**, no sólo desde el `select`, y dejar el recorrido escrito en el propio archivo o confirmado contra `design.md` §3. Verificar que ninguna política existente consulta `mission_assignments` con `grep -rn "mission_assignments" supabase/migrations/`, que debe devolver sólo la 0020
- [x] 1.3 **PARADA: la sesión que revisa lee el SQL antes del `db push`** (`ROADMAP.md` §1.3, comprobación 9). No continuar sin ese visto bueno

## 2. Aplicar contra la base real (lo lanza el usuario)

- [x] 2.1 **El usuario lanza `npx supabase db push`** y se lee la salida: tiene que aplicar la 0020 y **ninguna migración más**. Si arrastra otras, hay migraciones sin aplicar en la base y se investiga antes de seguir
- [x] 2.2 **El usuario lanza `npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts`**. Verificar con `grep -n "mission_assignments" apps/web/src/types/database.types.ts` que la tabla aparece. **El archivo no se edita a mano por ningún motivo**
- [x] 2.3 Verificar por `curl` con las cuentas de `.env`, sin imprimir contraseñas ni tokens: el tutor asigna en **su** salón (201) y **no** en uno ajeno (`42501`); asignar dos veces la misma misión al mismo salón no crea una segunda fila; el niño **lee** las de su salón y obtiene **cero filas** de otro; el niño **no** puede asignar (`42501`); el tutor retira la suya y no la de un salón ajeno (0 filas); la clave anónima recibe **401**. Anotar los resultados para `CONTEXT.md` §2.7

## 3. Catálogo y tipos del cliente

- [x] 3.1 Añadir `xpReward: number` a `Mission` en `apps/web/src/types/classroom.types.ts`, con su JSDoc por campo como el resto del tipo. Verificar que `npm run build` falla señalando las cinco entradas del catálogo sin premio — esa es la red
- [x] 3.2 Declarar el premio en las cinco entradas de `missionCatalog` (`teacher/classroomsData.ts:159`) con los valores decididos en `design.md` §4: **300** las Fáciles, **400** las Intermedias, **500** la Difícil. Verificar que `npm run build` vuelve a pasar

## 4. Servicio y hook

- [x] 4.1 Crear `apps/web/src/services/missions.service.ts` con `listAssignments`, `assignMission(missionKey, groupIds)` y `unassignMission(missionKey, groupIds)`, tipado contra `Database['public']['Tables']['mission_assignments']['Row']`, devolviendo `{ data, error }` con `AppError` y **sin lanzar nunca**. `assignMission` inserta con `onConflict: 'group_id,mission_key'` e `ignoreDuplicates: true`, para que asignar con «Todos» no muera con `23505` por un salón que ya la tenía. Verificar con `npm run build`
- [x] 4.2 Traducir por código los motivos de la base en ese servicio, como hace `ERROR_MESSAGES` en `classrooms.service.ts`, conservando el mensaje del servidor como causa. Verificar que ningún literal en inglés puede llegar a la pantalla
- [x] 4.3 Crear `apps/web/src/hooks/useMissionAssignments.ts` que exponga `{ assignments, loading, error, assign, unassign, refresh }`, cargue al montar y **recargue tras cada escritura**. Verificar con `npm run build` y `npm run lint`

## 5. Panel del niño

- [x] 5.1 Crear `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.tsx`: resuelve cada `mission_key` contra `missionCatalog`, **ignora las claves que no reconoce**, y pinta por misión título, descripción, habilidad, dificultad, **premio en XP** y la línea de que llegará con el juego. **Ningún botón ni enlace que prometa jugarla.** Verificar con `grep -n "onClick\|<button\|<a " ` sobre el archivo: sólo puede aparecer en el aviso de error, si lo lleva
- [x] 5.2 Hacer que el panel devuelva `null` mientras carga y cuando no hay ninguna misión que enseñar —sin hueco, sin título huérfano, sin tarjeta vacía—, y que **sí** muestre el motivo si la lectura falla. Verificar en pantalla los dos casos vivos: el niño **sin salón** y el niño **con salón y sin misiones asignadas**
- [x] 5.3 Montarlo en `student/StudentWorldsModule.tsx` **encima** de la sección de Filtros (hoy línea 313) y en `student/StudentClassroomModule.tsx` **encima** de `<StudentRosterTable>` (hoy línea 142). Verificar en pantalla que aparece en los dos sitios y que ninguno de los dos módulos habla con Supabase por su cuenta

## 6. Panel del tutor

- [x] 6.1 En `teacher/TeacherPanelModule.tsx`, retirar `assignedMissionIds` y conectar la sección «Asignación de misiones» al hook, cruzando lo asignado con `scopedGroups`: «Asignada» sólo si **todos** los salones del alcance la tienen, «En N de M salones» si algunos, y «Asignar misión» si ninguno. Verificar en pantalla cambiando de salón en el selector: lo marcado corresponde al salón elegido, no al anterior
- [x] 6.2 Deshabilitar los controles de asignar cuando el tutor **no tiene ningún salón**, con el motivo a la vista. Verificar en pantalla con un tutor sin salones: hoy se puede «asignar» sin tener ni uno
- [x] 6.3 Añadir el apartado de cumplimiento, **visible sólo con un salón concreto elegido**: tabla con los alumnos en filas y las misiones asignadas en columnas, todas las celdas en «Pendiente», dentro de un contenedor con desplazamiento horizontal propio. Verificar en pantalla que con «Todos» elegido el apartado no aparece
- [x] 6.4 Poner **encima de esa tabla y sin desplegar nada** el motivo de que todo esté pendiente: nadie puede cumplirlas hasta que el juego reporte el progreso (paso 21). Y que el salón **sin alumnos** lo diga en vez de enseñar una tabla vacía. Verificar los dos casos en pantalla
- [x] 6.5 Usar sólo nombres de color del tema, nunca hex sueltos, y las clases de componente ya existentes (`.card`, `.chip`, `.btn`). Verificar con `grep -n "#[0-9A-Fa-f]\{6\}"` sobre los archivos tocados: fuera de los iconos SVG que ya los traían, cero resultados nuevos

## 7. Tests

- [x] 7.1 Añadir tests del panel del niño: que no pinta nada sin misiones asignadas, que pinta las asignadas con su premio, y que **no ofrece ningún control para jugarlas**. Verificar con `npm run test:run`
- [x] 7.2 Añadir tests de la resolución del alcance del tutor: «Asignada» sólo con todos los salones del alcance, el caso parcial, y el tutor sin salones con los controles deshabilitados. Verificar con `npm run test:run`
- [x] 7.3 Comparar los tests **por el nombre de cada `it(`** contra `git show HEAD:<ruta>`, no por el total. Se parte de **79 en 10 archivos**: ninguno de esos 79 puede desaparecer

## 8. Documentación

- [x] 8.1 Actualizar `docs/CONTEXT.md`: la fila «Asignación de misiones» de §2.3 deja de ser 🟡 y apunta a los archivos reales; §2.7 gana la migración 0020 con lo verificado por `curl`; §3 pierde la entrada «Persistir la asignación de misiones» de P5. **Escribir explícitamente que las misiones todavía NO son funcionales**: no se pueden jugar ni completar, y el catálogo sigue siendo local sin clave ajena a `levels`. Verificar releyendo las cuatro secciones
- [x] 8.2 Escribir en `docs/CONTEXT.md` la subsección **§2.8 `misiones-asignadas`**, con la misma forma que las otras siete —propósito, tabla de requisitos con estado y ruta real, y decisiones de diseño—, después de §2.7 y antes de §3. Sin ella, §0.2 queda mintiendo: dice que los identificadores de capacidad de §2 se usan tal cual como `<capability-path>`, y esta capacidad no tendría subsección en §2. Verificar que `npx openspec list --specs` y los encabezados `### 2.x` de §2 nombran exactamente el mismo conjunto
- [x] 8.3 Corregir el recuento de §0.2 (línea 47, fila «§2 Especificaciones aplicadas»): pasa a **8 capacidades** y **se retira el número de requisitos**, hoy «40» y en realidad 71 —contados capacidad por capacidad—. Un recuento de requisitos a mano ahí caduca en cada cambio y ya caducó dos veces; el vivo lo da `npx openspec list --specs`, que §0.2 ya documenta. Verificar con `grep -n "40 requisitos" docs/CONTEXT.md`, que debe devolver cero resultados
- [x] 8.4 Actualizar `docs/ROADMAP.md`: fila 16 a ✅ con el nombre del cambio y la nota de que las misiones **siguen sin ser jugables**; retirar de §3 el cabo suelto de las misiones y dejar escrito lo que este paso **no** cierra —que no son jugables y que el catálogo sigue local sin clave ajena—. Verificar que no queda ninguna referencia al cabo suelto retirado
- [x] 8.5 Replicar en `openspec/config.yaml` lo que toque al estado del proyecto, y comprobar que sigue parseando con `npx openspec doctor`

## 9. Verificación final

- [x] 9.1 `npm run lint` (0 warnings), `npm run test:run` y `npm run build`: los tres pasan hoy y no deben romperse
- [x] 9.2 `npx openspec validate misiones-asignadas --strict` — la opción es posicional, `--change` no existe en este comando
- [x] 9.3 Comprobación **en pantalla** con las dos cuentas de `.env`: el tutor asigna, el niño la ve **en los dos sitios** sin recargar la aplicación entera, y el tutor ve a su salón entero en «Pendiente» con el motivo a la vista
- [ ] 9.4 Preparar el commit **enumerando las rutas** en `git add`, nunca `git add -A`: con varios cambios vivos el árbol casi nunca contiene sólo lo que se está commiteando
