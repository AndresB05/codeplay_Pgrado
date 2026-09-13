import { describe, expect, it } from 'vitest';
import { PROGRAM_FORMAT_VERSION, openProgram, sealProgram } from './program';

/*
 * El sobre, sin Blockly de por medio. Lo que aquí se prueba es la frontera que
 * el J8 y el J9 van a cruzar con datos que vienen de la base, así que los casos
 * malos importan tanto como el bueno: `submitted_code` es `text` sin `check` y
 * `starter_code` viene sembrado con la cadena vacía en las nueve filas.
 *
 * El viaje de ida y vuelta del espacio de trabajo se prueba aparte, en
 * `blocks.test.ts`: son dos cosas distintas y sólo una necesita el editor.
 */

const workspace = { blocks: { languageVersion: 0, blocks: [] } };

describe('sealProgram', () => {
  it('cierra el sobre con la versión del contrato', () => {
    expect(sealProgram(workspace)).toEqual({
      formatVersion: PROGRAM_FORMAT_VERSION,
      workspace,
    });
  });

  it('no toca lo que serializó el editor', () => {
    expect(sealProgram(workspace).workspace).toBe(workspace);
  });
});

describe('openProgram', () => {
  it('devuelve el espacio de trabajo de un sobre válido', () => {
    expect(openProgram(sealProgram(workspace))).toBe(workspace);
  });

  it('rechaza una versión desconocida sin leer nada de dentro', () => {
    expect(openProgram({ formatVersion: 'grid-blockly-2', workspace })).toBeNull();
  });

  it('rechaza un sobre sin versión', () => {
    expect(openProgram({ workspace })).toBeNull();
  });

  it('rechaza un sobre cuyo contenido no es un objeto', () => {
    expect(openProgram({ formatVersion: PROGRAM_FORMAT_VERSION, workspace: [] })).toBeNull();
    expect(openProgram({ formatVersion: PROGRAM_FORMAT_VERSION, workspace: 'bloques' })).toBeNull();
    expect(openProgram({ formatVersion: PROGRAM_FORMAT_VERSION })).toBeNull();
  });

  /*
   * Los tres valores con los que la base puede entregar un `starter_code`: la
   * columna es `text` y su valor por defecto es la cadena vacía, que el
   * contrato §7 llama «sin programa de partida». Aquí lo único que se comprueba
   * es que ninguno pasa por sobre; qué hacer con un nivel sin programa de
   * partida es del J8, que es quien tiene anfitrión al que avisar.
   */
  it('rechaza lo que no es un sobre', () => {
    expect(openProgram(null)).toBeNull();
    expect(openProgram('')).toBeNull();
    expect(openProgram('{}')).toBeNull();
  });
});
