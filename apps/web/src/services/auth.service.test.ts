import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../constants/routes';
import { authService } from './auth.service';

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
  },
}));

/*
 * La URL de vuelta es la única pieza del flujo cuyo fallo NO se ve en la
 * aplicación: se manifiesta dentro del correo, que es lo más caro de depurar del
 * proyecto. Por eso se fija aquí en vez de fiarlo a la prueba manual.
 */
describe('authService.requestPasswordReset', () => {
  it('pide el correo con la vuelta a la pantalla de contraseña nueva', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await authService.requestPasswordReset('alguien@codeplay.test');

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('alguien@codeplay.test', {
      redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
    });
  });

  it('devuelve el motivo cuando el servidor rechaza el envío', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: { message: 'rate limit exceeded' } });

    const result = await authService.requestPasswordReset('alguien@codeplay.test');

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });
});
