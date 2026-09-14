import * as Blockly from 'blockly/core';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ADVANCE_BLOCK,
  JUMP_BLOCK,
  JUMP_BODY,
  STEPS_FIELD,
  TURN_LEFT_BLOCK,
  TURN_RIGHT_BLOCK,
  defineGameBlocks,
} from './blocks';
import { countSteps, readProgram } from './interpreter';
import { openProgram, sealProgram } from './program';

/*
 * El viaje de ida y vuelta, que es lo ÚNICO que valida la decisión del J3:
 * guardar el JSON nativo de Blockly no cuesta código «porque serializa y
 * deserializa solo». Eso era una apuesta hasta este paso, y el J8 —que recibe el
 * `starterProgram` y tiene que abrirlo con el mismo lector— depende de ella.
 *
 * Se prueba contra un espacio de trabajo SIN INTERFAZ —`new Blockly.Workspace()`
 * en vez de `Blockly.inject`—, que no dibuja nada. Por eso se puede probar
 * aunque jsdom no implemente WebGL ni mida elementos, que es lo que dejó al J1
 * sin tests.
 *
 * QUÉ CUBRE ESTE TEST Y QUÉ NO. Bajo Vitest se está en un entorno de node, así
 * que `blockly/core` se resuelve por la condición `node` de su `exports` hasta
 * `core-node.js`, mientras el navegador recibe `blockly.mjs`. Los dos son
 * envoltorios del MISMO `blockly_compressed.js` —comprobado leyendo los dos
 * archivos—, así que la serialización que aquí se prueba es exactamente la que
 * corre en el navegador. Lo único que `core-node.js` añade es inyectar el
 * DOMParser de jsdom «si `globalThis.document` no es un objeto»; jsdom sí se
 * carga —el `require` va antes del `if`—, pero bajo el entorno jsdom de este
 * repo la condición es falsa y la inyección no se ejecuta.
 *
 * Lo que NO cubre: el editor montado —`inject`, el arrastre, el redibujado—.
 * Eso no se prueba en jsdom y se verifica en el navegador.
 */

const steps = (block: Blockly.Block): number => Number(block.getFieldValue(STEPS_FIELD));

const buildProgram = (workspace: Blockly.Workspace): void => {
  const advanceFour = workspace.newBlock(ADVANCE_BLOCK);
  advanceFour.setFieldValue(4, STEPS_FIELD);

  const turnLeft = workspace.newBlock(TURN_LEFT_BLOCK);
  const advanceTwo = workspace.newBlock(ADVANCE_BLOCK);
  advanceTwo.setFieldValue(2, STEPS_FIELD);

  advanceFour.nextConnection!.connect(turnLeft.previousConnection!);
  turnLeft.nextConnection!.connect(advanceTwo.previousConnection!);
};

describe('los bloques del juego', () => {
  beforeAll(() => {
    defineGameBlocks();
  });

  it('define las cuatro órdenes y ninguna más', () => {
    expect(Blockly.Blocks[ADVANCE_BLOCK]).toBeDefined();
    expect(Blockly.Blocks[TURN_LEFT_BLOCK]).toBeDefined();
    expect(Blockly.Blocks[TURN_RIGHT_BLOCK]).toBeDefined();
    expect(Blockly.Blocks[JUMP_BLOCK]).toBeDefined();
    expect(Blockly.Blocks['controls_repeat_ext']).toBeUndefined();
  });

  /*
   * EL PRIMER BLOQUE CON OTROS DENTRO, contra la salida REAL del editor y no
   * contra una forma escrita a mano: el contrato §4.3 dejaba el anidamiento sin
   * registrar a propósito hasta que existiera un bloque que lo produjera. Lo que
   * se comprueba es el viaje entero —guardar, cerrar el sobre, abrirlo, volver a
   * cargar— y que el intérprete lee lo que Blockly escribe.
   */
  it('va y vuelve con un saltar lleno, y el intérprete lo lee', () => {
    const workspace = new Blockly.Workspace();
    const jump = workspace.newBlock(JUMP_BLOCK);
    const turnRight = workspace.newBlock(TURN_RIGHT_BLOCK);
    const advanceOne = workspace.newBlock(ADVANCE_BLOCK);
    advanceOne.setFieldValue(1, STEPS_FIELD);

    jump.getInput(JUMP_BODY)!.connection!.connect(turnRight.previousConnection!);
    turnRight.nextConnection!.connect(advanceOne.previousConnection!);

    const saved = Blockly.serialization.workspaces.save(workspace);
    const reopened = openProgram(JSON.parse(JSON.stringify(sealProgram(saved))));

    const other = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(reopened!, other);

    expect(Blockly.serialization.workspaces.save(other)).toEqual(saved);
    expect(readProgram(saved)?.orders).toEqual([
      {
        kind: 'jump',
        body: [
          { kind: 'turn', side: 'right' },
          { kind: 'advance', steps: 1 },
        ],
      },
    ]);
    expect(countSteps(readProgram(saved)!.orders)).toBe(4);

    /*
     * La forma que se registra en el contrato §4.3, copiada de lo que esto
     * imprimió el 13-sep-2026: el cuerpo cuelga de `inputs.BODY.block` y sigue su
     * propia cadena por `next`, igual que la secuencia principal.
     */
    expect(saved).toMatchObject({
      blocks: {
        blocks: [
          {
            type: JUMP_BLOCK,
            inputs: {
              [JUMP_BODY]: {
                block: {
                  type: TURN_RIGHT_BLOCK,
                  next: { block: { type: ADVANCE_BLOCK, fields: { [STEPS_FIELD]: 1 } } },
                },
              },
            },
          },
        ],
      },
    });
  });

  it('deja el número de casillas dentro del propio bloque', () => {
    const workspace = new Blockly.Workspace();
    const advance = workspace.newBlock(ADVANCE_BLOCK);

    advance.setFieldValue(7, STEPS_FIELD);

    expect(steps(advance)).toBe(7);
    expect(JSON.stringify(Blockly.serialization.workspaces.save(workspace))).toContain('7');
  });

  it('encadena los bloques en el orden en que se conectan', () => {
    const workspace = new Blockly.Workspace();
    buildProgram(workspace);

    const [first] = workspace.getTopBlocks(true);

    expect(first.type).toBe(ADVANCE_BLOCK);
    expect(first.getNextBlock()?.type).toBe(TURN_LEFT_BLOCK);
    expect(first.getNextBlock()?.getNextBlock()?.type).toBe(ADVANCE_BLOCK);
  });

  it('un bloque suelto no cuelga de la secuencia', () => {
    const workspace = new Blockly.Workspace();
    buildProgram(workspace);
    workspace.newBlock(TURN_RIGHT_BLOCK);

    expect(workspace.getTopBlocks(false)).toHaveLength(2);
  });

  it('va y vuelve dando el mismo programa', () => {
    const workspace = new Blockly.Workspace();
    buildProgram(workspace);

    const saved = Blockly.serialization.workspaces.save(workspace);
    const sealed = JSON.parse(JSON.stringify(sealProgram(saved)));

    const reopened = openProgram(sealed);
    expect(reopened).not.toBeNull();

    const other = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(reopened!, other);

    expect(Blockly.serialization.workspaces.save(other)).toEqual(saved);

    const [first] = other.getTopBlocks(true);
    expect(steps(first)).toBe(4);
    expect(first.getNextBlock()?.getNextBlock()?.getFieldValue(STEPS_FIELD)).toBe(2);
  });

  it('cargar un sobre vacío deja el lienzo vacío', () => {
    const workspace = new Blockly.Workspace();
    const empty = Blockly.serialization.workspaces.save(workspace);

    const other = new Blockly.Workspace();
    buildProgram(other);
    Blockly.serialization.workspaces.load(empty, other);

    expect(other.getTopBlocks(false)).toHaveLength(0);
  });
});
