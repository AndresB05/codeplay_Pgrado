import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import { buildAuthValue } from '../../test/buildAuthValue';
import { buildUser } from '../../test/renderClassrooms';
import { ResetPassword } from './ResetPassword';

const updatePassword = vi.fn();

const renderReset = () =>
  render(
    <StrictMode>
      <AuthContext.Provider value={{ ...buildAuthValue(buildUser()), updatePassword }}>
        <MemoryRouter initialEntries={['/reset-password']}>
          <ResetPassword />
        </MemoryRouter>
      </AuthContext.Provider>
    </StrictMode>
  );

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePassword.mockResolvedValue(true);
  });

  /*
   * La trampa de este paso: quien llega aquí es exactamente quien no sabe su
   * contraseña. Arrastrar el campo de Ajustes sería pedirle el dato que vino a
   * recuperar.
   */
  it('no pide la contraseña actual', () => {
    renderReset();

    expect(screen.queryByLabelText(/contraseña actual/i)).toBeNull();
    expect(screen.getByLabelText(/^contraseña nueva$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repite la contraseña nueva/i)).toBeInTheDocument();
  });

  it('no llama al servicio si las dos contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText(/^contraseña nueva$/i), 'Paso13-Buena');
    await user.type(screen.getByLabelText(/repite la contraseña nueva/i), 'Paso13-Distinta');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden');
    });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('no llama al servicio si la contraseña es demasiado corta', async () => {
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText(/^contraseña nueva$/i), 'abc');
    await user.type(screen.getByLabelText(/repite la contraseña nueva/i), 'abc');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('al menos 6 caracteres');
    });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('llama al servicio cuando las dos coinciden', async () => {
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText(/^contraseña nueva$/i), 'Paso13-Buena');
    await user.type(screen.getByLabelText(/repite la contraseña nueva/i), 'Paso13-Buena');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('Paso13-Buena');
    });
  });
});
