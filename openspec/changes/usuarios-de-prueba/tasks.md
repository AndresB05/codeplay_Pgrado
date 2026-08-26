## 1. Configuración de entorno

- [ ] 1.1 Añadir a `apps/web/.env.example` los cuatro nombres —`VITE_DEV_TUTOR_EMAIL`, `VITE_DEV_TUTOR_PASSWORD`, `VITE_DEV_CHILD_EMAIL`, `VITE_DEV_CHILD_PASSWORD`— **con el valor vacío** y un comentario de que son opcionales y sólo de desarrollo (design, decisión 2). Verificación: el archivo no contiene ningún valor, sólo nombres; `.env` sigue fuera del repositorio.
- [ ] 1.2 **No** tocar `apps/web/src/config/env.ts` (design, decisión 3). Verificación: `git diff` no lo incluye. Declararlas ahí las evaluaría también en producción y sus valores acabarían en el paquete publicado.

## 2. Lectura de las credenciales

- [ ] 2.1 Añadir `getDevCredentials(role)` en `apps/web/src/context/guest.helpers.ts`, que devuelve `null` si no está en desarrollo o si falta cualquiera de las dos variables de ese rol (design, decisión 4). Verificación: la función comprueba `import.meta.env.DEV` antes de leer nada.
- [ ] 2.2 Leer las variables **como accesos de miembro** (`import.meta.env.VITE_DEV_TUTOR_EMAIL`), nunca desestructurando `import.meta.env` (design, decisión 3). Verificación: el archivo no contiene ninguna desestructuración ni copia de `import.meta.env`; en el build eso se sustituye por el objeto completo.
- [ ] 2.3 Conservar intactas `isGuestSession`, `getGuestRole`, `startGuestSession` y `endGuestSession`: la sesión de invitado no se retira en este paso. Verificación: las cuatro siguen exportadas con la misma firma y `PrivateRoute` sigue compilando sin cambios.

## 3. El botón «Sin login»

- [ ] 3.1 Reescribir `handleGuestEntry` en `apps/web/src/components/home/Navbar.tsx`: si hay credenciales para el rol pulsado, llamar a `signIn()` del contexto de autenticación; si no, hacer lo de hoy —marca local y navegar— (design, decisión 4). Verificación: los dos caminos existen y el de invitado sigue siendo el que se toma sin `.env` configurado.
- [ ] 3.2 Navegar con el rol **del perfil cargado**, no con el del botón (design, decisión 5). Verificación: entrar con una cuenta cuyo perfil no coincide con el botón lleva al panel del perfil, sin rebote de `PrivateRoute`.
- [ ] 3.3 Si el `signIn` falla, **no** caer en la sesión de invitado: quedarse y mostrar el error del contexto (design, decisión 6). Verificación: con una contraseña incorrecta en `.env` no se entra a ningún panel y el motivo se lee en pantalla.
- [ ] 3.4 Deshabilitar los dos botones mientras la petición está en curso, con el `loading` que el contexto ya expone (design, Risks). Verificación: dos clics seguidos no lanzan dos `signIn`.
- [ ] 3.5 No tocar `AuthProvider.tsx`, `useActiveRole.ts` ni `PrivateRoute.tsx`: los tres ya hacen lo que hace falta (design, Context). Verificación: `git diff` no los incluye.

## 4. PAUSA: crear las cuentas (lo hace el usuario)

Crear cuentas y manejar contraseñas queda fuera de lo que hace esta sesión.

- [ ] 4.1 Entregar al usuario los pasos exactos y **detener la implementación**: crear dos cuentas en *Authentication → Users → Add user* con **Auto Confirm User** marcado, ejecutar en el editor SQL la sentencia que pone `role = 'tutor'` en el perfil del tutor, y rellenar las cuatro variables de su `.env` (design, decisión 1). Verificación: los pasos y la sentencia están escritos en el chat, con el correo como hueco a rellenar por el usuario, y la implementación está detenida.
- [ ] 4.2 Explicar por qué hace falta la sentencia: una cuenta creada desde el panel no lleva metadatos, así que `handle_new_user_profile` cae al rol por defecto y **las dos cuentas nacen `child`** (design, decisión 1). Verificación: la explicación acompaña a la sentencia, no va suelta.

## 5. Verificar el rol real de cada cuenta

- [ ] 5.1 Comprobar el `profiles.role` de cada cuenta leyéndolo **con su propia sesión**, no suponiéndolo (design, decisión 1). Verificación: el tutor devuelve `tutor` y el niño `child`. Si el tutor sale `child`, parar aquí: la política de inserción de `class_groups` lo rechazaría y nada de lo que sigue tendría sentido.
- [ ] 5.2 Comprobar que la aplicación entra de verdad: pulsar cada botón y confirmar que hay sesión con `access_token`, no marca de invitado. Verificación: `dev:skipAuth` **no** está en `localStorage` y el panel muestra el nombre real de la cuenta.

## 6. Verificar las políticas del paso 9

Con el `access_token` que cada sesión dejó en el navegador (design, decisión 2).
Es la razón de adelantar este paso, no un extra.

- [ ] 6.1 El tutor crea un salón: aceptado. El niño intenta crear uno: rechazado. Verificación: 201 y 403 respectivamente; el segundo prueba que la política exige rol `tutor`.
- [ ] 6.2 El niño solicita ingreso y el tutor ve la solicitud; comprobar que el tutor lee el **nombre** del niño, que es lo que justifica `profiles_select_own_students`. Verificación: la solicitud aparece con nombre, no con un identificador suelto.
- [ ] 6.3 El niño intenta insertar directamente su pertenencia: rechazado (specs del paso 9, «El ingreso pasa siempre por una solicitud aceptada»). Verificación: 403; no existe política de inserción sobre `class_memberships`.
- [ ] 6.4 El tutor acepta con `accept_join_request`: pertenencia creada y con `joined_at` relleno. Verificación: la fila existe y la solicitud queda `accepted` con `resolved_at`, que lo pone el disparador.
- [ ] 6.5 Siendo ya miembro, el niño intenta solicitar otro salón: rechazado (design del paso 9, «un alumno, un salón»). Verificación: la escritura falla por la subconsulta del `with check`, no por la interfaz.
- [ ] 6.6 El tutor rechaza una solicitud y el niño intenta borrarla: rechazado, el rechazo sobrevive. Verificación: la fila sigue con `status = 'rejected'`.
- [ ] 6.7 Con un salón de `capacity` 1 ya lleno, aceptar a un segundo niño: rechazado por cupo. Verificación: la RPC responde con el error de cupo y no crea la pertenencia.
- [ ] 6.8 Borrar los datos de prueba dejando las cuentas limpias para el paso 10; el borrado del salón es en sí la última comprobación de la cascada. Verificación: al borrar el salón desaparecen sus solicitudes y pertenencias.

## 7. Que nada llegue a producción

- [ ] 7.1 `npm run build` y después `grep` sobre `dist/` buscando el correo y la contraseña reales de las dos cuentas (design, decisión 3). Verificación: **cero coincidencias**. Si aparecen, mover la lectura a un módulo importado dinámicamente y repetir.
- [ ] 7.2 Comprobar que la aplicación arranca sin las cuatro variables. Verificación: renombrarlas temporalmente en `.env`, arrancar, y ver que entra por el camino de invitado sin que `config/env.ts` lance.

## 8. Documentación

- [ ] 8.1 En `docs/CONTEXT.md` §2.7, sustituir el párrafo «qué prueba ese 401 y qué no» por lo que quede realmente probado, **y por lo que siga sin estarlo** —la carrera del `for update` no se reproduce a mano—. Verificación: el documento no declara verificado nada que no se haya visto.
- [ ] 8.2 En `docs/CONTEXT.md` §2.2, recoger que el acceso sin login autentica de verdad cuando hay credenciales y cae en la marca local cuando no. Verificación: §2.2 deja de describir sólo el atajo de `localStorage`.
- [ ] 8.3 En `docs/ROADMAP.md`, marcar el paso 11 ✅ con el nombre del cambio y actualizar o retirar el cabo suelto «ninguna política de salones está probada de verdad» según el resultado. Verificación: el cabo suelto no sigue diciendo que no hay nada probado si ya lo hay.
- [ ] 8.4 En `openspec/config.yaml`, corregir el bloque `context`, que afirma que «no hay login real, se entra con una sesión de invitado». Verificación: `npx openspec doctor` no reporta errores de parseo.

## 9. Verificación final

- [ ] 9.1 `npm run lint`. Verificación: 0 errores y 0 warnings.
- [ ] 9.2 `npm run test:run`. Verificación: los 54 tests pasan **sin tocarlos**. No cubren autenticación, así que su valor aquí es sólo detectar daños colaterales.
- [ ] 9.3 `npm run build`. Verificación: termina sin errores.
- [ ] 9.4 `npx openspec validate usuarios-de-prueba --strict`. Verificación: el cambio sigue siendo válido.
