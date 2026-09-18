## Context

Ver `proposal.md` — Why, incluida la medición que descartó la sincronización en
vivo. Lo que fija este diseño son dos hechos del código actual:

1. **`ClassroomsProvider` ya tiene `refreshSilently()`**, el camino que recarga
   sin declarar espera. Lo estrenó el paso 18 para las recargas que dispara otra
   persona, y **no está expuesto en `ClassroomsContext`**: hoy sólo lo usa el
   propio provider desde la suscripción.
2. **El provider no se desmonta al navegar dentro de la aplicación.** Vive en la
   raíz, así que ir de Ajustes al panel no vuelve a cargar nada. Ése es
   exactamente el caso medido.

## Goals / Non-Goals

**Goals:**

- Que el tutor que abre el panel vea lo de ahora, no lo de cuando arrancó la
  aplicación.
- Que volver a la pestaña baste para ponerse al día.
- Que ninguna de las dos recargas haga parpadear lo que ya está pintado.

**Non-Goals:**

- Tiempo real. Si nadie vuelve a mirar, el panel no se mueve, y es deliberado:
  ver `proposal.md`.
- Tocar la base. Este cambio no lleva migración ni altera ninguna política.
- Sondear cada N segundos. Una consulta periódica gasta en el caso normal —nadie
  jugando— para ganar en el raro, y multiplica por cada tutor conectado.

## Decisions

### El foco lo escucha el provider; el montaje lo piden las pantallas

Son dos disparadores distintos y van en dos sitios distintos, y no es simetría
rota:

- **El foco es global.** Da igual qué pantalla esté abierta: si quien mira vuelve
  a la ventana, lo que ve tiene que estar al día. Va en el provider, que ya es el
  dueño del estado, y así ninguna pantalla tiene que acordarse.
- **El montaje es de cada pantalla**, porque sólo ella sabe que acaba de
  abrirse. El provider no se entera: no se desmonta al navegar.

Esto obliga a **exponer `refreshSilently` en `ClassroomsContext`**, que es el
único cambio de superficie del store. Se expone el silencioso y no `refresh`: una
pantalla que se abre sobre datos ya cargados no debe blanquearse mientras
comprueba si cambió algo.

La alternativa era que las pantallas escucharan el foco cada una. Se descarta
porque serían tres copias del mismo oyente, y tres sitios donde olvidarse de
quitarlo al desmontar.

### `visibilitychange`, no `focus`

Se escucha `document.visibilitychange` y se recarga cuando el documento pasa a
visible. `window.focus` dispara también al volver de un cuadro de diálogo o al
pinchar dentro de la propia ventana, que son recargas que nadie pidió;
`visibilitychange` describe lo que importa: la pestaña estuvo oculta y ha
vuelto.

### Qué pantallas lo piden al montar

Las tres que muestran progreso ajeno: el panel de información y el detalle del
salón del tutor, y la vista de salón del niño —que desde el paso 17 enseña
también el mundo y la actividad de sus compañeros—.

### Sin sesión no se consulta

El oyente comprueba que hay usuario antes de llamar, igual que hace la
suscripción. `runLoad` ya trata el caso sin `userId` vaciando el estado, pero
llamarlo al volver a la pestaña en la pantalla de acceso sería trabajo inútil.

## Risks / Trade-offs

- **Quien deja el panel abierto y mirando no ve subir la cifra** → Es el límite
  aceptado. La salida cuando deje de bastar está escrita: difusión por disparador,
  paso 27.
- **Cambiar de ventana a menudo dispara consultas** → Es la misma consulta que ya
  se rehace ante cualquier solicitud de ingreso, y sólo cuando la pestaña estuvo
  oculta de verdad. Si molestara, la salida es acordarse de la última lectura y
  saltarse las muy seguidas; no se hace ahora para no añadir estado que nadie ha
  echado de menos.
- **Exponer un segundo refresco en el contexto invita a usarlo mal** → Su
  documentación dice para qué es. El riesgo real sería que alguien lo llamara en
  un efecto sin dependencias estables y montara un bucle; los tests del store
  cubren que una recarga no encadena otra.
