## ADDED Requirements

### Requirement: Leo explica el mundo de los pasos contados la primera vez

La primera vez que una cuenta de niño abre un nivel jugable del mundo 3 —el
tercero de la lista ordenada de mundos—, la pantalla de nivel SHALL oscurecerse y
mostrar a Leo, la mascota, entrando desde el borde inferior junto a una burbuja
de diálogo.

La explicación SHALL constar de tres burbujas cortas, en este orden:

1. Que en este mundo los pasos están contados.
2. Dónde se ve cuántos quedan, enseñando el contador con el **máximo de pasos del
   nivel abierto**.
3. Que hay que buscar el camino más corto.

Las dos primeras SHALL tener un botón «Siguiente» y la última un botón
«¡Entendido!» que la cierra.

La explicación SHALL cerrarse también con la tecla Escape y tocando fuera de
Leo y de su burbuja.

SHALL presentarse como un diálogo accesible: anunciado como diálogo, con el foco
dentro mientras está abierto y devuelto a donde estaba al cerrarse.

Si el sistema del niño pide reducir el movimiento, Leo y la burbuja SHALL
aparecer en su sitio sin desplazarse.

Un nivel que no se puede jugar o que está cerrado NO SHALL mostrar la
explicación. Tampoco los niveles de los otros mundos.

#### Scenario: Primera vez en el mundo 3

- **WHEN** un niño que nunca ha visto la explicación abre un nivel jugable del mundo 3
- **THEN** la pantalla se oscurece, Leo entra desde abajo y la primera burbuja dice que los pasos están contados

#### Scenario: La segunda burbuja enseña el contador del nivel

- **WHEN** el niño pulsa «Siguiente» en la primera burbuja de un nivel con máximo de 12 pasos
- **THEN** la burbuja enseña el contador con «Pasos restantes: 12» y dice dónde está en la pantalla

#### Scenario: El niño termina la explicación

- **WHEN** pulsa «¡Entendido!» en la última burbuja
- **THEN** la explicación se cierra y el nivel queda listo para jugar

#### Scenario: Cerrar sin leerla entera

- **WHEN** el niño pulsa Escape o toca fuera de Leo y de la burbuja
- **THEN** la explicación se cierra

#### Scenario: Movimiento reducido

- **WHEN** el sistema del niño tiene activado reducir el movimiento
- **THEN** Leo y la burbuja aparecen en su sitio sin animación de entrada

#### Scenario: Otros mundos

- **WHEN** el niño abre un nivel del mundo 1 o del mundo 2
- **THEN** no aparece la explicación ni el botón para verla

### Requirement: Haber visto la explicación se recuerda por cuenta

Que una cuenta ya vio la explicación de un mundo SHALL guardarse en la base, ligado
a la cuenta y no al navegador, en cuanto la explicación se cierra por cualquiera de
sus vías.

Una cuenta que ya la vio NO SHALL volver a verla sola al abrir otro nivel del
mismo mundo, en ese equipo ni en ningún otro.

Si no se puede leer si la cuenta ya la vio, la explicación NO SHALL mostrarse
sola: el nivel se juega igual. Si no se puede guardar, el niño NO SHALL recibir
ningún aviso.

Una sesión sin cuenta real NO SHALL mostrar la explicación sola.

#### Scenario: Otro niño en el mismo equipo

- **WHEN** un niño que nunca la ha visto entra en un equipo donde otra cuenta ya la vio
- **THEN** la explicación le aparece igual

#### Scenario: El mismo niño en otro equipo

- **WHEN** un niño que ya la cerró abre un nivel del mundo 3 desde otro equipo
- **THEN** la explicación no aparece sola

#### Scenario: Falla la lectura

- **WHEN** la consulta de si la cuenta ya la vio falla
- **THEN** el nivel se abre sin la explicación y sin aviso de error

### Requirement: La explicación se puede volver a ver

Los niveles del mundo 3 SHALL ofrecer un botón, visible en la cabecera de la
pantalla de nivel, que vuelve a mostrar la explicación completa desde la primera
burbuja, también a quien ya la vio.

#### Scenario: El niño pide volver a verla

- **WHEN** pulsa el botón de Leo en un nivel del mundo 3
- **THEN** la explicación vuelve a empezar desde la primera burbuja
