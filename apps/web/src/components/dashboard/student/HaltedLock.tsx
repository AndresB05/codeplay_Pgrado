/*
 * La capa que bloquea el lienzo y la caja con el recorrido detenido. Se come el
 * puntero en vez de pasar Blockly a sólo lectura, porque eso se decide al
 * inyectar y reinyectar tira los bloques. La usan la pantalla de nivel y el
 * laboratorio, que son las dos composiciones que poseen el lienzo.
 */
export const HaltedLock = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[18px] bg-mist/70 px-4 text-center">
    <p className="font-display text-[15px] text-ink-soft">
      Recorrido detenido: pulsa «Reiniciar» para cambiar los bloques.
    </p>
  </div>
);
