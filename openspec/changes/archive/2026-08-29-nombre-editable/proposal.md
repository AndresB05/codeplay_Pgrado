## Why

El nombre que la plataforma enseña de cada persona —en la barra lateral, en la
cabecera, en el saludo del panel y en la tabla del salón— sale de
`profiles.full_name`, y **hoy no hay forma de cambiarlo**. Lo pidió el usuario en
estos términos: que la gente pueda cambiar su nombre «para que se distingan mejor
en los salones, o que el tutor no tenga que andar preguntando quién es quién».

La fontanería está entera y **sin un solo consumidor**: la RPC
`update_my_profile` existe desde la migración 0006 con `grant execute … to
authenticated`, `profileService.updateProfile` la llama, y `useProfile()` la
expone. Nadie las usa. Lo que falta es interfaz.

## What Changes

- **Un panel de nombre en las dos pantallas de Ajustes**, con la forma que ya
  inventó `ChangePasswordPanel`: un componente en `components/dashboard/shared/`
  que montan `StudentSettingsModule` y `TeacherSettingsModule`, porque los dos
  marcos son distintos y el formulario es el mismo.
- **La acción vive en `AuthProvider`, no en `useProfile()`.** `AuthContextValue`
  gana una forma de escribir el nombre, y el provider hace `setUser` con el perfil
  que devuelve la RPC. Es lo que ya hace `updateRole`. Escribir por `useProfile()`
  —que mantiene su propia copia— cambiaría el nombre en la base y dejaría el viejo
  en pantalla hasta recargar, en los **siete** sitios que leen `user.fullName`
  desde `AuthProvider`.
- **Sólo `full_name`.** Nada de `username`, avatar ni país, aunque la RPC los
  acepte: el nombre de usuario lo rechaza la RPC con un `22023` crudo si no cumple
  3–30, y `profile.service.ts` es justo el servicio que sigue devolviendo inglés
  (`docs/CONTEXT.md` §4.5).
- **La longitud del nombre se declara una sola vez y la heredan el registro y este
  formulario.** El mínimo ya existe —`min(2)` en `SignupForm.schema.ts:7`— y se
  reutiliza en vez de copiarse. **El máximo no existe hoy en ninguna parte**, ni
  siquiera en el registro: se estrena aquí, en la misma forma compartida, para que
  las dos puertas queden acotadas a la vez.
- **La validación es de cliente, y queda anotada como tal.** `update_my_profile`
  no valida `full_name` en absoluto: `coalesce(input_full_name, full_name)`, sin
  `trim`, sin longitud, sin rechazar la cadena vacía. Un `check` en la base
  exigiría migración y arriesgaría rechazar filas ya guardadas.
- **«Sr. Robot» deja de estar copiado en cuatro sitios.** `TeacherDashboard.tsx:12`
  ya lo tiene como constante, `FALLBACK_TEACHER_NAME`, y los otros tres
  —`TeacherSettingsModule`, `TeacherSidebar`, `TeacherTopBar`— la ignoran copiando
  el literal. Una sola declaración, importada por los cuatro. Es el trozo que el
  paso 28 dejó fuera porque su encargo decía «el panel del niño», y entra aquí
  porque la pantalla de Ajustes del tutor es donde va el campo.

Fuera de alcance, a propósito:

- **No cierra el punto 4 del paso 14** (`docs/ROADMAP.md` §3.4): apodo elegido y
  proyección doble del roster —nombre real al tutor, apodo a los compañeros—. Esto
  da control sobre **un solo** nombre, el que ven los dos por igual.
- Avatar, país y nombre de usuario.
- Migraciones y `db push`.
- `SidebarPlayerCard.tsx:20` y `WelcomeBanner.tsx:26`, que también llevan el
  literal `'Explorador'`: son huérfanos y se rehacen en su paso.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `auth-sesion`: se añaden dos requisitos. Que quien tenga sesión pueda **cambiar
  su propio nombre** desde Ajustes, con el cambio reflejado de inmediato en todas
  las superficies que lo enseñan y sin recargar. Y que el **tratamiento genérico
  del tutor** sin nombre sea uno solo, como ya lo es el del niño desde el paso 28.

La capacidad es `auth-sesion` y no otra porque es quien ya posee lo que el panel
enseña de la persona: su `Purpose` dice que «lo que enseña del usuario es lo que
el perfil dice de él», y de ella son ya el requisito de cambiar la contraseña
desde Ajustes y el de que el panel muestre la identidad real.

## Impact

**Base de datos: ninguno.** No hay migración y **no hace falta `db push`**. La RPC
`update_my_profile` está aplicada desde `supabase/migrations/202606030006_create_rpc_functions.sql`
con su `grant execute … to authenticated`, y este cambio sólo la llama. Tampoco se
regenera `types/database.types.ts`: no cambia ninguna firma.

**Código.**

- `apps/web/src/components/dashboard/shared/ChangeNamePanel.tsx` — **nuevo**. El
  formulario, calcado en forma de `ChangePasswordPanel.tsx`.
- `apps/web/src/components/auth/fullName.schema.ts` — **nuevo**. La regla de
  longitud del nombre, declarada una vez.
- `apps/web/src/components/auth/SignupForm.schema.ts:7` — pasa a importar esa
  regla en vez de llevar su propio `min(2)`.
- `apps/web/src/context/AuthContext.ts` — `AuthContextValue` gana la acción.
- `apps/web/src/context/AuthProvider.tsx` — la implementa con `setUser`, junto a
  `updateRole` (línea 315), que es el precedente.
- `apps/web/src/test/buildAuthValue.ts` — el doble del contexto, que se rompe cada
  vez que `AuthContextValue` gana una acción.
- `apps/web/src/components/dashboard/student/StudentSettingsModule.tsx` y
  `apps/web/src/components/dashboard/teacher/TeacherSettingsModule.tsx:20` — montan
  el panel; el segundo, además, deja de copiar el literal.
- `apps/web/src/components/dashboard/teacher/TeacherSidebar.tsx:30`,
  `apps/web/src/components/dashboard/teacher/TeacherTopBar.tsx:19` y
  `apps/web/src/pages/TeacherDashboard/TeacherDashboard.tsx:12` — la declaración
  única de `FALLBACK_TEACHER_NAME` y sus tres importaciones.
- `apps/web/src/services/classrooms.service.ts:64` — donde va esa declaración,
  junto a `FALLBACK_STUDENT_NAME`.

**Lo que no se toca, y se dice para que nadie lo arregle de paso:**
`profileService.updateProfile` y `useProfile()` se quedan como están —el panel no
pasa por ellos, pero el servicio sí, y su firma sirve tal cual—; el mínimo de
contraseña de `ChangePasswordForm.schema.ts` sigue duplicado, que es otro cabo y
no éste; y `SidebarPlayerCard.tsx` y `WelcomeBanner.tsx` siguen con su literal.
