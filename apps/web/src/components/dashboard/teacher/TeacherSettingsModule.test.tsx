import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../context/AuthContext';
import { buildAuthValue } from '../../../test/buildAuthValue';
import { buildUser } from '../../../test/renderClassrooms';
import type { ClassGroup } from '../../../types/classroom.types';
import { TeacherSettingsModule } from './TeacherSettingsModule';

const TUTOR = buildUser({
  role: 'tutor',
  fullName: 'Camila Prueba',
  email: 'camila@codeplay.test',
});

const buildGroup = (id: string, name: string, members: number): ClassGroup => ({
  id,
  publicId: `CP-${id.toUpperCase()}`,
  name,
  gradeLabel: 'Cuarto',
  teacherName: 'Camila Prueba',
  capacity: 20,
  memberCount: members,
  students: Array.from({ length: members }, (_, index) => ({
    id: `${id}-kid-${index}`,
    name: `Alumno ${index}`,
    initials: 'AL',
    avatarTone: 'bg-grape',
    currentWorld: null,
    hoursSinceLastActivity: null,
    streakDays: null,
    xp: 0,
    attemptedLevels: 0,
    completedLevels: 0,
    completedWorlds: 0,
    totalAttempts: 0,
    averageBestScore: null,
  })),
  pendingRequests: [],
});

const GROUPS = [buildGroup('g1', 'Salón A', 5), buildGroup('g2', 'Salón B', 15)];

const CurrentPath = () => <p data-testid="ruta">{useLocation().pathname}</p>;

const renderSettings = (signOut = vi.fn(async () => true)) =>
  render(
    <AuthContext.Provider value={{ ...buildAuthValue(TUTOR), signOut }}>
      <MemoryRouter initialEntries={['/teacher/settings']}>
        <TeacherSettingsModule user={TUTOR} groups={GROUPS} />
        <CurrentPath />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('TeacherSettingsModule', () => {
  it('la tarjeta de perfil dice quién es y cuánto tiene a cargo', () => {
    renderSettings();

    const profile = within(screen.getByRole('region', { name: 'Tu perfil' }));

    expect(profile.getByRole('heading', { name: 'Camila Prueba' })).toBeInTheDocument();
    expect(profile.getByText('Tutor')).toBeInTheDocument();
    expect(profile.getByText('camila@codeplay.test')).toBeInTheDocument();
    expect(profile.getByText('salones').nextSibling).toHaveTextContent('2');
    expect(profile.getByText('niños a cargo').nextSibling).toHaveTextContent('20');
  });

  it('la contraseña se cambia dentro de su fila y Cancelar la vuelve a cerrar', async () => {
    renderSettings();

    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    const row = screen.getByRole('heading', { name: 'Contraseña' }).closest('div.border-t');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByLabelText('Contraseña nueva')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar contraseña' })).not.toBeInTheDocument();

    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument();
  });

  it('el correo se enseña sin nada que lo edite', () => {
    renderSettings();

    const row = screen.getByRole('heading', { name: 'Correo' }).parentElement as HTMLElement;

    expect(within(row).getByText('camila@codeplay.test')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('cada salón dice su ocupación y «Abrir» lleva a él', async () => {
    renderSettings();

    expect(screen.getByText('15 de 20 niños')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir Salón B' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/teacher/groups/g2');
  });

  it('«Cerrar sesión» está en Ajustes y cierra la sesión de verdad', async () => {
    const signOut = vi.fn(async () => true);
    renderSettings(signOut);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('ruta').textContent).toBe('/');
  });
});
