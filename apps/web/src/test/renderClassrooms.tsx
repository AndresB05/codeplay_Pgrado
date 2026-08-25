import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';
import { ClassroomsProvider } from '../context/ClassroomsProvider';
import { useClassrooms } from '../hooks/useClassrooms';
import type { ClassroomsContextValue } from '../context/ClassroomsContext';
import type { User } from '../types/user.types';

/**
 * Monta el store de salones con un contexto de auth falso.
 *
 * Se usa el `AuthContext` real y no `vi.mock`: el contexto sólo importa tipos,
 * así que montarlo directamente deja la suite fuera de `lib/supabase.ts` y de
 * `config/env.ts`, que lanza al importarse sin variables de entorno. Montar el
 * `AuthProvider` de verdad arrastraría el cliente de Supabase a todos los tests.
 *
 * Este archivo es el único que conoce las dependencias del provider: si P3 las
 * cambia, se toca aquí y no en cada test.
 */
const buildAuthValue = (user: User | null): AuthContextValue => ({
  clearError: () => undefined,
  error: null,
  loading: false,
  session: null,
  signIn: async () => false,
  signInWithGoogle: async () => false,
  signOut: async () => false,
  signUp: async () => false,
  user,
});

export const buildUser = (overrides: Partial<User> = {}): User => ({
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'nina@codeplay.test',
  fullName: 'Nina Prueba',
  id: 'user-test',
  role: 'child',
  streakDays: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
  xp: 0,
  ...overrides,
});

interface RenderClassroomsResult {
  /** Valor del contexto en el último render. Se llama en cada aserto. */
  store: () => ClassroomsContextValue;
}

/**
 * Se renderiza bajo `StrictMode` a propósito: React invoca dos veces los
 * actualizadores de estado y ahí es donde aparecen los ids duplicados que el
 * provider evita calculando fuera de ellos.
 */
export const renderClassrooms = (user: User | null = null): RenderClassroomsResult => {
  let latest: ClassroomsContextValue | null = null;

  const Probe = () => {
    latest = useClassrooms();

    return null;
  };

  render(
    <StrictMode>
      <AuthContext.Provider value={buildAuthValue(user)}>
        <ClassroomsProvider>
          <Probe />
        </ClassroomsProvider>
      </AuthContext.Provider>
    </StrictMode>
  );

  return {
    store: () => {
      if (!latest) {
        throw new Error('El store todavía no se ha renderizado.');
      }

      return latest;
    },
  };
};
