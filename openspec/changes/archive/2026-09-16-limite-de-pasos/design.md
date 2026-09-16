## Context

Ver `proposal.md` — Why. El mundo 3 se juega contra un máximo de pasos, y la
regla no existe en ninguna capa. Aquí va lo propio de este cambio: dónde vive la
regla, por qué ahí, y qué se le enseña al niño.

Lo que ya está puesto y esto aprovecha: `runProgram` construye el recorrido
entero antes de animar nada; la escena tiene un intento congelado con su mensaje
—el de «Detener»—; y el contador ya sale de `stepsTaken`, que vive fuera del
componente porque jsdom no implementa WebGL.

## Goals / Non-Goals

**Goals:** que un nivel pueda conceder un máximo de pasos, que el recorrido se
corte al agotarlo, y que el niño vea bajar lo que le queda y entienda por qué se
paró.

**Non-Goals:** sembrar ningún nivel del mundo 3 —es el cambio siguiente, con la
migración 0030—; tocar los seis niveles ya sembrados; tocar la base de datos;
escribir el XP, que es el J10.

## Decisions

### La regla vive en `runProgram`, no en la escena

`runProgram` es puro y se puede probar; la escena no. Pero el motivo de fondo es
otro: **el servidor tendrá que reproducir esta regla** cuando el J10 puntúe. Si el
corte viviera en el componente, el servidor no tendría forma de saber que un
programa de quince pasos en un nivel de diez no llega a la meta, y los dos lados
dirían cosas distintas sobre el mismo intento.

El corte además cae solo donde tiene que caer: `success` se calcula pisando
casillas, así que un recorrido truncado antes de la meta nace con `success` en
falso sin que nadie lo fuerce.

`Run` gana un campo que dice si el recorrido se cortó por el límite. No se deduce
de comparar `steps.length` con el máximo: un programa que cuesta exactamente el
máximo y otro que se pasó producen el mismo recorrido, y sólo el segundo se quedó
sin pasos.

### El salto es atómico, y por eso el contador puede pararse en uno

Saltar a la casilla de delante cuesta dos pasos y deja dos entradas en el
recorrido —despegue y aterrizaje—. Con **un solo paso de sobra** hay tres salidas
y sólo una sirve:

- ejecutarlo y pasarse en uno → el máximo dejaría de ser un máximo;
- partirlo y dejar al personaje en el aire → no es un estado del juego, y es
  exactamente lo que `stoppedIndex` existe para evitar en «Detener»;
- **no ejecutarlo y cortar ahí**, que es lo que se hace.

Consecuencia visible: el contador puede quedarse en **uno** en vez de en cero. El
texto del resultado no dice «llegaste a cero», dice que se quedó sin pasos, así
que sigue siendo verdad. Vale la pena: la alternativa es un personaje flotando.

### Cortar por el límite NO es detener

Se parecen y no son lo mismo, y confundirlos regala pasos:

| | Detener | Quedarse sin pasos |
| --- | --- | --- |
| Quién lo pide | el niño | el nivel |
| ¿Se reanuda con «Ejecutar»? | **sí**, sigue desde donde iba | **no** |
| ¿Se bloquea el lienzo? | sí, mientras está detenido | no: el intento terminó |
| Qué dice el mensaje | cómo seguir o reiniciar | que se quedó sin pasos, y que reinicie |

Por eso el corte **no** pasa por la marca de congelado de la escena: el recorrido
simplemente termina, con `success` en falso. Reanudar es la puerta por la que se
colarían los pasos que el nivel no da.

### El contador cambia de sentido, y es un vuelco deliberado

El requisito del contador dice hoy, con todas las letras, que **no** debe anunciar
lo que falta: «enseñar mientras se juega el número que hay que batir convierte el
nivel en un problema de optimización cuando todavía es un problema de llegar».

En el mundo 3 esa frase deja de valer, y no porque se relaje: **ahí el nivel ya es
un problema de optimización**, por diseño del usuario. Esconder el número no
protege nada y deja al niño congelándose sin saber por qué. Así que la regla no
se rompe, se parte en dos casos, y el que gobierna es si el nivel trae máximo.

Texto elegido: **«Pasos restantes: N»** frente al **«Pasos: N»** de siempre. Dos
etiquetas distintas para dos magnitudes distintas, en la misma píldora y el mismo
sitio; reutilizar «Pasos:» para lo contrario sería el peor de los dos mundos.

En reposo marca el máximo entero, que es lo que el usuario pidió: el contador
anuncia lo que el nivel concede antes de que nadie ejecute nada.

### `optimalSteps` no se toca, y el máximo se comprueba contra él

Son dos números distintos y los dos siguen haciendo falta: `optimalSteps` es lo
que cuesta la mejor solución y de él sale la puntuación; el máximo es lo que el
nivel concede. Que en el mundo 3 vayan a coincidir es **decisión de quien siembra**,
no una regla del formato — dejarlos atados obligaría a un nivel con margen a
mentir en uno de los dos.

Lo que sí se comprueba al leer: **un máximo menor que `optimalSteps` rechaza el
nivel entero**. Es imposible de terminar, y es de los errores de siembra que se
cazan leyendo, como la salida sobre un muro. El de enfrente —un `optimalSteps`
mal apuntado— sigue sin poder comprobarse, y sigue dependiendo del test que busca
el mínimo sobre el `.sql`.

### El campo es opcional, y ausente no es cero

`stepLimit` falta en los seis niveles sembrados y debe seguir faltando: un nivel
sin él se juega sin límite. La lectura distingue tres casos —ausente, válido e
inválido— y sólo el tercero rechaza. Si un día el campo llegara a cero, eso no es
«sin límite»: es un nivel que no deja dar ni un paso, y se rechaza.

Cuidado con la trampa del lector: hoy **descarta en silencio** lo que no conoce, y
ése es justo el motivo de que esta mecánica vaya antes que los tableros. Sembrar
el límite sin este cambio produce un nivel que se juega sin él sin avisar a nadie.

### El borde que queda abierto: pisar la meta y seguir

Un programa puede pisar la meta en el paso ocho, seguir ordenando bloques y
agotar el máximo en el diez. El recorrido se corta, pero **la meta ya se pisó**, y
el contrato §4.4 es explícito: pasarse de largo es ineficiencia, no invalida el
nivel. Así que **el nivel se da por resuelto**, y el recuento que se enseña sigue
siendo el del programa entero —quince pasos, aunque sólo se dieran diez—, porque
ése es el número que el servidor podrá recalcular sin ejecutar nada.

Es raro y es coherente. Se anota porque es el único sitio donde «los pasos que
cuentan» y «los pasos que se dieron» dejan de coincidir, y quien lea esto dentro
de tres meses va a tropezar con ello.

## Risks / Trade-offs

- **El vuelco del contador contradice un requisito escrito** → no se borra: se
  reescribe en dos casos, con el porqué de cada uno dentro del propio requisito.
- **El contador puede pararse en uno y no en cero**, por el salto que no cabe → el
  mensaje no promete un cero, y la alternativa es peor.
- **`Run` gana un campo que casi nadie mira** → lo mira el resultado, que es quien
  tiene que distinguir «no llegaste» de «te quedaste sin pasos».
- **Nada de esto se ve hasta que haya un nivel con límite**, y no lo habrá hasta
  la 0030 → se prueba en el laboratorio con un nivel de pega y con los tests del
  intérprete, que no necesitan tablero sembrado.
