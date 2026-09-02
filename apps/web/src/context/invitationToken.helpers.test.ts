import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingInvitationToken,
  savePendingInvitationToken,
  takePendingInvitationToken,
} from './invitationToken.helpers';

/*
 * Que el token se consuma UNA SOLA VEZ es lo único que impide que la invitación
 * de alguien alcance a quien use el navegador después. En un computador de aula
 * eso metería al niño siguiente en un salón ajeno, y no se ve en ninguna
 * pantalla: se fija aquí.
 */
describe('invitationToken.helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('devuelve el token guardado la primera vez y nulo la segunda', () => {
    savePendingInvitationToken('a1b2c3');

    expect(takePendingInvitationToken()).toBe('a1b2c3');
    expect(takePendingInvitationToken()).toBeNull();
  });

  it('la invitación consumida no alcanza a quien entra después', () => {
    savePendingInvitationToken('a1b2c3');
    takePendingInvitationToken();

    // El segundo viaje del mismo navegador, que puede ser el de otra persona.
    expect(takePendingInvitationToken()).toBeNull();
  });

  it('no devuelve nada cuando no se guardó ningún token', () => {
    expect(takePendingInvitationToken()).toBeNull();
  });

  it('descarta un token vacío en vez de guardarlo', () => {
    savePendingInvitationToken('');

    expect(takePendingInvitationToken()).toBeNull();
  });

  it('borrar deja el almacén sin el token', () => {
    savePendingInvitationToken('a1b2c3');
    clearPendingInvitationToken();

    expect(takePendingInvitationToken()).toBeNull();
  });
});
