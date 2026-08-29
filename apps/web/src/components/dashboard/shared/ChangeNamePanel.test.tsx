import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../context/AuthProvider';
import { useAuth } from '../../../hooks/useAuth';
import { buildUser } from '../../../test/renderClassrooms';
import { ChangeNamePanel } from './ChangeNamePanel';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../../../services/auth.service', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'tutora@codeplay.test' } },
      error: null,
    }),
    signOut: vi.fn(),
  },
}));

vi.mock('../../../services/profile.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/profile.service')>();

  return {
    ...actual,
    profileService: {
      ...actual.profileService,
      getProfile: mocks.getProfile,
      updateProfile: mocks.updateProfile,
    },
  };
});

/*
 * El nombre que pinta esta sonda sale del MISMO sitio que los siete consumidores
 * vivos: el `user` de `AuthProvider`. Es lo que hace que el test distinga este
 * diseño del que escribe por `useProfile()`, que cambiaría la base y dejaría la
 * pantalla con el nombre viejo.
 */
const NameProbe = () => {
  const { user } = useAuth();

  return <p>Se muestra: {user?.fullName}</p>;
};

const renderPanel = async (): Promise<void> => {
  render(
    <AuthProvider>
      <NameProbe />
      <ChangeNamePanel />
    </AuthProvider>
  );

  await screen.findByText('Se muestra: Nina Prueba');
};

describe('ChangeNamePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProfile.mockResolvedValue({ data: buildUser(), error: null });
  });

  it('cambia el nombre que se pinta, no sólo el que devuelve el servicio', async () => {
    mocks.updateProfile.mockResolvedValue({
      data: buildUser({ fullName: 'Nina Corregida' }),
      error: null,
    });

    await renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cambiar nombre' }));
    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Nina Corregida');
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }));

    await waitFor(() => {
      expect(screen.getByText('Se muestra: Nina Corregida')).toBeInTheDocument();
    });
  });

  it('no manda al servidor un nombre que pasa del máximo', async () => {
    await renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cambiar nombre' }));
    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'a'.repeat(61));
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El nombre no puede pasar de 60 caracteres'
    );
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });
});
