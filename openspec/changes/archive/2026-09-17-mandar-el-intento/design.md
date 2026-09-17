## Context

Ver `proposal.md` — Why. El juego se juega entero y la plataforma no se entera.
Aquí va lo propio de este cambio: quién habla con el servidor, qué se manda y
qué se hace con lo que falla.

Lo que ya estaba puesto y esto aprovecha: `runProgram` construye el recorrido
entero antes de animar nada, así que al terminar se sabe todo lo que hay que
contar; la escena ya avisaba una vez por recorrido terminado, con su referencia
contra `React.StrictMode`; y `program.ts` ya tenía el sobre del contrato §4.3 sin
importar Blockly, escrito en el J3 **para esto**.

## Goals / Non-Goals

**Goals:** que cada partida terminada quede guardada entera y una sola vez, que
el progreso refleje lo que el niño ha hecho, y que un guardado que falle no le
quite la partida.

**Non-Goals:** el XP por marca de agua y el recuento de pasos en el servidor, que
son el J10; los logros y las misiones, que son el paso 22; y cualquier cosa que
necesite migración.

## Decisions

### El anfitrión traduce, el juego no habla con el servidor

La escena no sabe contra qué fila se está jugando ni quién está jugando, y eso es
la frontera del contrato §1, no una casualidad. `LevelFinish` sube **materia
prima** —el resultado, el programa ejecutado, lo que costó y cuánto duró— y quien
la convierte en `levelId` + dos llamadas es `StudentLevelModule`, que es el
anfitrión.

Por eso la traducción vive en `submitAttempt.ts`, dentro de la carpeta de las
pantallas del niño y no en `game/`. Y vive **fuera del componente** para poder
probar la decisión sin montar una pantalla que necesita WebGL.

### Se manda en el manejador, nunca en un efecto

Es la misma regla que el J5 escribió para el arranque del recorrido, y aquí muerde
más: con `React.StrictMode` un efecto corre dos veces en desarrollo, y eso serían
**dos filas en `level_attempts`** y dos llamadas contadas en
`user_progress.attempt_count` por una sola partida.

La escena ya avisaba una vez por recorrido terminado, con una referencia que se
marca **antes** de avisar. Lo que cambia es lo que esa referencia protege: antes
una ventana que se reabría —molesto—, ahora una fila duplicada en la base. El
camino nuevo no añade ninguna ocasión de avisar dos veces.

### El progreso se escribe también al fallar

Decidido por el usuario el 17-sep-2026, con la alternativa medida delante: si sólo
se escribiera al superar, el recuento de intentos y la fecha del último sólo
contarían los éxitos, y quien quisiera saber cuántas veces se intentó un nivel sin
conseguirlo tendría que ir a la otra tabla.

**No hay riesgo de degradar un nivel ya superado**, y se comprobó leyendo la 0006
antes de decidir y midiéndolo después: `upsert_my_progress` deja `completed` en
cuanto lo estuvo alguna vez, `completed_at` se congela en el primer éxito y el XP
no se vuelve a conceder.

Lo que sí obliga es a arreglar el contador de mundos en el mismo paso. Y no de
tapadillo: es la deuda §4.12, era invisible mientras la única fila de la base
decía `completed`, y con esta decisión el primer fallo de un mundo lo pondría en
1/3 sin que nadie hubiera superado nada.

### Las dos llamadas se hacen las dos, aunque la primera falle

Son independientes —`attempt_count` cuenta las segundas, no las filas de la
primera, y nada las sincroniza—, así que renunciar a la segunda porque falló la
primera perdería el progreso de una partida que sí ocurrió.

### Lo que NO es una partida

Un lienzo vacío o ilegible **no llegó a ejecutarse**, y un recorrido **detenido**
por el niño no ha terminado: ninguno de los tres se guarda. La escena ya
distinguía los tres casos desde el J6, y aquí se aprovecha tal cual.

Quedarse sin pasos, en cambio, **sí** es una partida: se ejecutó y terminó, lo que
pasa es que no llegó. Va como fallo, con la marca en las observaciones.

### Las observaciones son observaciones, no verdades

En `metadata` van los pasos **que se le enseñaron al niño**, junto al óptimo
apuntado, si se agotó el máximo y si sobraron bloques. El número que cuenta lo
recalculará el servidor leyendo el programa (§3), y guardar el del cliente sirve
justo para eso: el día que los dos no coincidan, uno de los dos recuentos está mal
y aquí queda con qué darse cuenta.

### Un guardado fallido se dice, y no se espera por él

El contrato §7 prohíbe bloquear la partida esperando confirmación, así que la
felicitación sale igual y el aviso llega detrás. No se le pide al niño que haga
nada: volver a jugarlo lo guarda, y repetir no le quita nada (§6). Sin el aviso,
volvería al mundo y no encontraría el nivel que acaba de superar.

## Risks / Trade-offs

**`best_score` se queda en cero** en todas las filas que escriba este paso, y la
pantalla sigue enseñando el `xp_reward` de la fila como si se concediera entero.
Es lo que el J10 viene a arreglar, y estrenar aquí un número que aquel paso va a
cambiar sería peor que dejarlo en cero.

**La duración incluye lo que durase detenido.** Es reloj de pared de «Ejecutar» a
la llegada, no tiempo de animación. Medido: 13 346 ms en un recorrido pausado a
mitad. Es lo que significa «cuánto duró la partida» y no se pretende otra cosa.
