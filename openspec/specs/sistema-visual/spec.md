# sistema-visual Specification

## Purpose

Sistema de diseño de CodePlay: paleta, tipografías, componentes con relieve y el
bioma de selva tropical. Busca que la plataforma se vea tangible e infantil, en
la línea de CodeCombat, CodeMonkey y Scratch, en lugar de plana y genérica.

## Requirements

### Requirement: Tokens de diseño centralizados

El sistema SHALL exponer la paleta y las tipografías como tokens, disponibles a
la vez como variables CSS en `main.css` y como nombres de Tailwind en
`tailwind.config.js`. Los componentes SHALL usar los nombres, nunca valores
hexadecimales sueltos.

#### Scenario: Un componente necesita el color primario

- **WHEN** un componente pinta una acción principal
- **THEN** usa el nombre `grape` en lugar del hexadecimal `#7B3FE4`

#### Scenario: Se conserva la nomenclatura antigua

- **WHEN** una pantalla todavía no migrada usa `primary`, `secondary`, `tertiary` o `neutral`
- **THEN** esos nombres siguen resolviendo a los colores actuales y la pantalla no se rompe

### Requirement: Botones con relieve sólido

El sistema SHALL dar a los botones un borde inferior de color oscuro que simula
relieve, y SHALL hundirlo al pulsar en lugar de usar sombras difuminadas.

#### Scenario: El usuario mantiene pulsado un botón

- **WHEN** el botón está en estado `active` y no deshabilitado
- **THEN** desciende 3 píxeles
- **AND** su borde inferior se reduce de 5 a 2 píxeles

#### Scenario: El botón está deshabilitado

- **WHEN** el botón tiene el atributo `disabled`
- **THEN** se muestra con escala de grises al 50 % y opacidad 0,65
- **AND** no responde a `hover`

### Requirement: Identidad visual determinista por salón

El sistema SHALL asignar a cada salón uno de seis temas visuales —cohete, robot,
dinosaurio, estrella, bosque y océano— calculado mediante hash de su
identificador. El tema NO SHALL guardarse en base de datos.

#### Scenario: Un salón se muestra en dos pantallas distintas

- **WHEN** el mismo salón aparece en la tarjeta de listado y en la barra lateral
- **THEN** ambas muestran el mismo color, degradado e ilustración

#### Scenario: El salón se recarga desde el almacenamiento

- **WHEN** se vuelve a leer el salón tras recargar la página
- **THEN** obtiene el mismo tema sin haber almacenado ningún campo de tema

### Requirement: Huecos reservados para la mascota

El sistema SHALL marcar con contorno discontinuo los espacios destinados a la
ilustración definitiva de la mascota, y SHALL dejarlos vacíos mientras esa
ilustración no exista.

#### Scenario: Una pantalla incluye un hueco de mascota

- **WHEN** se renderiza un `.mascot-slot` o un `ImagePlaceholder`
- **THEN** se dibuja un marco de contorno discontinuo sobre fondo crema
- **AND** no se muestra ninguna imagen de relleno ni ilustración provisional

### Requirement: Adornos decorativos accesibles

Los adornos SVG del tema de selva SHALL ser invisibles para las tecnologías de
asistencia y SHALL no capturar el puntero.

#### Scenario: Un lector de pantalla recorre una pantalla decorada

- **WHEN** el lector llega a una hoja, flor, liana o tucán decorativos
- **THEN** el elemento está marcado `aria-hidden` y no se anuncia
- **AND** el puntero atraviesa el adorno sin bloquear los controles que hay debajo
