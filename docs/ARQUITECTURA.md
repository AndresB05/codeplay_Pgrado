# CodePlay — Arquitectura y modelo de datos

> Diagramas del **objetivo 2** del proyecto de grado: arquitectura de
> componentes, arquitectura de despliegue y modelo entidad–relación.
> Hechos contra el código y el esquema a 27-oct-2026: las tablas y columnas
> salen de `apps/web/src/types/database.types.ts`, que se genera de la base
> real, y las claves foráneas de `supabase/migrations/`.
>
> Las fuentes son los bloques Mermaid de este archivo (GitHub los dibuja); las
> imágenes para el documento escrito están en [`diagramas/`](diagramas/).

---

## 1. Diagrama de componentes

![Diagrama de componentes](diagramas/componentes.png)

```mermaid
flowchart TB
    subgraph NAV["Navegador · SPA CodePlay"]
        direction TB
        subgraph PRES["Presentación"]
            ROUTER["Enrutador<br/>AppRouter · PrivateRoute · PublicRoute"]
            PAGES["Páginas<br/>Landing · Login · Signup · Invite · Legal<br/>Panel del niño · Panel del tutor"]
            UI["Componentes<br/>dashboard/student · dashboard/teacher<br/>dashboard/shared · home · decor"]
        end
        subgraph JUEGO["Módulo de juego · src/game"]
            EDITOR["Editor de bloques<br/>Blockly"]
            INTERP["Intérprete del programa<br/>program · interpreter · movement · score"]
            ESCENA["Escena 3D<br/>three.js + React Three Fiber"]
        end
        subgraph ESTADO["Estado y datos"]
            AUTHP["AuthProvider<br/>sesión y rol"]
            CLASSP["ClassroomsProvider<br/>store de salones · useClassrooms()"]
            HOOKS["Hooks de datos<br/>useWorlds · useProgress · useAchievements<br/>useLeaderboard · useMissionAssignments…"]
        end
        SERV["Servicios · devuelven { data, error }<br/>auth · profile · worlds · progress · attempts · classrooms<br/>invitations · missions · achievements · leaderboard · studentProgress"]
        CLIENT["Cliente supabase-js<br/>lib/supabase.ts"]
    end

    subgraph SUPA["Supabase (BaaS)"]
        direction TB
        SAUTH["Auth<br/>contraseña · Google · recuperación"]
        REST["API REST · PostgREST<br/>tablas, vistas y RPC"]
        RT["Realtime<br/>cambios en salones y misiones"]
        subgraph PG["PostgreSQL"]
            TABLAS["Tablas<br/>perfiles · contenido · progreso<br/>salones · misiones · logros"]
            RLS["Políticas RLS<br/>por rol y pertenencia"]
            RPC["Funciones RPC security definer<br/>submit_level_attempt · accept_join_request<br/>redeem_invitation · assign_mission_to_groups…"]
            VISTAS["Vistas de lectura<br/>classroom_roster · classroom_level_progress<br/>leaderboard_weekly…"]
        end
    end

    GOOGLE["Google Identity<br/>OAuth 2.0"]

    ROUTER --> PAGES --> UI
    UI --> JUEGO
    EDITOR -- "programa (JSON)" --> INTERP -- "pasos" --> ESCENA
    UI --> AUTHP & CLASSP & HOOKS
    AUTHP & CLASSP & HOOKS --> SERV
    INTERP -. "intento enviado" .-> SERV
    SERV --> CLIENT
    CLIENT -- "HTTPS + JWT" --> SAUTH
    CLIENT -- "HTTPS + JWT" --> REST
    CLIENT -- "WebSocket" --> RT
    REST --> RLS --> TABLAS
    REST --> RPC --> TABLAS
    REST --> VISTAS --> TABLAS
    RT -. "replica cambios" .- TABLAS
    SAUTH -- "OAuth" --> GOOGLE
```

**Cómo se lee.** La aplicación es una SPA (React 18, TypeScript y Vite) que corre entera en el navegador y
no tiene servidor propio: todo lo que persiste lo hace Supabase. Tres reglas de
la arquitectura se ven en el diagrama:

- **Una sola salida al backend.** Las vistas no llaman a Supabase: pasan por los
  proveedores y los hooks, que usan los servicios, que usan el único cliente.
  Los salones tienen además su frontera propia, `ClassroomsProvider`.
- **El servidor decide lo que vale puntos.** El juego ejecuta el programa en el
  navegador para animarlo, pero la puntuación, el XP, las rachas, los logros y
  las misiones los calcula `submit_level_attempt` en la base, a partir del
  programa enviado. El cliente no puede escribirse el progreso.
- **La seguridad está en la base.** Cada tabla tiene RLS; lo que una política no
  puede expresar sin ciclos o sin dar de más va en funciones `security definer`.

## 2. Diagrama de despliegue

![Diagrama de despliegue](diagramas/despliegue.png)

```mermaid
flowchart LR
    subgraph CLIENTE["«dispositivo» Computador o tableta del usuario"]
        BROWSER["«entorno» Navegador web<br/>SPA CodePlay<br/>(HTML + JS + modelos .glb)"]
    end

    subgraph DEV["«entorno» Desarrollo"]
        REPO["Repositorio Git<br/>GitHub · rama main"]
        CI["GitHub Actions<br/>lint · tests · build<br/>Node 22.17.1"]
        BUILD["Equipo del desarrollador<br/>npm run build:unac"]
    end

    subgraph UNAC["«nodo» Servidor UNAC · Ubuntu 22.04"]
        APACHE["Apache 2.4 · mod_userdir<br/>~/public_html estático<br/>.htaccess FallbackResource"]
    end

    subgraph SUPABASE["«nodo» Supabase Cloud · proyecto CodePlay"]
        GOTRUE["Auth (GoTrue)"]
        POSTGREST["PostgREST"]
        REALTIME["Realtime"]
        DB[("PostgreSQL<br/>48 migraciones<br/>RLS + RPC")]
        MAIL["Correo de Auth<br/>recuperación de contraseña"]
    end

    GOOGLE["«nodo externo» Google Identity"]

    REPO -- "push / pull request" --> CI
    REPO --> BUILD
    BUILD -- "tar + scp por VPN" --> APACHE
    BROWSER -- "HTTPS · ingenieria.unac.edu.co/~andres.blanco/" --> APACHE
    BROWSER -- "HTTPS · REST + JWT" --> POSTGREST
    BROWSER -- "HTTPS · sesión" --> GOTRUE
    BROWSER -- "WSS · suscripciones" --> REALTIME
    BROWSER -- "redirección OAuth" --> GOOGLE
    GOTRUE -- "OAuth 2.0" --> GOOGLE
    GOTRUE --> DB
    POSTGREST --> DB
    REALTIME --> DB
    GOTRUE --> MAIL
```

**Estado.** Es el despliegue **definitivo** desde el 28-oct-2026 (`ROADMAP.md`
§27.2): la app vive en `https://ingenieria.unac.edu.co/~andres.blanco/`, servida
por el Apache de la universidad desde la carpeta del usuario. La subida es
manual porque el usuario no tiene `sudo` y el servidor sólo se alcanza con la
VPN. El provisional de la prueba preliminar del 25-sep-2026 sigue en Vercel
(`https://codeplay-pgrado-web.vercel.app`) y no se dibuja.

El navegador habla **directamente** con Supabase: Apache sólo sirve archivos.
La clave anónima viaja en el bundle por diseño; lo que protege los datos es el
JWT de la sesión y las políticas RLS de la base.

## 3. Modelo entidad–relación

El modelo se parte en dos diagramas para que quepa en una página; los une
`auth.users`, que aparece en ambos.

### 3.1 Usuarios, contenido y progreso

![Modelo entidad–relación: usuarios, contenido y progreso](diagramas/er-contenido-progreso.png)

```mermaid
erDiagram
    AUTH_USERS["auth.users"] {
        uuid id PK
        text email
    }
    PROFILES["profiles"] {
        uuid id PK, FK "= auth.users.id"
        text username UK "nullable"
        text full_name
        user_role role "child | tutor"
        boolean is_role_declared
        text avatar_key
        text country_code
        int total_xp
        int current_streak
        int max_streak
        date last_streak_day
        timestamptz last_seen_at
        text_arr seen_world_intros
    }
    WORLDS["worlds"] {
        uuid id PK
        text slug UK
        text title
        text description
        text region_label
        text mascot
        text theme_color
        text accent_color
        int sort_order
        boolean is_published
    }
    LEVELS["levels"] {
        uuid id PK
        uuid world_id FK
        text slug "UK con world_id"
        text title
        text narrative
        text description
        text difficulty "beginner | intermediate | advanced"
        jsonb validation_rules "config del nivel"
        text starter_code
        text programming_language
        int xp_reward
        int sort_order "UK con world_id"
        boolean is_published
    }
    USER_PROGRESS["user_progress"] {
        uuid id PK
        uuid user_id FK "UK con level_id"
        uuid level_id FK
        text completion_status "in_progress | completed"
        int best_score "0-100"
        int attempt_count
        timestamptz last_attempt_at
        timestamptz completed_at
    }
    LEVEL_ATTEMPTS["level_attempts"] {
        uuid id PK
        uuid user_id FK
        uuid level_id FK
        text submitted_code "programa en JSON"
        boolean is_success
        int score "0-100"
        int runtime_ms
        jsonb metadata
        timestamptz created_at
    }
    ACHIEVEMENT_CATALOG["achievement_catalog"] {
        text achievement_key PK
        text title
        text description
        text category
        text icon_name
        int awarded_xp
        int sort_order
    }
    ACHIEVEMENTS["achievements"] {
        uuid id PK
        uuid user_id FK "UK con achievement_key"
        text achievement_key
        text title
        text description
        text icon_name
        int awarded_xp
        timestamptz unlocked_at
    }

    AUTH_USERS ||--|| PROFILES : "tiene"
    WORLDS ||--o{ LEVELS : "contiene"
    AUTH_USERS ||--o{ USER_PROGRESS : "avanza"
    LEVELS ||--o{ USER_PROGRESS : "se resume en"
    AUTH_USERS ||--o{ LEVEL_ATTEMPTS : "envía"
    LEVELS ||--o{ LEVEL_ATTEMPTS : "recibe"
    AUTH_USERS ||--o{ ACHIEVEMENTS : "desbloquea"
    ACHIEVEMENT_CATALOG ||..o{ ACHIEVEMENTS : "describe (sin FK)"
```

### 3.2 Salones y misiones

![Modelo entidad–relación: salones y misiones](diagramas/er-salones-misiones.png)

```mermaid
erDiagram
    AUTH_USERS["auth.users"] {
        uuid id PK
        text email
    }
    CLASS_GROUPS["class_groups"] {
        uuid id PK
        uuid tutor_id FK
        text public_id UK "CP-XXXX"
        text name
        text grade_label
        text teacher_name
        int capacity "1-100"
    }
    CLASS_MEMBERSHIPS["class_memberships"] {
        uuid id PK
        uuid group_id FK
        uuid student_id FK, UK "un salón por niño"
        timestamptz joined_at
    }
    JOIN_REQUESTS["join_requests"] {
        uuid id PK
        uuid group_id FK
        uuid student_id FK
        text status "pending | accepted | rejected"
        timestamptz requested_at
        timestamptz resolved_at
    }
    INVITATIONS["invitations"] {
        uuid id PK
        uuid group_id FK
        uuid invited_by FK
        text token UK
        text status "pending | accepted | expired"
        timestamptz sent_at
        timestamptz expires_at
        timestamptz accepted_at
    }
    MISSION_CATALOG["mission_catalog"] {
        text mission_key PK
        text title
        text description
        text difficulty_label "Fácil | Intermedio | Difícil"
        int awarded_xp
        int sort_order
    }
    MISSION_ASSIGNMENTS["mission_assignments"] {
        uuid id PK
        uuid group_id FK "UK con mission_key"
        text mission_key FK
        uuid assigned_by FK
        date due_date "nullable"
        timestamptz assigned_at
    }
    MISSION_COMPLETIONS["mission_completions"] {
        uuid id PK
        uuid user_id FK "UK con mission_key"
        text mission_key FK
        uuid group_id FK
        int awarded_xp
        timestamptz completed_at
    }

    AUTH_USERS ||--o{ CLASS_GROUPS : "tutor crea"
    CLASS_GROUPS ||--o{ CLASS_MEMBERSHIPS : "agrupa"
    AUTH_USERS ||--o| CLASS_MEMBERSHIPS : "niño pertenece"
    CLASS_GROUPS ||--o{ JOIN_REQUESTS : "recibe"
    AUTH_USERS ||--o{ JOIN_REQUESTS : "niño solicita"
    CLASS_GROUPS ||--o{ INVITATIONS : "emite"
    AUTH_USERS ||--o{ INVITATIONS : "tutor invita"
    CLASS_GROUPS ||--o{ MISSION_ASSIGNMENTS : "tiene asignadas"
    MISSION_CATALOG ||--o{ MISSION_ASSIGNMENTS : "se asigna"
    AUTH_USERS ||--o{ MISSION_ASSIGNMENTS : "tutor asigna"
    AUTH_USERS ||--o{ MISSION_COMPLETIONS : "niño cumple"
    MISSION_CATALOG ||--o{ MISSION_COMPLETIONS : "se cumple"
    CLASS_GROUPS ||--o{ MISSION_COMPLETIONS : "en el salón"
```

**Notas sobre el modelo.**

- **Todas las claves de usuario apuntan a `auth.users`**, la tabla de cuentas de
  Supabase, y no a `profiles`. `profiles` comparte la misma clave (relación
  1:1) y la crea un disparador al registrarse. Borrar la cuenta borra en cascada
  todo lo demás.
- **El rol** (`child`/`tutor`) vive en `profiles.role`. Las relaciones marcadas
  «tutor» o «niño» las restringen las políticas RLS, no la clave foránea.
- **Un niño está como mucho en un salón**: `unique (student_id)` en
  `class_memberships`. Las solicitudes se acumulan (sin unicidad), pero sólo
  puede haber una `pending` por niño, con un índice único parcial.
- **`user_progress` resume y `level_attempts` registra**: un intento por envío,
  y una fila de progreso por niño y nivel con la mejor puntuación.
- **`achievements` copia el título y la descripción del logro** en el momento de
  concederlo, y se une al catálogo por `achievement_key` sin clave foránea.
- **`levels.validation_rules`** guarda la configuración completa del nivel
  (cuadrícula, inicio, meta, bloques, máximo de pasos) en un solo `jsonb`, con
  el formato fijado en `CONTRATO-DE-INTEGRACION.md` §4.
- **Vistas** (no aparecen como entidades porque no guardan datos):
  `class_group_directory`, `classroom_roster`, `classroom_level_progress`,
  `classroom_level_attempts`, `classroom_student_activity` y
  `leaderboard_weekly`.
