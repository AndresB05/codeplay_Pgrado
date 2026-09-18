## Context

Ver `proposal.md` — Why. Aquí va lo propio del cómo: dónde vive la cuenta del
tramo, cómo llega el XP nuevo a la pantalla y qué se enseña en cada sitio.

Lo que ya estaba puesto y esto aprovecha:

- **`submit_level_attempt` ya devuelve `total_xp`**, el acumulado después de
  conceder. Lo estrenó el J10 sin consumidor para este número: se puso ahí
  sabiendo que la barra lo iba a necesitar.
- **`AuthProvider` ya sabe refrescar el usuario en vivo**: `updateRole` y
  `updateFullName` hacen `setUser` con lo que devuelve el servidor y las siete
  superficies que leen de ese provider se enteran solas. Esto añade la tercera
  acción con la misma forma.
- **`XPBar` está retintada al tema de selva** desde el paso 28 y no hay que
  volver a tocar sus colores. Lo que cambia es qué calcula, no cómo se ve.

## Goals / Non-Goals

**Goals:** que la barra signifique algo —un tramo que se llena y sube—, que el
niño sepa en qué Nivel Explorador está, que el tutor pueda comparar sin que la
barra le engañe, y que el XP se vea al día en cuanto se gana.

**Non-Goals:** el catálogo de logros y su XP (paso 22); la racha; rehacer los
componentes huérfanos; y cualquier cosa que toque la base.

## Decisions

### La cuenta del tramo vive en `constants/progress.ts`, no en el componente

Es donde vivía `PROVISIONAL_MAX_XP` y es lo que el requisito pide: **un solo
sitio**. Entran tres cosas —el tamaño del tramo, el número de tramo y lo que se
lleva dentro— y salen de ahí tanto la barra como el aviso de subida de la ventana
de nivel superado, que tienen que decir lo mismo.

La alternativa era calcularlo dentro de `XPBar`. Se descarta porque entonces
**quien no pinta la barra no puede saber el tramo**: la ventana de nivel superado
necesita compararlo antes y después de la partida, y la pantalla de cuenta lo
enseña sin barra.

> **tramo = parte entera de (XP ÷ 300) + 1**

Con cero XP da uno, que es lo que el usuario pidió: se empieza en el Nivel
Explorador 1, no en el cero.

### «Nivel Explorador», y por qué no «Nivel» a secas

Decidido por el usuario el 17-sep-2026 sobre tres candidatos. El problema que
resuelve es una colisión real: en la misma pantalla hay «Nivel 3 - La escalera»,
y llamar «Nivel 3» al tramo obligaría al niño a distinguir dos numeraciones que
no tienen nada que ver. «Explorador» ya es la palabra del panel —«identidad de
explorador», «vuelve a la expedición»—, así que no estrena vocabulario.

### `XPBar` recibe el XP, no un máximo

Hoy recibe `currentXP` y `maxXP` y divide. Pasa a recibir sólo el XP: el tramo lo
calcula con la cuenta de arriba. Es lo que impide que dos llamadas distintas
pinten tramos distintos —hoy `WelcomeBanner` pasa `1000` a mano y los demás la
constante—, y lo que hace que el requisito del «único sitio» sea cierto por
construcción y no por disciplina.

La etiqueta pasa a ser **dos líneas**: el Nivel Explorador y, debajo, lo que lleva
dentro del tramo sobre 300. En la tabla del tutor, donde no cabe, van en una sola
línea al lado de la barra.

### El XP se refresca con lo que devuelve el servidor, no volviendo a consultar

`submit_level_attempt` ya trae el total nuevo, así que el panel no tiene que
preguntar otra vez: `AuthProvider` gana `applyTotalXp(total)`, que hace `setUser`
con el mismo perfil y el XP cambiado.

**No recarga el perfil entero a propósito.** Volver a llamar a `getProfile`
costaría otra ida y vuelta y podría pisar cosas que la pantalla acaba de cambiar
—el nombre, el rol— con una copia más vieja. Y **no es adivinar**: el número es el
que la base acaba de escribir, no una suma hecha en el cliente.

Si la partida no se guardó no hay número, y entonces no se toca nada: la barra
sigue diciendo lo de antes, que es la verdad de lo que hay guardado.

### La subida se anuncia comparando antes y después

La ventana ya recibe lo que concedió el servidor. Con el total nuevo y lo
concedido se saca el total anterior —restando— y se comparan los dos tramos: si el
de después es mayor, hubo subida. No hace falta que el servidor lo diga.

**Una partida que concede cero no sube a nadie**, así que el aviso no puede salir
ahí; y con el guardado fallido no hay total, así que tampoco.

### Lo que ve el tutor

Decidido por el usuario: **la barra, el XP acumulado y el nivel**, las tres. El
motivo está en el requisito y conviene no perderlo: la barra sola **ordena mal**,
porque se vacía al subir. El número es lo que ordena; el tramo es lo que explica
por qué la barra de quien va delante puede verse más vacía.

## Risks / Trade-offs

- **La barra del tutor sigue sin ser comparable de un vistazo** → mitigado, no
  resuelto: el número está al lado. Ordenar la tabla por XP no entra aquí.
- **Dos numeraciones en pantalla** —el Nivel Explorador y los niveles del juego—
  → mitigado por el nombre, que es justo la decisión del usuario. Si en pantalla
  sigue chocando, cambiar la palabra es tocar una constante.
- **El tramo de 300 se queda corto el día que los logros repartan XP** → no es un
  riesgo, es el diseño: la barra no tiene techo y el tramo se calcula. Lo que
  habrá que revisar entonces es si 300 sigue siendo un buen salto, no la barra.
- **El refresco depende de que la pantalla de nivel llame a la acción** → si
  alguien añade otra vía de ganar XP y no la llama, la barra se quedará vieja
  otra vez. Por eso la acción vive en el provider y no en la pantalla: la próxima
  vía la llama en una línea.
