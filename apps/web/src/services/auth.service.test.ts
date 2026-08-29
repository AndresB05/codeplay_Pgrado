import { AuthError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../constants/routes';
import { ACCOUNT_ALREADY_EXISTS, authService } from './auth.service';

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
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

/*
 * La otra URL cuyo fallo no se ve en la aplicación: si no casa con la lista de
 * Redirect URLs del panel, Supabase NO devuelve error —vuelve en silencio al
 * Site URL—, así que el síntoma es aterrizar en la landing y parece un fallo del
 * código. Y tiene que ser una ruta sin rol: `/dashboard` rebotaba a los tutores.
 */
describe('authService.signInWithGoogle', () => {
  it('pide el flujo con la vuelta a la pantalla de callback', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    });

    await authService.signInWithGoogle();

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}`,
      },
    });
  });

  it('devuelve el motivo cuando Supabase no da URL de redirección', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });

    const result = await authService.signInWithGoogle();

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });
});

/*
 * La señal de «ese correo ya tiene cuenta» se MIDIÓ contra el proyecto real y no
 * es la que documenta Supabase: con la confirmación por correo apagada responde
 * 422 `user_already_exists`, no un usuario con `identities` vacío. Si alguien
 * cambiara ese interruptor, este test es lo que avisaría de que la detección hay
 * que rehacerla.
 */
describe('authService.signUp', () => {
  it('reconoce el correo que ya tiene cuenta', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: 'user_already_exists', message: 'User already registered', status: 422 },
    });

    const result = await authService.signUp({
      email: 'alguien@codeplay.test',
      fullName: 'Alguien',
      password: 'secreta',
      role: 'child',
    });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ACCOUNT_ALREADY_EXISTS);
  });

  it('no revela el rol de la cuenta que ya existe', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: 'user_already_exists', message: 'User already registered', status: 422 },
    });

    const result = await authService.signUp({
      email: 'alguien@codeplay.test',
      fullName: 'Alguien',
      password: 'secreta',
      role: 'child',
    });

    expect(result.error?.message).not.toMatch(/tutor|ni.o/i);
  });
});

/*
 * Esto NO comprueba qué dice cada entrada del mapa —un test así lo repetiría y
 * los dos dirían la misma mentira—, sino la fontanería: que el texto crudo del
 * servidor deja de ser lo que se pinta. Sin ella, el `error.message` en inglés
 * viajaba entero hasta la pantalla de acceso de una aplicación para niños.
 */
describe('authService, mensajes del servidor', () => {
  const SERVER_MESSAGE = 'Invalid login credentials';

  it('traduce el fallo y deja el mensaje del servidor sólo como causa', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthError(SERVER_MESSAGE, 400, 'invalid_credentials'),
    });

    const result = await authService.signIn({
      email: 'alguien@codeplay.test',
      password: 'equivocada',
    });

    expect(result.error?.message).toBeTruthy();
    expect(result.error?.message).not.toContain(SERVER_MESSAGE);
    expect(result.error?.cause).toMatchObject({ message: SERVER_MESSAGE });
  });
});
