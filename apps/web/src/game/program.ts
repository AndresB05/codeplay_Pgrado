/*
 * El sobre del programa. El J3 lo fijó en CONTRATO-DE-INTEGRACION.md §4.3, que
 * es donde está el porqué; aquí sólo vive el tipo y las dos funciones que lo
 * cierran y lo abren.
 *
 * Aquí NO se importa Blockly, y no es casualidad: el J8 abre con esto el
 * `starterProgram` que llegue de la base y el J9 cierra con esto el intento que
 * manda, y ninguno de los dos tiene por qué depender del editor para eso. Es la
 * misma línea que separa `movement.ts` de la escena.
 */

/*
 * Lo que serialice el editor, sin mirar dentro. La forma es de Blockly y este
 * módulo no la conoce a propósito: conocerla sería escribir aquí una segunda
 * copia del formato que el contrato ya delega en el editor.
 */
export type WorkspaceState = Record<string, unknown>;

/*
 * El token nombra el par: `grid` por la forma de `config`, `blockly` por el
 * interior del sobre y el número por la versión. Si cambia cualquiera de las dos,
 * el juego desplegado no puede con ese nivel (§7).
 *
 * La 2 llegó con las alturas del tablero y el bloque «saltar», que lleva otros
 * dentro: cambiaron las dos formas a la vez. Es la ÚNICA que se acepta, y se pudo
 * retirar la 1 sin coste porque todavía no había ningún intento guardado que la
 * llevara; el día que los haya, cambiar de versión obligará a decidir qué se hace
 * con ellos.
 */
export const PROGRAM_FORMAT_VERSION = 'grid-blockly-2';

export interface Program {
  formatVersion: string;
  workspace: WorkspaceState;
}

export const sealProgram = (workspace: WorkspaceState): Program => ({
  formatVersion: PROGRAM_FORMAT_VERSION,
  workspace,
});

/*
 * Devuelve `null` cuando no puede leerlo, y no el motivo: a diferencia de
 * `advance`, esta función no tiene que distinguir los casos para decidir —todos
 * acaban igual—, así que un motivo sería información inventada para nadie. §7
 * del contrato manda avisar al anfitrión, y quien avise es quien tenga
 * anfitrión: el J8.
 *
 * Y rechaza el sobre ENTERO, nunca a medias. Un nivel que no se puede cargar es
 * un contratiempo; uno cargado mal y jugado hasta el final guarda un intento que
 * nadie podrá volver a leer.
 */
export const openProgram = (value: unknown): WorkspaceState | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { formatVersion, workspace } = value as Partial<Program>;

  if (formatVersion !== PROGRAM_FORMAT_VERSION) {
    return null;
  }

  if (typeof workspace !== 'object' || workspace === null || Array.isArray(workspace)) {
    return null;
  }

  return workspace;
};
