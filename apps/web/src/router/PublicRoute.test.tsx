import { StrictMode, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { savePendingInvitationToken } from '../context/invitationToken.helpers';
import { useRoleHomeRedirect } from '../hooks/useRoleHomeRedirect';
import { buildAuthValue, FAKE_SESSION } from '../test/buildAuthValue';
import { buildUser } from '../test/renderClassrooms';
import { PublicRoute } from './PublicRoute';

const CurrentRoute = () => {
  const location = useLocation();

  return <span data-testid="ruta">{location.pathname}</span>;
};

/**
 * Una pantalla pública cualquiera de las que montan el hook —`Login`, `Signup`
 * y la barra de la landing lo hacen—. Avisa si llega a montarse, que es lo que
 * distingue quién redirigió.
 */
const PublicScreen = ({ onMount }: { onMount: () => void }) => {
  const { start } = useRoleHomeRedirect();

  useEffect(() => {
    onMount();
    start();
  }, [onMount, start]);

  return <span data-testid="pantalla">pública</span>;
};

/*
 * La carrera entre `PublicRoute` y `useRoleHomeRedirect`, que estuvo abierta
 * desde siempre y no se notaba porque los dos calculaban el mismo destino.
 *
 * Con el enlace de invitación dejaron de coincidir, y el que gana es la guarda:
 * `useActiveRole` devuelve `user?.role`, así que el rol llega en el mismo render
 * que el usuario y `PublicRoute` —el padre— devuelve `<Navigate>` sin llegar a
 * renderizar a su hijo. El efecto del hook no corre porque el hook no existe.
 *
 * Se fija aquí para que nadie «arregle» el destino en el hook creyendo que basta.
 */
describe('PublicRoute con una invitación pendiente', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderGuarded = (onMount = () => {}) =>
    render(
      <StrictMode>
        <AuthContext.Provider value={buildAuthValue(buildUser({ role: 'child' }), FAKE_SESSION)}>
          <MemoryRouter initialEntries={['/login']}>
            <CurrentRoute />
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <PublicScreen onMount={onMount} />
                  </PublicRoute>
                }
              />
              <Route path="/invite/:token" element={<span>canje</span>} />
              <Route path="/dashboard/worlds" element={<span>panel</span>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </StrictMode>
    );

  it('lleva al canje y no al panel, con sesión y rol ya disponibles', async () => {
    savePendingInvitationToken('a1b2c3');

    renderGuarded();

    await waitFor(() => {
      expect(screen.getByTestId('ruta')).toHaveTextContent('/invite/a1b2c3');
    });
  });

  /*
   * NO consume, y este aserto es lo que lo fija. `PublicRoute` decide durante el
   * render, que StrictMode invoca dos veces: con un borrado aquí, la primera
   * pasada gastaba el token y la segunda ya no lo encontraba, así que redirigía
   * al panel con el token igualmente gastado. Medido, no razonado — este mismo
   * archivo estuvo en rojo por eso.
   *
   * El borrado es de `pages/Invite`, que es a donde lleva esta redirección.
   */
  it('no consume el token: eso lo hace quien llega, no quien decide', async () => {
    savePendingInvitationToken('a1b2c3');

    renderGuarded();

    await waitFor(() => {
      expect(screen.getByTestId('ruta')).toHaveTextContent('/invite/a1b2c3');
    });

    expect(window.localStorage.getItem('classrooms:pendingInvitationToken')).toBe('a1b2c3');
  });

  /*
   * Lo que prueba QUIÉN redirige. Si el hook fuera el responsable, su pantalla
   * tendría que haberse montado para que su efecto corriera.
   */
  it('redirige la guarda, sin llegar a montar la pantalla que monta el hook', async () => {
    savePendingInvitationToken('a1b2c3');

    const onMount = vi.fn();

    renderGuarded(onMount);

    await waitFor(() => {
      expect(screen.getByTestId('ruta')).toHaveTextContent('/invite/a1b2c3');
    });

    expect(onMount).not.toHaveBeenCalled();
  });

  it('sin invitación pendiente lleva al panel del rol, como siempre', async () => {
    renderGuarded();

    await waitFor(() => {
      expect(screen.getByTestId('ruta')).toHaveTextContent('/dashboard/worlds');
    });
  });
});
