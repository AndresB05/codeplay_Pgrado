## ADDED Requirements

### Requirement: El nombre de un mundo dice lo que ese mundo enseña

El nombre y la descripción de un mundo SHALL describir **lo que el niño va a
hacer dentro**, y NO SHALL nombrar ninguna idea que el juego no permita practicar.

Con los cuatro bloques de hoy —avanzar, dos giros y saltar— ningún mundo SHALL
anunciar bucles, condicionales, funciones, estructuras de datos, variables ni
depuración. Es la misma frontera que el catálogo de logros ya respeta.

El nombre de un mundo SHALL ser **el mismo en toda la plataforma**: el que la
base guarda es el que la aplicación pinta y el que la **landing anterior al
login** anuncia. NO SHALL anunciarse en ninguna pantalla un mundo con un nombre
que la base no tenga.

El rótulo que acompaña al mundo en su lista de niveles SHALL nombrar el **ámbito
del pensamiento computacional** al que ese mundo pertenece.

#### Scenario: Alguien sin sesión mira la landing y luego entra

- **WHEN** lee los mundos anunciados antes del login y después abre el catálogo de mundos con su sesión
- **THEN** encuentra los mismos tres nombres en los dos sitios

#### Scenario: Un mundo anuncia una idea que el juego no tiene

- **WHEN** se revisa el nombre o la descripción de un mundo
- **THEN** ninguno de los dos nombra bucles, condicionales, funciones, estructuras de datos, variables ni depuración

#### Scenario: El niño entra a la lista de niveles de un mundo

- **WHEN** se abre la lista de niveles
- **THEN** bajo el título se lee el ámbito del pensamiento computacional de ese mundo

### Requirement: Renombrar un mundo no renumera nada

Cambiar el nombre, la descripción o el identificador legible de un mundo NO SHALL
alterar el orden de los mundos ni el de sus niveles, y NO SHALL cambiar ninguna
clave derivada de ese orden.

Los títulos de los niveles SHALL ser independientes del nombre de su mundo:
renombrar un mundo NO SHALL obligar a renombrar sus niveles.

#### Scenario: Se renombran los tres mundos

- **WHEN** los tres mundos cambian de nombre y de descripción
- **THEN** cada uno conserva su posición y sus tres niveles conservan la suya
- **AND** los niveles conservan su título
