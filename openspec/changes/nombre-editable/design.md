## Context

Ver `proposal.md` — Why. Lo que aquí importa del estado actual son cuatro hechos
del repositorio, todos comprobados:

1. **La fontanería existe y no la usa nadie.** `update_my_profile` está aplicada
   desde la migración 0006 con `grant execute … to authenticated`,
   `profileService.updateProfile` la llama y `useProfile()` la expone. `grep` no
   encuentra un solo consumidor de `useProfile`.
2. **`useProfile()` mantiene su propia copia del perfil.** Su `updateProfile`
   hace `setProfile(result.data)` sobre un estado local que nadie más lee.
3. **Siete sitios vivos leen `user.fullName` desde `AuthProvider`**, no desde
   `useProfile`: `Sidebar.tsx:106`, `StudentSettingsModule.tsx:30`,
   `StudentWorldsModule.tsx:299`, `TeacherSettingsModule.tsx:20`,
   `TeacherSidebar.tsx:30`, `TeacherTopBar.tsx:19` y `TeacherDashboard.tsx:32`.
4. **La RPC no valida `full_name` en absoluto.** El cuerpo es
   `full_name = coalesce(input_full_name, full_name)`: sin `trim`, sin longitud y
   sin rechazar la cadena vacía. La columna es `text not null default ''`, sin
   `check`.

## Goals / Non-Goals

**Goals:**

- Que el nombre nuevo aparezca en los siete sitios **sin tocar ninguno de los
  siete** y sin recargar.
- Que la longitud del nombre tenga **una sola declaración** en toda la
  aplicación, heredada por el registro y por Ajustes.
- Que el tratamiento genérico del tutor tenga **una sola declaración**, como ya
  la tiene el del niño.

**Non-Goals:**

- Retirar `useProfile()` o `profileService.updateProfile`. El servicio se usa; el
  hook se queda como está, sin consumidores, porque quitarlo es otro cambio.
- Validar el nombre en la base. Ver la decisión 4.
- Unificar el mínimo de contraseña que `ChangePasswordForm.schema.ts` duplica
  pese a decir que lo hereda. Es el mismo tipo de cabo, pero no es éste.

## Decisions

### 1. La acción vive en `AuthProvider`, y `setUser` es lo que la hace visible

`AuthContextValue` gana `updateFullName(fullName: string): Promise<boolean>`. El
provider llama a `profileService.updateProfile({ fullName }, …)` y hace `setUser`
con el perfil que devuelve la RPC.

**Alternativa descartada: que el panel llame a `useProfile()`.** Es la vía que ya
está construida y la que parece obvia, y es justo la que rompe. `useProfile`
guarda el perfil en un estado suyo; los siete sitios de arriba leen el de
`AuthProvider`. El nombre cambiaría en la base y en el estado del hook, y la
pantalla seguiría enseñando el viejo hasta recargar. El fallo se leería como «no
se guardó», y el test obvio —comprobar que el servicio se llamó— pasaría igual.

**Alternativa descartada: reconsultar la sesión al guardar.** Forzar un
`syncSessionProfile` costaría un viaje de ida y vuelta extra para recuperar un
dato que la RPC **ya devolvió** en la misma respuesta.

**El precedente es `updateRole`** (`AuthProvider.tsx:315`): también escribe por
una RPC de perfil y también hace `setUser(result.data)`. Se copia esa forma, con
una diferencia: `updateRole` devuelve el perfil porque quien llama **navega** con
ese rol; aquí nadie navega, así que basta un booleano, como en `changePassword`.

**Trampa que no hay que repetir:** `mapProfileRowToUser` recibe el correo
**aparte**, porque no está en `profiles`. `updateRole` le pasa
`session?.user.email ?? null` y hay que pasárselo igual. Sin eso, guardar el
nombre borraría el correo de la pantalla de cuenta, que sale del mismo objeto
`user`.

### 2. No se toca `loading`

Por lo mismo que las tres acciones de contraseña y que `updateRole`, y está
escrito en el propio archivo: `loading` significa «la sesión se está
resolviendo», y las dos guardas de ruta cambian su subárbol entero por un
spinner. Aquí la sesión ya está resuelta y lo que falta es un campo. Encenderlo
desmontaría el formulario a mitad de operación y se llevaría por delante el
mensaje que hay que enseñar. El panel lleva su propio indicador de envío.

### 3. Un componente en `shared/`, montado por las dos pantallas de Ajustes

`components/dashboard/shared/ChangeNamePanel.tsx`, con la misma estructura que
`ChangePasswordPanel.tsx`: plegado tras un botón, formulario con su error y su
confirmación, y `useAuth()` como única dependencia de datos.

La cabecera de `ChangePasswordPanel` ya explica por qué: las dos pantallas de
Ajustes tienen marcos distintos y el mismo formulario, y dos copias divergirían
al primer arreglo. No hay motivo para volver a decidirlo.

**Diferencia con el panel de contraseña:** el campo **arranca con el nombre
actual**, no vacío. Una contraseña nueva no puede partir de la anterior; un
nombre casi siempre se corrige, no se reinventa.

### 4. La longitud se declara en un archivo propio, y es de cliente

`components/auth/fullName.schema.ts` exporta la regla —`z.string().trim()` con
mínimo **2** y máximo **60**—, y la importan `SignupForm.schema.ts` y el panel.

**Alternativa descartada: exportarla desde `SignupForm.schema.ts`.** Haría que
Ajustes dependiera del módulo del formulario de registro por un dato que no es
propio de ninguno de los dos. Y es exactamente la forma que ya salió mal una vez:
`ChangePasswordForm.schema.ts` dice que su mínimo «se hereda de `signupSchema`» y
en realidad lo copia, con el `6` escrito a mano en los dos archivos.

**El máximo, 60, se decide aquí y no al implementar.** No hay precedente en el
repositorio: el único límite de texto que existe es el `3–30` del `username`, que
es un identificador y no un nombre. 60 caracteres cubren de sobra un nombre
completo con dos apellidos —«María Fernanda Gutiérrez Rodríguez» son 33— y siguen
siendo un ancho que la tabla del salón puede pintar. La cifra vive en un solo
sitio: subirla o bajarla es cambiar un número.

**Alternativa descartada: un `check` en la columna.** Exigiría migración —que
este cambio no lleva— y podría rechazar filas ya guardadas: `full_name` nunca ha
tenido validación, así que nada garantiza que lo almacenado cumpla lo que se
decida hoy. Queda anotado como lo que es: **la única defensa contra un nombre de
500 caracteres es el cliente**, y quien llame a la RPC por otra vía se la salta.

**El `trim` obliga a cerrar el envío del registro, y se cierra aquí.**
`Signup.tsx:87` manda el estado en crudo y no `parsedForm.data`. Hoy da lo mismo,
porque sin `trim` los dos valores son idénticos: **la divergencia la introduciría
este cambio**, dejando el registro validando recortado y guardando sin recortar.
Un hueco que abre este cambio no se anota como cabo suelto, se cierra: el
registro pasa a enviar `parsedForm.data.fullName`, igual que el panel.

### 5. `FALLBACK_TEACHER_NAME` va junto a `FALLBACK_STUDENT_NAME`

En `services/classrooms.service.ts`, exportada, e importada por los cuatro
sitios.

No es sólo simetría: ese valor **llega a la base de datos**.
`TeacherDashboard.tsx:32` lo calcula, se lo pasa a `TeacherGroupsModule`, que se
lo pasa a `CreateGroupForm` como `defaultTeacherName`, y `CreateGroupForm.tsx:52`
lo escribe en `classrooms.teacher_name` cuando el campo se deja vacío. Es
exactamente el camino del tratamiento del niño, que vive ahí por lo mismo.

**Alternativa descartada: dejarla exportada desde `TeacherDashboard.tsx`.** Tres
componentes de `components/dashboard/teacher/` importarían de `pages/`, que es la
dirección contraria a la del resto del repositorio.

**Alternativa descartada: un `constants/identity.ts` nuevo.** Partiría en dos
archivos un par de valores que son el mismo concepto, y el precedente de que un
componente importe `FALLBACK_STUDENT_NAME` del servicio ya existe
(`Sidebar.tsx:6`).

### 6. El nombre del profesor de un salón no se sincroniza, y es correcto

Cambiar el nombre del perfil **no** cambia el «Profesor …» de los salones que ese
tutor ya creó. No es un descuido que haya que arreglar después: la migración 0013
lo decidió al declarar la columna, y lo dejó escrito encima de ella —«El profesor
a cargo es texto libre que el tutor escribe al crear el salón, y no tiene por qué
coincidir con su propio nombre de perfil. `tutor_id` es la identidad; esto es una
etiqueta»—.

`CreateGroupForm` usa el nombre del perfil sólo como **valor por defecto** del
campo, que el tutor puede sobrescribir; de ahí en adelante la etiqueta es suya.
Sincronizarla al renombrar el perfil contradiría esa decisión y además pisaría lo
que el tutor hubiera escrito a mano.

### 7. El test comprueba la pantalla, no el servicio

Se monta `ChangeNamePanel` dentro de un `AuthProvider` **real**, con
`profileService.updateProfile` sustituido para que devuelva un perfil con el
nombre nuevo, y junto al panel un consumidor que pinta `user.fullName`. Se guarda
y se comprueba que **lo pintado cambió**.

Es el único test que distingue este diseño del que no funciona: uno que compruebe
que `updateProfile` fue llamado pasa igual con la versión por `useProfile()`, que
deja la pantalla desactualizada. `AuthProvider.test.tsx` ya tiene montado el
patrón de sonda y de mock parcial de `profile.service`, así que se reutiliza.

## Risks / Trade-offs

- **El cliente es la única validación de longitud** → Se acepta y se anota en
  `docs/CONTEXT.md`. Cerrarlo de verdad es un `check` con migración, y el encargo
  excluye migraciones. Mientras tanto, a la RPC sólo se llega con una sesión
  `authenticated`, y en la aplicación sólo por este formulario.
- **Quien vea «Profesor …» en un salón puede estar viendo un nombre anterior** →
  Es la decisión 6, no un riesgo que se mitigue: esa etiqueta nunca prometió
  seguir al perfil. Lo que sí hay que evitar es *tratarla* como si lo prometiera,
  y por eso queda escrito.
- **`useProfile()` se queda con cero consumidores y ahora también con una vía
  paralela de escritura** → Es deuda que ya existía; este cambio la hace más
  visible, no mayor. Retirarlo o replantearlo es su propio cambio.
- **El delta modifica un requisito que el paso 28 acaba de escribir** → Se copia
  entero y se amplía sólo el punto del nombre. Al archivar hay que leer las líneas
  que el sync reemplaza, que es la comprobación 8 de `ROADMAP.md` §1.3.

## Migration Plan

No hay. Ninguna migración, ningún `db push`, ninguna regeneración de
`database.types.ts`. Revertir es revertir el commit.
