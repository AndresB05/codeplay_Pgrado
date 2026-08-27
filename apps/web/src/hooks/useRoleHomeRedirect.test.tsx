import { StrictMode, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';
import { buildUser } from '../test/renderClassrooms';
import type { User } from '../types/user.types';
import { useRoleHomeRedirect } from './useRoleHomeRedirect';

const buildAuthValue = (user: User | null): AuthContextValue => ({
  clearError: () => undefined,
  error: null,
  loading: false,
  session: null,
  signIn: async () => false,
  signInWithGoogle: async () => false,
  signOut: async () => false,
  signUp: async () => 'error' as const,
  user,
});

/** Arranca la espera al montarse, que es lo que hacen las tres pantallas. */
const Probe = () => {
  const { awaitingProfile, start } = useRoleHomeRedirect();

  useEffect(() => {
    start();
  }, [start]);

  return <span data-testid="esperando">{awaitingProfile ? 'sí' : 'no'}</span>;
};

const CurrentRoute = () => {
  const location = useLocation();

  return <span data-testid="ruta">{location.pathname}</span>;
};

const renderRedirect = (user: User | null) => {
  const { rerender } = render(
    <StrictMode>
      <AuthContext.Provider value={buildAuthValue(user)}>
        <MemoryRouter initialEntries={['/login']}>
          <Probe />
          <CurrentRoute />
        </MemoryRouter>
      </AuthContext.Provider>
    </StrictMode>
  );

  return (nextUser: User | null) =>
    rerender(
      <StrictMode>
        <AuthContext.Provider value={buildAuthValue(nextUser)}>
          <MemoryRouter initialEntries={['/login']}>
            <Probe />
            <CurrentRoute />
          </MemoryRouter>
        </AuthContext.Provider>
      </StrictMode>
    );
};

const currentRoute = (): string => screen.getByTestId('ruta').textContent ?? '';

describe('useRoleHomeRedirect', () => {
  it('lleva a un tutor al panel de salones', async () => {
    renderRedirect(buildUser({ role: 'tutor' }));

    await waitFor(() => {
      expect(currentRoute()).toBe('/teacher/groups');
    });
  });

  it('lleva a un niño al panel de mundos', async () => {
    renderRedirect(buildUser({ role: 'child' }));

    await waitFor(() => {
      expect(currentRoute()).toBe('/dashboard/worlds');
    });
  });

  /*
   * El destino se decide con el perfil, así que sin perfil no hay destino que
   * elegir. Navegar antes de tenerlo es lo que enseñaba un panel ajeno durante
   * un instante.
   */
  it('no navega mientras el perfil no ha llegado, y navega en cuanto llega', async () => {
    const rerenderWith = renderRedirect(null);

    await waitFor(() => {
      expect(screen.getByTestId('esperando')).toHaveTextContent('sí');
    });
    expect(currentRoute()).toBe('/login');

    rerenderWith(buildUser({ role: 'tutor' }));

    await waitFor(() => {
      expect(currentRoute()).toBe('/teacher/groups');
    });
  });
});
