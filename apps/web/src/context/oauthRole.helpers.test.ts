import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingSignupRole,
  savePendingSignupRole,
  takePendingSignupRole,
} from './oauthRole.helpers';

/*
 * Que la intención se consuma UNA SOLA VEZ es lo único que impide que un rol
 * elegido en un registro se aplique al acceso siguiente, que en un computador
 * de aula puede ser el de otra persona. No se ve en ninguna pantalla, así que
 * se fija aquí.
 */
describe('oauthRole.helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('devuelve el rol guardado la primera vez y nulo la segunda', () => {
    savePendingSignupRole('tutor');

    expect(takePendingSignupRole()).toBe('tutor');
    expect(takePendingSignupRole()).toBeNull();
  });

  it('no devuelve nada cuando no se guardó ninguna intención', () => {
    expect(takePendingSignupRole()).toBeNull();
  });

  it('descarta un rol almacenado que no es child ni tutor', () => {
    window.localStorage.setItem('auth:pendingSignupRole', 'superadmin');

    expect(takePendingSignupRole()).toBeNull();
  });

  it('borrar deja el almacén sin la intención', () => {
    savePendingSignupRole('child');
    clearPendingSignupRole();

    expect(takePendingSignupRole()).toBeNull();
  });
});
