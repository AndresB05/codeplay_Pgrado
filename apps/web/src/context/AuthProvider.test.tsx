import { StrictMode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { useAuth } from '../hooks/useAuth';
import { PROFILE_NOT_FOUND } from '../services/profile.service';
import { buildUser } from '../test/renderClassrooms';
import type { AuthContextValue } from './AuthContext';
import { AuthProvider } from './AuthProvider';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    getSession: mocks.getSession,
    signIn: mocks.signIn,
    signInWithGoogle: vi.fn(),
    signOut: mocks.signOut,
    signUp: mocks.signUp,
  },
}));

/*
 * Se conserva el módulo real y sólo se sustituye `getProfile`: `PROFILE_NOT_FOUND`
 * es lo que distingue las dos ramas del fallo, así que el test tiene que usar la
 * misma constante que el código y no una copia suya.
 */
vi.mock('../services/profile.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/profile.service')>();

  return {
    ...actual,
    profileService: { ...actual.profileService, getProfile: mocks.getProfile },
  };
});

const SESSION = { user: { id: 'user-1', email: 'prueba@codeplay.test' } } as unknown as Session;

const renderAuth = async (): Promise<(() => AuthContextValue)> => {
  let latest: AuthContextValue | null = null;

  const Probe = () => {
    latest = useAuth();

    return null;
  };

  render(
    <StrictMode>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </StrictMode>
  );

  await waitFor(() => {
    if (!latest || latest.loading) {
      throw new Error('El contexto sigue cargando.');
    }
  });

  return () => {
    if (!latest) {
      throw new Error('El contexto todavía no se ha renderizado.');
    }

    return latest;
  };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: null, error: null });
    mocks.signOut.mockResolvedValue({ data: undefined, error: null });
  });

  describe('sesión sin perfil', () => {
    beforeEach(() => {
      mocks.signIn.mockResolvedValue({ data: { session: SESSION, user: null }, error: null });
      mocks.getProfile.mockResolvedValue({
        data: null,
        error: new AppError('Esta cuenta no tiene perfil.', PROFILE_NOT_FOUND),
      });
    });

    it('no da por bueno el acceso', async () => {
      const auth = await renderAuth();
      let signedIn: boolean | null = null;

      await act(async () => {
        signedIn = await auth().signIn('prueba@codeplay.test', 'clave');
      });

      expect(signedIn).toBe(false);
      expect(auth().user).toBeNull();
    });

    it('cierra la sesión y deja el motivo a la vista', async () => {
      const auth = await renderAuth();

      await act(async () => {
        await auth().signIn('prueba@codeplay.test', 'clave');
      });

      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(auth().error?.code).toBe(PROFILE_NOT_FOUND);
    });
  });

  /*
   * La otra mitad de la decisión, y la que impide que un corte de red eche a un
   * usuario legítimo: sin ella la rama de arriba está sobreajustada, no probada.
   */
  it('respeta la sesión cuando el perfil falla por otro motivo', async () => {
    mocks.signIn.mockResolvedValue({ data: { session: SESSION, user: null }, error: null });
    mocks.getProfile.mockResolvedValue({
      data: null,
      error: new AppError('No se pudo cargar el perfil.', 'profile_get_error'),
    });

    const auth = await renderAuth();

    await act(async () => {
      await auth().signIn('prueba@codeplay.test', 'clave');
    });

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(auth().session).not.toBeNull();
    expect(auth().error?.message).toBe('No se pudo cargar el perfil.');
  });

  describe('registro', () => {
    it('pide confirmar el correo cuando no llega sesión', async () => {
      mocks.signUp.mockResolvedValue({ data: { session: null, user: null }, error: null });

      const auth = await renderAuth();
      let outcome: string | null = null;

      await act(async () => {
        outcome = await auth().signUp('nuevo@codeplay.test', 'clave', 'Nuevo', 'child');
      });

      expect(outcome).toBe('confirmation-required');
      expect(auth().session).toBeNull();
      expect(mocks.getProfile).not.toHaveBeenCalled();
    });

    it('entra cuando el registro trae sesión y perfil', async () => {
      mocks.signUp.mockResolvedValue({ data: { session: SESSION, user: null }, error: null });
      mocks.getProfile.mockResolvedValue({ data: buildUser({ role: 'tutor' }), error: null });

      const auth = await renderAuth();
      let outcome: string | null = null;

      await act(async () => {
        outcome = await auth().signUp('nuevo@codeplay.test', 'clave', 'Nuevo', 'tutor');
      });

      expect(outcome).toBe('signed-in');
      expect(auth().user?.role).toBe('tutor');
    });
  });
});
