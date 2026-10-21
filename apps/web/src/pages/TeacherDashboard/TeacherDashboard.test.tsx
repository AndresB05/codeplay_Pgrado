import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../constants/routes';
import { AuthContext } from '../../context/AuthContext';
import { ClassroomsContext } from '../../context/ClassroomsContext';
import { buildAuthValue } from '../../test/buildAuthValue';
import { buildClassroomsValue } from '../../test/buildClassroomsValue';
import { buildUser } from '../../test/renderClassrooms';
import type { ClassGroup, JoinRequest } from '../../types/classroom.types';
import { TeacherDashboard } from './TeacherDashboard';

const pending = (id: string) => ({ id }) as unknown as JoinRequest;

const GROUP: ClassGroup = {
  id: 'g1',
  publicId: 'CP-G1',
  name: 'Salón A',
  gradeLabel: 'Cuarto',
  teacherName: 'Prueba',
  capacity: 20,
  memberCount: 0,
  students: [],
  pendingRequests: [pending('r1'), pending('r2'), pending('r3')],
};

const stubWidth = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

const renderDashboard = (path: string = ROUTES.TEACHER_GROUPS) =>
  render(
    <AuthContext.Provider value={buildAuthValue(buildUser({ role: 'tutor' }))}>
      <ClassroomsContext.Provider value={buildClassroomsValue({ groups: [GROUP] })}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.TEACHER_GROUPS} element={<TeacherDashboard />} />
            <Route path={ROUTES.TEACHER_SETTINGS} element={<TeacherDashboard />} />
          </Routes>
        </MemoryRouter>
      </ClassroomsContext.Provider>
    </AuthContext.Provider>
  );

describe('TeacherDashboard, la navegación según la anchura', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('en el móvil no hay barra lateral y la inferior lleva los tres módulos y las solicitudes', () => {
    stubWidth(false);
    renderDashboard();

    expect(screen.queryByRole('button', { name: /barra lateral/ })).not.toBeInTheDocument();

    const bottomNav = screen.getByRole('navigation', { name: 'Secciones' });
    const groups = screen.getByRole('button', {
      name: 'Salón de clases, 3 solicitudes en espera',
    });
    expect(bottomNav).toContainElement(groups);
    expect(groups).toHaveAttribute('aria-current', 'page');
    expect(groups).toHaveTextContent('Salones');
    expect(screen.getByRole('button', { name: 'Panel de información' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('en el móvil la barra inferior lleva a otro módulo y marca el nuevo', async () => {
    stubWidth(false);
    renderDashboard();

    // La barra superior también lleva a Ajustes: se pulsa la de abajo.
    const bottomNav = () => within(screen.getByRole('navigation', { name: 'Secciones' }));
    await userEvent.click(bottomNav().getByRole('button', { name: 'Ajustes de cuenta' }));

    expect(bottomNav().getByRole('button', { name: 'Ajustes de cuenta' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('en el escritorio sigue la barra lateral plegable y no hay barra inferior', () => {
    renderDashboard();

    expect(screen.getByRole('button', { name: 'Ocultar la barra lateral' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).not.toBeInTheDocument();
  });
});
