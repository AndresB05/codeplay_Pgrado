## ADDED Requirements

### Requirement: El XP conseguido se ve en el panel del niño

El XP del niño SHALL verse en su panel, y no sólo en la pantalla de cuenta: en la
**barra lateral**, debajo del indicador de racha, y en la **barra superior**, a la
izquierda del indicador de racha.

El valor mostrado SHALL ser el que devuelve el servidor, incluido el cero de una
cuenta sin actividad. NO SHALL inventarse ninguna cifra mientras nada escriba
progreso.

El **máximo** de la barra SHALL ser una cantidad provisional declarada en un solo
sitio de la aplicación, porque el esquema todavía no tiene niveles ni umbrales de
XP; fijarlos de verdad corresponde al paso que diseñe rachas y logros.

#### Scenario: El niño abre su panel

- **WHEN** el niño entra al panel
- **THEN** la barra lateral muestra una barra de XP debajo del indicador de racha
- **AND** la barra superior muestra una barra de XP a la izquierda del indicador de racha

#### Scenario: Cuenta sin actividad

- **WHEN** el perfil del niño tiene cero XP
- **THEN** las dos barras se muestran vacías con el valor cero
- **AND** no se enseña ninguna cifra de ejemplo

#### Scenario: El máximo se declara una sola vez

- **WHEN** cambie la cantidad provisional que sirve de máximo
- **THEN** basta con tocar un único sitio para que las dos barras la reflejen
