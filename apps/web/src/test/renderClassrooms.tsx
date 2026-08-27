import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';
import { ClassroomsProvider } from '../context/ClassroomsProvider';
import { useClassrooms } from '../hooks/useClassrooms';
import { createFakeClassrooms } from './fakeClassroomsService';
import type { FakeClassrooms } from './fakeClassroomsService';
import type { ClassroomsContextValue } from '../context/ClassroomsContext';
import type { User } from '../types/user.types';

/**
 * Monta el store de salones con un contexto de auth falso y un servidor de
 * salones en memoria.
 *
 * Se usa el `AuthContext` real y no `vi.mock`: el contexto sólo importa tipos.
 * El servicio entra por la prop `service` del provider, que existe justamente
 * para esto, de modo que ningún test necesita saber contra qué escribe el
 * store. Este archivo sigue siendo el único que conoce esas dependencias: si
 * cambian, se toca aquí y no en cada test.
 */
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

export const buildUser = (overrides: Partial<User> = {}): User => ({
  avatarKey: 'colibri',
  countryCode: 'CO',
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'nina@codeplay.test',
  fullName: 'Nina Prueba',
  id: 'user-test',
  maxStreak: 0,
  role: 'child',
  streakDays: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
  username: 'nina',
  xp: 0,
  ...overrides,
});

interface RenderClassroomsOptions {
  user?: User | null;
  /** Se ejecuta antes del primer render, para sembrar el servidor falso. */
  seed?: (server: FakeClassrooms) => void;
  /**
   * Servidor ya existente. Montar una segunda sesión sobre él es la forma de
   * probar los flujos de dos partes: lo que el niño escribe tiene que llegarle
   * al tutor, que en la base es otra sesión y otra consulta.
   */
  server?: FakeClassrooms;
  /**
   * Vista real a montar dentro del store. Sin ella se monta sólo la sonda, que
   * sirve para mirar el estado pero no puede decir si algo llegó a la pantalla.
   */
  ui?: ReactNode;
}

interface RenderClassroomsResult {
  /** Lo que hay pintado, para los asertos que miran la pantalla y no el store. */
  screen: typeof screen;
  /** Valor del contexto en el último render. Se llama en cada aserto. */
  store: () => ClassroomsContextValue;
  server: FakeClassrooms;
}

/**
 * Se renderiza bajo `StrictMode` a propósito: React invoca dos veces los
 * actualizadores de estado y los efectos, y ahí es donde aparecerían las
 * escrituras duplicadas que el provider evita.
 *
 * Devuelve ya cargado: sin esperar a la primera consulta, todo aserto vería el
 * estado vacío del primer render.
 */
export const renderClassrooms = async (
  options: RenderClassroomsOptions = {}
): Promise<RenderClassroomsResult> => {
  const user = options.user === undefined ? buildUser() : options.user;
  const server = options.server ?? createFakeClassrooms();

  if (!options.server) {
    options.seed?.(server);
  }

  let latest: ClassroomsContextValue | null = null;

  const Probe = () => {
    latest = useClassrooms();

    return null;
  };

  render(
    <StrictMode>
      <AuthContext.Provider value={buildAuthValue(user)}>
        <ClassroomsProvider service={server.service}>
          <Probe />
          {options.ui}
        </ClassroomsProvider>
      </AuthContext.Provider>
    </StrictMode>
  );

  const store = () => {
    if (!latest) {
      throw new Error('El store todavía no se ha renderizado.');
    }

    return latest;
  };

  await waitFor(() => {
    if (store().loading) {
      throw new Error('El store sigue cargando.');
    }
  });

  return { store, server, screen };
};
