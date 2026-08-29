import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../errors/AppError';
import { AuthContext } from '../../context/AuthContext';
import { ACCOUNT_ALREADY_EXISTS } from '../../services/auth.service';
import { buildAuthValue } from '../../test/buildAuthValue';
import { Signup } from './Signup';

const renderSignup = (error: AppError | null) =>
  render(
    <StrictMode>
      <AuthContext.Provider value={{ ...buildAuthValue(null), error }}>
        <MemoryRouter initialEntries={['/signup']}>
          <Signup />
        </MemoryRouter>
      </AuthContext.Provider>
    </StrictMode>
  );

describe('Signup', () => {
  /*
   * El aviso de «esa cuenta ya existe» NO puede nombrar el rol. En ese punto no
   * hay sesión, así que quien está delante no está identificado, y decirlo le
   * contaría a un desconocido si detrás de ese correo hay un niño o un tutor.
   * Es el mismo criterio que la pantalla de recuperación (`CONTEXT.md` §2.2),
   * y este test existe para que nadie «mejore» el mensaje añadiendo justo el
   * dato que tiene que callar.
   */
  it('avisa de que la cuenta ya existe sin nombrar el rol', async () => {
    const user = userEvent.setup();

    renderSignup(
      new AppError('Ya existe una cuenta con ese correo. Inicia sesión.', ACCOUNT_ALREADY_EXISTS)
    );

    // El aviso vive en el paso del formulario, detrás de elegir el tipo de cuenta.
    await user.click(screen.getByRole('button', { name: /soy un guía/i }));

    const notice = screen.getByText(/ya existe una cuenta/i);

    expect(notice).toBeInTheDocument();
    expect(notice.textContent).not.toMatch(/tutor|niñ[oa]|child/i);
  });
});
