# CodePlay — Hoja de ruta

> **En qué orden se construye el proyecto y quién hace cada parte.**
> Última actualización: **25 de agosto de 2026**.

Este documento responde a *cuándo* y *quién*.
Para *qué* y *por qué*, ver [`docs/CONTEXT.md`](CONTEXT.md) §3, que describe cada
bloque de trabajo con sus dependencias. Las etiquetas P1–P6 que aparecen abajo
son las de ese documento; aquí no se repite su contenido.

Meta de referencia: una plataforma **desplegada y usable por niños y profesores
reales**, con el juego integrado. Para defender el proyecto de grado basta con
llegar al paso 23 y añadir el 27.

---

## 1. Cómo se trabaja

### 1.1 Dos sesiones, papeles distintos

El trabajo se reparte entre dos sesiones de Claude Code sobre **el mismo
directorio** — no son copias separadas, comparten disco y repositorio:

| Papel | Qué hace |
| --- | --- |
| **Sesión que ejecuta** | Recibe el encargo, corre `/opsx:propose`, `/opsx:apply` y `/opsx:archive`, escribe el código |
| **Sesión que revisa** | Redacta los encargos, y **verifica el resultado leyendo el repositorio**, no el relato de la otra sesión |

La verificación se hace contra el disco: `git log`, `npm run test:run`,
`npx openspec validate`, y lectura directa de los archivos. Un resumen que suena
competente no es prueba de nada.

**Cuidado con las ediciones simultáneas.** Al compartir directorio, dos sesiones
pueden pisarse en el mismo archivo. Antes de editar algo que la otra tenga a
medias, comprobar `git status`.

### 1.2 Un cambio cada vez

Cada paso es un cambio de OpenSpec, y conviene una sesión nueva por cambio: las
conversaciones largas se comprimen y pierden detalle.

Criterio de vía, según `CLAUDE.md`:

- **Cambia lo que hace la aplicación** → `/opsx:propose`, con delta de spec.
- **Herramienta, documentación o limpieza** → `skip_specs: true` en su
  `.openspec.yaml`. **Nunca inventar un requisito** para que `validate` pase.

### 1.3 Antes de aprobar un `apply`

Revisar la propuesta, no solo validarla. Cuatro comprobaciones que ya han
evitado problemas reales:

1. Que el `.openspec.yaml` declare `skip_specs` **sólo** si de verdad no hay
   deltas, y que no exista una carpeta `specs/` con requisitos inventados.
2. Que las tareas incluyan verificación final con `lint`, `test:run` y `build`.
3. Que el alcance no se desborde más allá de lo encargado.
4. Que las herramientas que usan las verificaciones **existan en la máquina**.
   Ya pasó: una tarea verificaba con `gh`, que no está instalado.

---

## 2. Secuencia

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente
★ = añadido durante la planificación, no estaba en §3 de `CONTEXT.md`

| Nº | Paso | Estado | Vía |
| --- | --- | --- | --- |
| 1 | Crear `CLAUDE.md` en la raíz | ✅ | directo |
| 2 | Borrar código muerto: `pages/Landing/sections/`, `framer-motion` | ✅ | directo |
| 3 | Sembrar `openspec/specs/` — 7 capacidades, 40 requisitos | ✅ | directo |
| 4 | ★ Montar Vitest y Testing Library, 54 tests sobre el store | ✅ | `infraestructura-tests` |
| 5 | ★ CI en GitHub Actions: lint, tests y build | ✅ | `ci-github-actions` |
| 6 | Crear el proyecto de Supabase y rellenar `.env` | ✅ | **usuario** |
| 7 | Columna `profiles.role`, disparador y esquema aplicado | ✅ | `backend-supabase-real` |
| 8 | Regenerar `database.types.ts` y arreglar sus consumidores | ✅ | *(unido al 7)* |
| 9 | Migración de las 4 tablas de salones + RLS + grants | ⬜ | P1 |
| 10 | `classrooms.service.ts` y reescribir `ClassroomsProvider` | ⬜ | P3 |
| 11 | ★ Usuarios de prueba reales y reapuntar el botón «Sin login» | ⬜ | — |
| 12 | Login y registro reales con rol | ⬜ | P2 |
| 13 | Recuperar y cambiar contraseña | ⬜ | P2 |
| 14 | ★ Consentimiento del acudiente y política de privacidad | ⬜ | — |
| 15 | Google OAuth | ⬜ | P2 |
| 16 | Persistir la asignación de misiones | ⬜ | P5 |
| 17 | Reportes de habilidades sobre progreso real | ⬜ | P5 |
| 18 | ★ Notificaciones en tiempo real (Supabase Realtime) | ⬜ | — |
| 19 | Invitaciones por correo reales y enlace canjeable | ⬜ | P5 |
| 20 | Contrato de integración y pantalla de nivel con contenedor | ⬜ | P4 |
| 21 | Escritura de progreso y XP desde el juego | ⬜ | P4 |
| 22 | Diseñar e implementar rachas y logros — **no existe nada**, incluye la tabla de catálogo | ⬜ | P4 |
| 23 | Unity en `apps/game/`, Git LFS y build de WebGL | ⬜ | P4 |
| 24 | Retirar la sesión de invitado | ⬜ | — |
| 25 | ★ Responsive, accesibilidad y `ErrorBoundary` | ⬜ | — |
| 26 | Ilustraciones con Higgsfield | ⬜ | P6 |
| 27 | ★ Despliegue y URL de demo | ⬜ | — |

### 2.1 Decisiones de orden que conviene no deshacer

**Los tests (4) van antes del paso 10**, no después. El paso 10 reescribe
`ClassroomsProvider` entero, que es el corazón de la aplicación. Los 54 tests
existen para que ese refactor tenga red. Si durante el paso 10 falla un test que
antes pasaba, **esa es la señal que se pagó por tener**: no se «arregla» tocando
el test.

**Retirar la sesión de invitado (24) va después del juego**, no antes. Decisión
del usuario: quiere poder entrar de un clic mientras prueba la integración. El
coste es nulo, porque esa sesión está limitada a desarrollo por
`import.meta.env.DEV` y nunca llega a producción.

**El paso 22 está separado del 21** porque no son el mismo trabajo. Progreso y
XP tienen la fontanería escrita —las RPC `upsert_my_progress` y
`create_level_attempt` existen—, pero **rachas y logros no tienen ni una línea**:
las columnas `current_streak` y `max_streak` están en `profiles` y nada las
calcula, y no hay lógica que decida cuándo se concede un logro.

Este paso incluye **diseñar la tabla de catálogo de logros**, que no existe. Al
aplicar el esquema (P1) se comprobó que `achievements` es el registro de lo
concedido a cada niño —`user_id`, `achievement_key`, `title`, `awarded_xp`,
`unlocked_at`, con `unique (user_id, achievement_key)`—, no la lista de logros
posibles con sus condiciones de desbloqueo. Mientras esa tabla no exista, la
sala de trofeos sólo puede mostrar lo conseguido: el requisito de
`contenido-mundos` se ajustó a esa realidad y habrá que volver a ampliarlo aquí.

**El apartado gráfico (26) queda casi al final a propósito.** No bloquea ninguna
funcionalidad y el foco actual son las funcionalidades.

### 2.2 Pasos que requieren a una persona

Estos no los puede hacer una sesión de Claude, porque implican crear cuentas o
introducir credenciales:

| Paso | Qué hace el usuario |
| --- | --- |
| 6 | Crear el proyecto en Supabase y copiar URL y clave publishable al `.env` |
| 7 | `npx supabase login`, `link --project-ref` y `db push` — piden credenciales por consola |
| 15 | Dar de alta Google OAuth en el panel de Supabase |
| 19 | Contratar el servicio de correo |
| 23 | Instalar Unity y crear el proyecto |
| 27 | Configurar el despliegue |

Fuera de la secuencia, siguen pendientes dos tareas de cuenta que dejó anotadas
el commit `7c84a93`: borrar los secretos `AZUREAPPSERVICE_*` en los ajustes de
GitHub, y reapuntar el Deployment Center de la App Service «gym» al repositorio
que le corresponde. Mientras siga apuntando aquí, Azure puede volver a escribir
su workflow en `.github/workflows/`.

---

## 3. Cabos sueltos detectados

Cosas descubiertas durante la ejecución que no estaban previstas y no deben
perderse:

| Hallazgo | Dónde se resuelve |
| --- | --- |
| El invariante «un alumno, un salón» lo sostiene el enrutado de `StudentClassroomModule`, no el store: `requestJoin()` no comprueba la pertenencia actual | Paso 10 — tarea 5 de P3 en `CONTEXT.md` |
| `levels` guarda `starter_code`, `validation_rules` y `programming_language`: el esquema se diseñó para un editor de código en el navegador, no para Unity | Paso 20 |
| No existe catálogo de logros: `achievements` registra los concedidos a cada niño, no los posibles con sus condiciones. La sala de trofeos sólo puede listar lo conseguido, y el requisito de `contenido-mundos` se ajustó a eso | Paso 22 |

---

## 4. Al terminar cada paso

1. Marcar aquí el paso como ✅ y anotar el nombre del cambio de OpenSpec.
2. Seguir las reglas de `CLAUDE.md`: `lint`, `test:run` y `build`; actualizar
   `docs/CONTEXT.md` según el tipo de cambio; replicar en `openspec/config.yaml`
   lo que toque a §1.
3. Enumerar rutas explícitas en `git add`. Con varios cambios vivos, el árbol
   casi nunca contiene sólo lo que se está commiteando.
