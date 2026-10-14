/*
 * La capa que bloquea el lienzo y la caja con el recorrido detenido. Se come el
 * puntero en vez de pasar Blockly a sólo lectura, porque eso se decide al
 * inyectar y reinyectar tira los bloques. La usan la pantalla de nivel y el
 * laboratorio, que son las dos composiciones que poseen el lienzo.
 *
 * Desde que no hay «Reiniciar», la salida para cambiar los bloques la ofrece el
 * propio bloqueo: «Limpiar» también levanta el bloqueo, pero se los lleva. Va
 * sólo en el del lienzo; el de la caja es un velo.
 */
interface HaltedLockProps {
  onChangeBlocks?: () => void;
}

export const HaltedLock = ({ onChangeBlocks }: HaltedLockProps) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[18px] bg-mist/70 px-4 text-center">
    <p className="font-display text-[15px] text-ink-soft">
      {onChangeBlocks === undefined
        ? 'Recorrido detenido.'
        : 'Recorrido detenido: pulsa «Ejecutar» para seguir o cambia tus bloques.'}
    </p>

    {onChangeBlocks !== undefined && (
      <button type="button" onClick={onChangeBlocks} className="btn btn-sm btn-grape">
        Cambiar los bloques
      </button>
    )}
  </div>
);
