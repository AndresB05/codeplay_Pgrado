import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import { ClassroomsProvider } from '../../context/ClassroomsProvider';
import { savePendingInvitationToken } from '../../context/invitationToken.helpers';
import { buildAuthValue, FAKE_SESSION } from '../../test/buildAuthValue';
import { buildUser } from '../../test/renderClassrooms';
import { createFakeClassrooms } from '../../test/fakeClassroomsService';
import { Invite } from './Invite';

/*
 * La previsualización es la única llamada de esta pantalla que no pasa por el
 * store, así que es lo único que hay que doblar. Lo demás entra por la prop
 * `service` del provider, como en el resto de los tests.
 */
vi.mock('../../services/invitations.service', () => ({
  invitationsService: {
    previewInvitation: vi.fn(async () => ({
      data: { groupName: 'Salón 1A', groupPublicId: 'CP-PJE6', freeSeats: 29, state: 'valid' },
      error: null,
    })),
  },
  invitationError: vi.fn(),
}));

const STORAGE_KEY = 'classrooms:pendingInvitationToken';

const renderInvite = (token: string, withSession: boolean) => {
  const server = createFakeClassrooms();

  return render(
    <StrictMode>
      <AuthContext.Provider
        value={buildAuthValue(
          withSession ? buildUser({ role: 'child' }) : null,
          withSession ? FAKE_SESSION : null
        )}
      >
        <ClassroomsProvider service={server.service}>
          <MemoryRouter initialEntries={[`/invite/${token}`]}>
            <Routes>
              <Route path="/invite/:token" element={<Invite />} />
            </Routes>
          </MemoryRouter>
        </ClassroomsProvider>
      </AuthContext.Provider>
    </StrictMode>
  );
};

/**
 * `Invite` es la dueña ÚNICA del token guardado, y puede serlo porque es el
 * único destino al que ese token lleva. Los tres que deciden destino sólo lo
 * miran.
 */
describe('Invite y el token guardado', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sin sesión lo guarda, porque el rodeo del registro va a empezar', async () => {
    renderInvite('a1b2c3', false);

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('a1b2c3');
    });
  });

  it('con sesión lo borra, porque el rodeo terminó', async () => {
    savePendingInvitationToken('a1b2c3');

    renderInvite('a1b2c3', true);

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  /*
   * El caso que obliga a que el borrado sea INCONDICIONAL. Alguien puede
   * arrastrar el token de un rodeo que abandonó y abrir después un enlace
   * distinto: si sólo se borrara el que coincide con la URL, el viejo
   * sobreviviría y alcanzaría a quien usara el navegador después.
   */
  it('con sesión borra también un token viejo que no es el de la URL', async () => {
    savePendingInvitationToken('token-de-un-rodeo-abandonado');

    renderInvite('a1b2c3', true);

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
