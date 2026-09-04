# CodePlay — Hoja de ruta del juego

> **En qué orden se construye el juego.** Escrita el 3 de septiembre de 2026.

Esto es **sólo el juego**. El orden del proyecto entero está en
[`ROADMAP.md`](ROADMAP.md), y aquí no se repite.

Los dos documentos que hay que tener leídos antes de empezar, y que este roadmap
**no resume**:

| Documento | Qué contiene |
| --- | --- |
| [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) | Qué es el juego, qué cuenta como un paso y cómo se puntúa |
| [`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) | Qué manda y qué recibe el juego, y qué no debe hacer nunca |

---

## 1. Cómo está ordenada

**Cada paso tiene que poder verse funcionar antes de empezar el siguiente.** Es
el principio que `ROADMAP.md` §2.1 ya aplicó al resto del proyecto, y aquí manda
igual: adelantar un paso para poder comprobar algo es preferible a respetar un
orden escrito antes de saber lo que se sabe al llegar.

De ahí sale la división en cuatro fases, y el motivo de que **el backend entre
tarde a propósito**:

| Fase | Qué se consigue | ¿Necesita la base? |
| --- | --- | --- |
| **A** | El juego se juega entero, con un nivel escrito a mano en el código | No |
| **B** | Los niveles vienen de la base | Sí |
| **C** | El resultado se guarda y da XP | Sí, con migración |
| **D** | El contenido completo | No |

La fase A no toca Supabase ni una vez. Eso es deliberado: **un juego que no se
puede jugar no se arregla conectándolo**, y depurar la mecánica contra una base
de datos es depurar dos cosas a la vez.

---

## 2. Dos decisiones antes de la primera línea

Están en `DISENO-DEL-JUEGO.md` §6, **las decide el usuario** y **bloquean el
J1**:

1. **Dónde vive el juego.** `packages/game/` o `apps/web/src/game/`.
   Recomendado `packages/game/`: conserva la frontera que describe el contrato,
   y trabajando solo esa frontera es lo que impide que el juego acabe sabiendo de
   logros y misiones. Fuerza además a declarar qué entra y qué sale.
2. **Confirmar las librerías**: React Three Fiber con `drei` para el 3D, y
   Blockly para los bloques.

**Los assets ya no bloquean nada**: salen de [Kenney](https://kenney.nl) y de lo
que cree el propio usuario, en 3D, con 2D donde convenga —iconos de bloques,
interfaz, carteles—. El detalle está en `DISENO-DEL-JUEGO.md` §5.

Y no hace falta esperarlos para empezar: **la fase A se hace entera con cubos de
colores.** Los modelos entran cuando la mecánica ya funciona, que es cuando se
sabe qué piezas hacen falta de verdad.

---

## 3. La secuencia

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente

| Nº | Paso | Se ve funcionar cuando… | Estado |
| --- | --- | --- | --- |
| **J1** | Esqueleto: el paquete, las dependencias y un componente que pinta una escena 3D vacía dentro de la aplicación | Aparece algo en 3D en una pantalla del panel | ⬜ |
| **J2** | La cuadrícula y el personaje, montados desde un objeto de configuración **escrito a mano en el código** | Se ve el tablero y el personaje se mueve llamando funciones desde la consola | ⬜ |
| **J3** | **Fijar el formato** de `config` y de `program` | Está escrito en el contrato, no en la cabeza de nadie | ⬜ |
| **J4** | Blockly con el juego mínimo de bloques: avanzar N, girar a un lado y al otro | Se arrastran bloques y se ve el JSON que producen | ⬜ |
| **J5** | El intérprete: ejecutar el programa, animar al personaje y detectar si llegó a la meta | **Un nivel se resuelve de principio a fin, sin backend** | ⬜ |
| **J6** | Recuento de pasos y pantalla de resultado | Al terminar dice cuántos pasos usó y cuántos eran óptimos | ⬜ |
| **J7** | Sembrar el mundo 1: los tres niveles reales con su configuración | Los tres niveles se juegan leyendo su definición de la base | ⬜ |
| **J8** | Conectar la pantalla de nivel al backend y montar el juego dentro | Se elige un nivel en la web y arranca el que se eligió | ⬜ |
| **J9** | Mandar el intento al servidor con el programa | La partida aparece guardada en la base | ⬜ |
| **J10** | La migración del XP: contar pasos y conceder por marca de agua | El XP sube 80, y 20 al mejorar. Nunca más de 100 | ⬜ |
| **J11** | La barra de XP por tramos de 300 | El niño sube de nivel al terminar un mundo | ⬜ |
| **J12** | Mundos 2 y 3 | Hay nueve niveles jugables | ⬜ |

### J3 es más importante de lo que parece, y por eso va antes que Blockly

El formato del programa **lo leen tres sitios distintos**: el juego para
ejecutarlo, el cliente para contar los pasos que enseña al niño, y el servidor
para puntuar y conceder logros. Si se decide sobre la marcha, los tres divergen.

Y arrastra una decisión que conviene tomar a sabiendas: **si se guarda el JSON
nativo de Blockly o uno propio más pequeño.**

- El **nativo** no cuesta código: Blockly serializa y deserializa solo. A cambio,
  el formato es verboso y es de Blockly, así que una actualización suya puede
  cambiarlo.
- Uno **propio** obliga a escribir la traducción en los dos sentidos, pero deja
  un JSON pequeño, estable y fácil de recorrer desde SQL.

Recomendado **el nativo de Blockly**, y por un motivo concreto: el contrato ya
tiene el campo de versión del formato precisamente para sobrevivir a este tipo de
cambios, y escribir un traductor antes de que exista el primer nivel es trabajo
sin evidencia. Si el JSON de Blockly resulta incómodo de recorrer desde SQL en el
J10, ahí se cambia, y con casos reales delante.

**Lo que el formato tiene que garantizar sí o sí**, venga de donde venga: que las
repeticiones sean **números presentes en el programa**. Es lo que permite contar
los pasos sin simular el juego. Está explicado en el contrato §3.

### J7 y J10 son las dos migraciones, y las dos tienen parada

`ROADMAP.md` §1.3 punto 9: **el SQL se lee antes de aplicarlo, y quien hace
cumplir esa parada es el usuario**, porque sólo él lanza `supabase db push`. No
se lanza hasta que la sesión que revisa haya leído el SQL y lo haya dicho.

- **J7** siembra la configuración de los tres niveles del mundo 1 en
  `levels.validation_rules`, e iguala `xp_reward` a 100 en los nueve, que hoy
  está sembrado con 100, 120, 140, 180, 200, 240 y 260.
- **J10** es la de fondo, y la que `ROADMAP.md` §3.2 ya describe: hoy
  `upsert_my_progress` concede el XP **una sola vez**, así que un segundo intento
  perfecto suma cero. Hay que pasar a conceder por diferencia de marca, y a
  calcular la puntuación contando el programa en vez de creerse la que llegue.

### Qué comparte con el roadmap principal

Tres pasos de aquí son la cara «juego» de pasos que ya existen allí. **No son
trabajo duplicado: son el mismo trabajo mirado desde el otro lado**, y conviene
cerrarlos a la vez para que no se queden a medias:

| De aquí | Es el paso… |
| --- | --- |
| J8 | **20** — pantalla de nivel, ruta y conectar la selección al backend |
| J9 y J10 | **21** — escritura de progreso y XP desde el juego |
| J11 | Hereda del **28**, que puso la barra, y del **22**, que fija el máximo |

Y lo que **no** entra aquí, aunque lo parezca: los **logros** y las **misiones**
son el paso 22, y el juego no participa. No los nombra, no los reporta y no sabe
que existen. Si algún paso de este roadmap se ve haciéndolo, se salió del
contrato.

---

## 4. Lo que este roadmap da por hecho y no lo está

Escrito para que no se descubra a mitad:

- **El mundo 3 puede necesitar condiciones que dependan del entorno** —«si hay
  pared, gira»—, y ese día el recuento de pasos deja de poder calcularse leyendo
  el programa. Está anotado en `DISENO-DEL-JUEGO.md` §3. Si el J12 llega ahí, la
  decisión se toma entonces, no se improvisa.
- **El juego debe cargarse sólo en la pantalla de nivel**, con importación
  dinámica. El bundle ya avisa de que pasa de 500 kB y el motor 3D más Blockly
  suman bastante más. Es una línea, y se pone en el J1 o no se pone nunca.
- **Nada de lo escrito hoy en `apps/web` llama a `create_level_attempt` ni a
  `upsert_my_progress`.** Las dos funciones existen y están medidas contra la
  base real, pero desde la aplicación no las usa nadie: el J9 es la primera vez.
  El detalle está en el apéndice del contrato.
