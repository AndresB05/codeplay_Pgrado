## Why

**La barra de XP va contra un número inventado, y no se entera de lo que el niño
acaba de ganar.** Las dos cosas, medidas el 17-sep-2026 con la cuenta de pruebas
y el J10 ya aplicado:

- El denominador es `PROVISIONAL_MAX_XP = 1000`, un número que no significa nada:
  el esquema no tiene umbrales y los nueve niveles dan 900 como máximo. La barra
  de un niño que se lo ha jugado todo perfecto se quedaría a un décimo del final.
- **El número no se refresca sin recargar.** Superado «Siempre adelante» con la
  ventana diciendo «+10 XP», la base pasó a **693** y la barra lateral siguió
  diciendo **683** —también al volver a la lista de mundos, que es navegación
  dentro de la página—. `user.xp` se lee al abrir la sesión y sólo lo reescribe
  el cambio de nombre.

Es el J11 del roadmap del juego, y lo que cierra es que el XP del J10 **se vea**.

## What Changes

- **La barra pasa a marcar tramos de 300 XP**, que es lo que da un mundo entero
  perfecto: `tramo = parte entera de (XP ÷ 300) + 1`. Sin techo, a propósito: los
  logros y las misiones repartirán XP y la barra tiene que seguir funcionando
  cuando aparezca.
- **Ese tramo se llama «Nivel Explorador»**, decidido por el usuario el
  17-sep-2026. Empieza en **1** con cero XP y sube cada vez que la barra se llena.
  No se llama «nivel» a secas porque en la misma pantalla hay «Nivel 3 - La
  escalera», que es otra cosa.
- **El niño ve en qué Nivel Explorador está**, no sólo la barra: en la barra
  lateral, en la barra superior y en su pantalla de cuenta.
- **El tutor ve las tres cosas** en la tabla de seguimiento —la barra, el XP
  acumulado y el Nivel Explorador—, decidido por el usuario. Sin el número, dos
  alumnos de 590 y 610 se verían al revés de como van.
- **El XP se refresca al terminar una partida**, sin recargar: la llamada que
  guarda el intento ya devuelve el total nuevo, y el panel lo aplica.
- **Y la ventana de nivel superado avisa cuando se sube de Nivel Explorador**,
  que es el momento en que ocurre.
- **`PROVISIONAL_MAX_XP` desaparece.** El máximo inventado deja de existir en vez
  de cambiar de valor: lo que hay ahora es un tramo, no un techo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`contenido-mundos`**. Cambia el requisito del XP en el panel del niño: tramos
  de 300 en vez de máximo provisional, el Nivel Explorador a la vista, y el valor
  al día sin recargar.
- **`salones-tutor`**. Cambia el requisito de la columna de XP de la tabla de
  seguimiento: deja de ser una barra muda y pasa a llevar el número y el nivel.
- **`juego-3d`**. La ventana de nivel superado dice cuándo se sube de Nivel
  Explorador.

## Impact

**Base de datos.** Nada: ni migración ni `db push`. `profiles.total_xp` ya es el
acumulado y `submit_level_attempt` ya devuelve el total nuevo —lo estrenó el
J10—, así que este paso es todo pantalla.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/constants/progress.ts` | `PROVISIONAL_MAX_XP` sale; entran el tramo de 300 y las dos cuentas del nivel |
| `apps/web/src/constants/progress.test.ts` | **Nuevo.** Los bordes del tramo: 0, 299, 300, 900 |
| `apps/web/src/components/ui/XPBar.tsx` | Recibe el XP y calcula su tramo; la etiqueta pasa a «Nivel Explorador N» y el relleno al hueco del tramo |
| `apps/web/src/components/dashboard/Sidebar/Sidebar.tsx` | Pasa el XP en vez del máximo |
| `apps/web/src/components/dashboard/student/StudentTopBar.tsx` | Igual |
| `apps/web/src/components/dashboard/student/StudentSettingsModule.tsx` | El Nivel Explorador junto al XP |
| `apps/web/src/components/dashboard/shared/StudentRosterTable.tsx` | La columna gana el número y el nivel |
| `apps/web/src/components/dashboard/WelcomeBanner/WelcomeBanner.tsx` | Sólo la llamada a `XPBar`, para que siga compilando. **Sigue huérfano y sigue esperando a que se rehaga** |
| `apps/web/src/components/dashboard/WelcomeBanner/WelcomeBanner.helpers.ts` | **Se borra.** Nadie lo importa, y su regla de niveles de 1000 en 1000 contradice a la de este paso |
| `apps/web/src/context/AuthContext.ts` y `AuthProvider.tsx` | Una acción que aplica el XP que devuelve el servidor |
| `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` | La llama con el total de la partida |
| `apps/web/src/components/dashboard/student/LevelCompleteDialog.tsx` | El aviso de subida de nivel |

**Documentación.** `docs/CONTEXT.md` §2.7 y §3, `docs/DISENO-DEL-JUEGO.md` §3,
`docs/ROADMAP.md` §3.2 y `docs/ROADMAP-JUEGO.md`.

**Lo que NO entra:**

- **El catálogo de logros y su XP**, que es el paso 22. La barra se diseña para
  aguantarlo sin volver a tocarla, que es justo por qué no lleva techo.
- **La racha**, que sigue sin que nadie la escriba.
- **Rehacer `WelcomeBanner`, `SidebarPlayerCard` ni `LeaderBoard`**, huérfanos con
  la paleta anterior. Del banner se toca una línea para que compile, y nada más.

**Y una limpieza que sí entra, por estar justo en el camino:**
`WelcomeBanner.helpers.ts` se borra entero. Sus tres funciones de XP calculan
niveles **de 1000 en 1000** —la regla equivocada del mismo concepto que este paso
define— y su `getGreeting` lo duplica el propio banner dentro del componente.
Medido: **nadie importa ese archivo**, ni siquiera el huérfano de su carpeta.
Dejarlo ahí es una trampa para quien rehaga el banner.
