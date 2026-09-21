import type { TeacherResource } from '../../../types/classroom.types';

/*
 * Los textos describen la plataforma tal como funciona hoy: la regla de
 * puntuación, los bloques, los candados y el catálogo de logros. Si cambia
 * alguna de esas piezas, estos textos mienten sin que nada falle.
 */
export const teacherResources: TeacherResource[] = [
  {
    id: 'r1',
    title: 'Cómo se resuelven los acertijos',
    description:
      'Recorrido por la mecánica de los mundos y qué se espera que el niño descubra en cada uno.',
    categoryLabel: 'Guía de la plataforma',
    sections: [
      {
        heading: 'Una sola mecánica, tres mundos',
        paragraphs: [
          'Cada nivel es un tablero en 3D con una casilla de salida y una meta. El niño no mueve al personaje con el teclado: arma un programa con bloques y lo ejecuta para ver si llega. Si no llega, vuelve al tablero con sus bloques intactos y puede corregirlos.',
          'La mecánica es la misma en los tres mundos. Lo que cambia es qué tiene que pensar el niño para resolver el tablero, y eso responde a los pilares del pensamiento computacional: diseño de algoritmos, reconocimiento de patrones, descomposición, abstracción y evaluación.',
        ],
      },
      {
        heading: 'Los bloques',
        paragraphs: [
          '«Avanzar» camina el número de casillas que el niño escriba hacia donde mira el personaje. «Girar a la izquierda» y «Girar a la derecha» dan un cuarto de vuelta sin cambiar de casilla; llevan colores distintos para que se distingan antes de leerlos. «Saltar» es un bloque que envuelve a otros: lo que se pone dentro se hace saltando, y así se sube a una casilla más alta.',
          'Un paso es una casilla recorrida o un giro. «Avanzar 4» son cuatro pasos aunque sea un solo bloque. Por eso importa cuántos movimientos hace el personaje, no cuántos bloques hay en pantalla.',
        ],
      },
      {
        heading: 'Qué se espera en cada mundo',
        paragraphs: [
          'Sendero de los Patrones (algoritmos y patrones). «Siempre adelante», «Camino con curvas» y «La escalera». El niño aprende que el orden de las instrucciones importa y empieza a ver tramos que se repiten: si el camino sube en escalera, el mismo par de movimientos sirve una y otra vez.',
          'Cordillera de la Abstracción (descomposición y abstracción). «Salta y sube», «El gran rodeo» y «La torre». Aparecen las alturas y el bloque de saltar. El recorrido ya no cabe en la cabeza de una vez: conviene partirlo en tramos, resolver cada uno y después unirlos.',
          'Encrucijada de las Decisiones (evaluación de problemas). «Dos caminos», «El faro» y «Muchos caminos». Varios caminos llegan a la meta, pero hay un límite de pasos igual al de la mejor solución. Llegar no basta: hay que comparar caminos antes de programar y elegir el más corto.',
        ],
      },
      {
        heading: 'El orden de los niveles',
        paragraphs: [
          'El primer nivel de cada mundo está siempre abierto; los demás se desbloquean al superar el anterior. Un niño que se atasca en un mundo puede empezar otro mientras tanto, y eso a veces le da la idea que le faltaba.',
        ],
      },
      {
        heading: 'Cómo se puntúa',
        paragraphs: [
          'La puntuación premia la eficiencia, no el esfuerzo. Llegar con los mismos pasos que la mejor solución da 100 de 100; cada paso de más baja la marca en proporción. Llegar siempre puntúa algo, y no llegar puntúa cero.',
          'Cada nivel da como máximo 100 XP y la experiencia no se acumula repitiendo: si la primera vez sacó 80 y luego consigue 100, sólo gana los 20 que le faltaban. Repetir un nivel sirve para mejorar la solución, no para sumar puntos. Cada 300 XP el niño sube de Nivel Explorador, que es justo lo que da un mundo resuelto a la perfección.',
        ],
      },
    ],
  },
  {
    id: 'r2',
    title: 'Qué significan los trofeos',
    description:
      'Cada trofeo cuenta algo distinto de cómo juega el niño. Aprende a leerlos para saber dónde apoyar.',
    categoryLabel: 'Logros',
    sections: [
      {
        heading: 'Dónde se ven',
        paragraphs: [
          'Cada niño tiene su Sala de Trofeos, donde aparecen los que ha ganado y también los que le faltan. Los concede el servidor al guardar una partida, así que no se pueden conseguir desde fuera del juego. Todos dan experiencia extra.',
        ],
      },
      {
        heading: 'Perfecto',
        paragraphs: [
          'Uno por nivel: se gana al superarlo con 100 de 100, es decir, con los mismos pasos que la mejor solución. Dicen que el niño no se conformó con llegar y buscó el camino corto. Un nivel superado sin su «Perfecto» es buena excusa para preguntarle si cree que se puede hacer con menos.',
        ],
      },
      {
        heading: 'Grandes trofeos',
        paragraphs: [
          '«Dueño del Sendero», «Dueño de la Cordillera» y «Dueño de la Encrucijada» se ganan con los tres niveles del mundo en 100 de 100. «Maestro Explorador», con los nueve. Como cada mundo trabaja un pilar distinto, el trofeo de un mundo indica dominio de ese pilar: quien tiene la Cordillera y no la Encrucijada descompone bien, pero todavía no compara soluciones antes de programar.',
        ],
      },
      {
        heading: 'Trofeos de acción',
        paragraphs: [
          '«Sin mareos», «Intentando volar», «Eso fue innecesario...» y «¡Auch! mis rodillas» premian programas raros que aun así llegan a la meta: una vuelta entera de giros, diez saltos, un recorrido de exactamente 67 pasos. Son la parte traviesa del catálogo y premian experimentar. No dicen nada de eficiencia, y está bien: probar qué pasa es parte de aprender.',
        ],
      },
      {
        heading: 'Rachas',
        paragraphs: [
          '«Vuelvo mañana», «Semana completa» y «Un mes sin fallar» se ganan superando algún nivel tres, siete y treinta días seguidos, contados en hora de Colombia. Hablan de constancia, no de habilidad: un niño con buena racha y marcas bajas está enganchado y necesita otro tipo de ayuda que uno con marcas altas que entra poco.',
        ],
      },
    ],
  },
  {
    id: 'r3',
    title: 'Acompañar sin dar la respuesta',
    description:
      'Preguntas que puedes hacerle al niño cuando se atasca, sin resolverle el acertijo.',
    categoryLabel: 'Acompañamiento',
    sections: [
      {
        heading: 'Por qué no darle la solución',
        paragraphs: [
          'El juego está pensado para que el niño explore, se equivoque, vea enseguida qué pasó y lo vuelva a intentar. Esa retroalimentación inmediata y la persistencia ante la dificultad son lo que hace que aprenda. Si le dictas los bloques, supera el nivel, pero se pierde justo lo que el nivel quería enseñarle.',
          'Tu papel es hacerle ver lo que todavía no ve, con preguntas. Equivocarse aquí no cuesta nada: fallar no resta experiencia y los bloques se quedan donde estaban.',
        ],
      },
      {
        heading: 'Cuando no sabe por dónde empezar',
        paragraphs: [
          '«¿Hacia dónde mira el personaje ahora?» Muchos atascos vienen de confundir la izquierda del personaje con la de la pantalla.',
          '«Señala con el dedo el camino hasta la meta. ¿Cuántas casillas hay hasta la primera curva?»',
          '«¿Qué es lo primero que tiene que hacer? Pon sólo ese bloque y ejecútalo.»',
        ],
      },
      {
        heading: 'Cuando el programa falla',
        paragraphs: [
          '«Míralo otra vez. ¿En qué casilla empezó a hacer algo que no querías?» Así busca el error él, en vez de rehacerlo todo.',
          '«¿Ese giro va antes o después de avanzar?»',
          '«Lee tu programa en voz alta, bloque por bloque, y sigue al personaje con el dedo.»',
        ],
      },
      {
        heading: 'Cuando el camino es largo',
        paragraphs: [
          '«¿Puedes partir el camino en trozos? ¿Dónde acaba el primero?» Es la descomposición que trabaja la Cordillera de la Abstracción.',
          '«¿Hay algún trozo que se parezca a otro que ya resolviste?» Reconocer el patrón ahorra pensar dos veces lo mismo.',
          '«Para subir a esa casilla, ¿qué bloque necesitas y qué va dentro de él?»',
        ],
      },
      {
        heading: 'Cuando llega, pero con pasos de más',
        paragraphs: [
          '«La mejor solución usa menos pasos. ¿Qué movimiento podrías quitar?»',
          '«¿Hay algún giro que se deshaga con el siguiente?»',
          'En la Encrucijada de las Decisiones hay un límite de pasos y el camino largo no alcanza: «Antes de poner bloques, cuenta los pasos de cada camino. ¿Cuál es más corto?»',
        ],
      },
      {
        heading: 'Cuándo sí ayudar más',
        paragraphs: [
          'Si después de varias preguntas sigue sin avanzar y se frustra, dale una pista concreta sobre un solo tramo, no el programa entero. También vale proponerle otro mundo y volver después: el primer nivel de cada uno está siempre abierto. Cuando por fin llegue, pídele que te explique cómo lo hizo; contarlo lo afianza.',
        ],
      },
    ],
  },
  {
    id: 'r4',
    title: 'Leer el progreso de tus exploradores',
    description:
      'Cómo interpretar las marcas, los intentos y los pasos, y cuándo conviene asignar una misión.',
    categoryLabel: 'Guía de la plataforma',
    sections: [
      {
        heading: 'El resumen del salón',
        paragraphs: [
          'Arriba del panel ves cuántos exploradores han jugado, cuántos niveles y mundos llevan superados entre todos y la eficiencia media, que es el promedio de sus mejores marcas. Quien no ha jugado cuenta en el total pero no en ese promedio, para que un niño que no ha empezado no baje la media de los demás.',
          'Una eficiencia media alta con pocos niveles superados indica un salón que avanza despacio pero con cuidado. Muchos niveles con eficiencia baja, un salón que llega pero no afina sus soluciones.',
        ],
      },
      {
        heading: 'La ficha de cada explorador',
        paragraphs: [
          'Al elegir un niño ves sus nueve niveles agrupados por mundo. «Sin empezar» quiere decir que no ha entrado; «Sin superar», que lo intentó y todavía no llegó a la meta. Son situaciones distintas: la primera pide ánimo para empezar, la segunda, acompañamiento en ese tablero.',
          'La marca es su mejor puntuación en el nivel, de 0 a 100, y nunca baja. 100 es la solución óptima.',
        ],
      },
      {
        heading: 'Los pasos de cada partida',
        paragraphs: [
          'Cada partida aparece como un número: los pasos que usó. Las que llegaron a la meta van en verde; las que no, con una cruz delante. Al lado está el óptimo del nivel para comparar.',
          'La tira cuenta cómo pensó el niño. Números que bajan hacia el óptimo son un niño que mejora su solución. Muchas cruces seguidas con pocos pasos, alguien que se queda corto y no encuentra cómo seguir: un buen momento para las preguntas de «Acompañar sin dar la respuesta». Una sola partida verde lejos del óptimo, alguien que se conformó con llegar.',
        ],
      },
      {
        heading: 'La tabla del salón',
        paragraphs: [
          'En cada salón ves a los exploradores con su Nivel Explorador, la experiencia acumulada, la racha y la última actividad, y quién está conectado en este momento. Se puede ordenar por experiencia, por racha o por nombre. Mira la experiencia acumulada y no sólo la barra: la barra se vacía cada vez que el niño sube de nivel.',
        ],
      },
      {
        heading: 'Cuándo asignar una misión',
        paragraphs: [
          'Las misiones son retos especiales que dan más experiencia que un nivel y que el niño sólo ve si se las asignas. Se asignan al salón entero, no a un niño concreto, y cada una se cobra una sola vez.',
          'Conviene asignar una cuando buena parte del salón ya superó los niveles de un mundo y necesita un reto más, o cuando la eficiencia se estanca y quieres un objetivo nuevo. Puedes ponerle fecha límite: vale hasta el final de ese día en hora de Colombia y después deja de verse. Si vence, puedes reasignarla con una fecha nueva, y quien ya la cumplió no la vuelve a cobrar.',
          'En «Quién ha cumplido» ves, niño por niño, qué misiones tiene cumplidas y cuáles pendientes.',
        ],
      },
    ],
  },
];

const WORDS_PER_MINUTE = 200;

export const resourceReadMinutes = (resource: TeacherResource): number => {
  const words = resource.sections
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};
