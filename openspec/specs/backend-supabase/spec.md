# backend-supabase Specification

## Purpose

Definir el esquema de datos de CodePlay, sus políticas de seguridad y las
operaciones de escritura permitidas al cliente.

El esquema vive como migraciones versionadas y **está aplicado** a un proyecto de
Supabase enlazado: las tablas, las funciones RPC, las políticas de RLS y el
contenido inicial de mundos y niveles existen en la base real. Los requisitos
describen un sistema en funcionamiento.

Lo que todavía no cubre: no hay tablas para el módulo de salones, y `achievements`
registra los logros concedidos pero no existe el catálogo que enumere los
posibles.

## Requirements

### Requirement: Esquema reproducible desde cero

El sistema SHALL describir la base de datos como migraciones SQL numeradas y
ordenadas, de modo que cualquiera pueda recrear el esquema completo y su
contenido inicial sin pasos manuales.

#### Scenario: Se recrea la base local

- **WHEN** se ejecuta el reinicio de la base de datos con la CLI de Supabase
- **THEN** se aplican todas las migraciones en orden y después el contenido inicial de mundos y niveles

### Requirement: Escrituras encapsuladas en funciones seguras

El sistema SHALL canalizar las escrituras principales del cliente a través de
funciones RPC, en lugar de permitir escritura directa sobre las tablas, para
reducir la manipulación desde el navegador.

#### Scenario: El cliente actualiza su perfil

- **WHEN** se modifica el perfil propio
- **THEN** la operación pasa por la función `update_my_profile`

#### Scenario: El cliente registra progreso o un intento de nivel

- **WHEN** se guarda progreso o el intento de resolver un nivel
- **THEN** la operación pasa por `upsert_my_progress` o `create_level_attempt`

### Requirement: Perfil creado automáticamente al registrarse

El sistema SHALL crear la fila de perfil correspondiente en cuanto se da de alta
un usuario, sin requerir una segunda llamada desde el cliente. El perfil creado
SHALL recoger los datos declarados en el registro, incluido el rol.

#### Scenario: Alta de un usuario nuevo

- **WHEN** se crea el usuario en la capa de autenticación
- **THEN** un disparador crea su perfil asociado

#### Scenario: Alta de un usuario que declara su rol

- **WHEN** se crea el usuario indicando el rol `tutor` en los datos del registro
- **THEN** su perfil queda con el rol `tutor` sin ninguna llamada adicional desde el cliente

### Requirement: Rol almacenado en el perfil

El sistema SHALL guardar en el perfil el rol con el que se registró la persona,
con los valores `child` o `tutor` y `child` por defecto. El rol SHALL residir en
la base de datos y no únicamente en la sesión del navegador, de modo que las
decisiones que dependen de él puedan verificarse en el servidor.

#### Scenario: Se consulta el perfil propio

- **WHEN** una persona autenticada lee su perfil
- **THEN** obtiene su rol junto al resto de campos del perfil

#### Scenario: Un perfil se crea sin rol declarado

- **WHEN** se da de alta un usuario sin indicar rol
- **THEN** su perfil queda con el rol `child`

#### Scenario: Se intenta guardar un rol desconocido

- **WHEN** se intenta escribir en el perfil un rol distinto de `child` o `tutor`
- **THEN** la base de datos rechaza la escritura

### Requirement: Logros de sólo lectura para el cliente

El sistema SHALL exponer los logros como datos de sólo lectura para el cliente
autenticado. La concesión de un logro NO SHALL poder originarse en el navegador.

#### Scenario: El cliente intenta escribir un logro

- **WHEN** se intenta insertar o modificar un logro desde el cliente
- **THEN** la operación se rechaza

### Requirement: Ranking semanal con campos acotados

El sistema SHALL exponer el ranking semanal como una vista que publica
únicamente los campos necesarios para ordenar la clasificación.

#### Scenario: Se consulta la clasificación

- **WHEN** el cliente lee el ranking semanal
- **THEN** obtiene sólo los campos previstos para ranking, sin datos sensibles del perfil

### Requirement: Seguridad a nivel de fila activa

El sistema SHALL mantener la seguridad a nivel de fila habilitada en las tablas
con datos de usuario, con políticas explícitas para cada operación permitida.

#### Scenario: Un usuario consulta datos de otro

- **WHEN** se intenta leer o escribir filas que pertenecen a otro usuario
- **THEN** la política deniega la operación

### Requirement: Tipos generados, nunca escritos a mano

Los tipos TypeScript que describen la base de datos SHALL generarse con la
herramienta de Supabase a partir del esquema real, y NO SHALL editarse
manualmente.

#### Scenario: El esquema cambia

- **WHEN** se añade, elimina o renombra una columna
- **THEN** los tipos se regeneran con la CLI en lugar de ajustarse a mano
