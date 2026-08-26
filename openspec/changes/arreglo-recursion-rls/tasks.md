## 1. La migración

Archivo nuevo `supabase/migrations/202606030014_fix_profiles_policy_recursion.sql`.
La 0013 **no se toca**: ya está aplicada, y corregirla en el sitio borraría del
registro un fallo que sí ocurrió (design, decisión 1).

- [ ] 1.1 Crear el archivo con marca de tiempo posterior a `202606030013`. Verificación: ordena último en `ls supabase/migrations/`.
- [ ] 1.2 Declarar `is_visible_student_of(profile_id uuid) returns boolean`, `language sql`, `security definer`, `stable`, `set search_path = public`, con los **mismos dos `exists`** que hoy tiene la política: pertenencia en un salón del tutor que llama, o solicitud con `status = 'pending'` en uno de ellos (design, decisión 2). Verificación: la condición es la misma que en la migración 0013; no se amplía ni se recorta quién es visible.
- [ ] 1.3 `revoke execute ... from public` y `from anon`, y `grant execute ... to authenticated` (design, decisión 3). Verificación: las tres sentencias están; PostgreSQL concede `execute` a `PUBLIC` por defecto y sin el `revoke` la función nacería abierta.
- [ ] 1.4 Recrear `profiles_select_own_students` con `drop policy if exists` delante, apoyada en la función (design, decisión 4). Verificación: **se reemplaza**, no se añade una segunda: las políticas permisivas se combinan con OR y dejar viva la anterior mantendría el ciclo.
- [ ] 1.5 No tocar `profiles_select_own` (design, decisión 5). Verificación: la migración no la nombra salvo para dejarla en paz; es la que sostiene que cada quien lea su propio perfil.
- [ ] 1.6 Comprobar por lectura que la migración es reejecutable: `create or replace` en la función y `drop policy if exists` antes del `create policy`. Verificación: ninguna sentencia falla si el objeto ya existe.

## 2. PAUSA: aplicar la migración (lo lanza el usuario)

- [ ] 2.1 Entregar el comando `npx supabase db push` y **detener la implementación** hasta que el usuario confirme (design, Migration Plan). Verificación: el comando está en el chat y no se ha tocado nada más.

## 3. Verificación (a): el ciclo se rompió

- [ ] 3.1 Con la sesión real del niño, insertar una solicitud de ingreso en uno de los salones de prueba que dejó `usuarios-de-prueba`. Verificación: la fila se crea con `status = 'pending'`; ya no responde `42P17`.

## 4. Verificación (b): el arreglo no se llevó por delante lo que la política daba

Tan importante como la mitad (a): cortar el ciclo dejando al tutor con
identificadores sueltos no sería un arreglo (design, Risks).

- [ ] 4.1 Con la sesión del tutor, leer el **nombre** del niño que acaba de solicitar entrada. Verificación: se obtiene el perfil del solicitante, no sólo su identificador.
- [ ] 4.2 Aceptar la solicitud y volver a leer el perfil, ya como alumno inscrito. Verificación: el tutor sigue viendo su nombre cuando la vía de acceso es la pertenencia y no la solicitud — son las dos ramas de la función, y hay que pasar por las dos.
- [ ] 4.3 Comprobar que no se ha vuelto visible ningún perfil ajeno: con la sesión del niño, leer `profiles`. Verificación: **una sola fila**, la suya.

## 5. Verificación (c): los demás caminos que consultan `profiles` desde una política

- [ ] 5.1 Crear un salón con la sesión del tutor. Verificación: se crea; la política de inserción consulta `profiles` para exigir rol `tutor` y no debe dar `42P17`.
- [ ] 5.2 Leer `profiles` con cada una de las dos sesiones. Verificación: ninguna responde `42P17`.
- [ ] 5.3 Anotar lo que **no** se ha recorrido aquí: el barrido completo de las políticas del paso 9 sigue siendo de `usuarios-de-prueba`, en pausa. Verificación: queda escrito en `docs/CONTEXT.md`, no sólo en el chat.

## 6. Documentación

- [ ] 6.1 Añadir la entrada 14 a `supabase/README.md`, diciendo qué corrige y por qué la 0013 se queda como está. Verificación: el README nombra `202606030014_fix_profiles_policy_recursion.sql`.
- [ ] 6.2 En `docs/CONTEXT.md` §2.7, anotar que la 0013 salió con una recursión entre las políticas de `profiles` y `join_requests`, que sólo era observable con sesión autenticada, y que la 0014 la corrige. Verificación: §2.7 deja de dar a entender que el paso 9 quedó limpio.
- [ ] 6.3 En `docs/ROADMAP.md`, anotar lo mismo donde el paso 9 consta como ✅. Verificación: el registro del paso 9 no sigue diciendo que aquello quedó correcto.
- [ ] 6.4 En `docs/ROADMAP.md` §1.3, añadir una comprobación a la lista de lo que se revisa antes de aprobar un `apply`: cuando una política consulte otra tabla, el análisis de ciclos se hace **desde cada operación de escritura**, no sólo desde las lecturas. Verificación: la entrada dice por qué —este fallo pasó dos revisiones por mirar el grafo en una sola dirección— y no sólo qué hacer.

## 7. Verificación final

- [ ] 7.1 `npm run lint`. Verificación: 0 errores y 0 warnings.
- [ ] 7.2 `npm run test:run`. Verificación: los 54 tests pasan. Este cambio no toca código de la aplicación, así que cualquier fallo sería una señal.
- [ ] 7.3 `npm run build`. Verificación: termina sin errores.
- [ ] 7.4 `npx openspec validate arreglo-recursion-rls --strict`. Verificación: válido.
- [ ] 7.5 Comprobar que `usuarios-de-prueba` sigue intacto y en pausa. Verificación: `npx openspec list` lo muestra con sus 20/38 tareas y sus artefactos sin modificar, y los dos salones de prueba siguen en la base.
