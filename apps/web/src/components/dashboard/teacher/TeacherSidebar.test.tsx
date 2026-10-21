import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../constants/routes';
import { AuthContext } from '../../../context/AuthContext';
import { buildAuthValue } from '../../../test/buildAuthValue';
import { buildUser } from '../../../test/renderClassrooms';
import type { ClassGroup } from '../../../types/classroom.types';
import { TeacherSidebar } from './TeacherSidebar';

const FOLDED_KEY = 'dashboard:teacherGroupsFolded';

const buildGroup = (id: string, name: string): ClassGroup => ({
  id,
  publicId: `CP-${id.toUpperCase()}`,
  name,
  gradeLabel: 'Cuarto',
  teacherName: 'Prueba',
  capacity: 20,
  memberCount: 0,
  students: [],
  pendingRequests: [],
});

const GROUPS = [
  buildGroup('g1', 'Salón A'),
  buildGroup('g2', 'Salón B'),
  buildGroup('g3', 'Salón C'),
];

const renderSidebar = (activeGroupId: string | null = null) =>
  render(
    <AuthContext.Provider value={buildAuthValue(buildUser({ role: 'tutor' }))}>
      <MemoryRouter initialEntries={['/inicio']}>
        <Routes>
          <Route
            path="/inicio"
            element={
              <TeacherSidebar
                groups={GROUPS}
                activeGroupId={activeGroupId}
                activeSection={ROUTES.TEACHER_GROUPS}
              />
            }
          />
          <Route path={ROUTES.TEACHER_GROUPS} element={<p>Mis salones</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('TeacherSidebar, la lista de salones', () => {
  it('sale desplegada y al plegarla oculta los salones y lo dice en aria-expanded', async () => {
    renderSidebar();

    const toggle = screen.getByRole('button', { name: 'Ocultar tus salones' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Salón A')).toBeVisible();

    await userEvent.click(toggle);

    const reopen = screen.getByRole('button', { name: 'Mostrar tus salones' });
    expect(reopen).toHaveAttribute('aria-expanded', 'false');
    expect(reopen).toHaveAttribute('aria-controls', 'teacher-groups-list');
    expect(screen.queryByText('Salón A')).not.toBeInTheDocument();
    expect(screen.queryByText('Salón B')).not.toBeInTheDocument();
  });

  it('plegada y con un salón abierto, se ve sólo ése y la lista sigue plegada', () => {
    window.localStorage.setItem(FOLDED_KEY, '1');
    renderSidebar('g2');

    expect(screen.getByText('Salón B')).toBeVisible();
    expect(screen.queryByText('Salón A')).not.toBeInTheDocument();
    expect(screen.queryByText('Salón C')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar tus salones' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(window.localStorage.getItem(FOLDED_KEY)).toBe('1');
  });

  it('desde ahí, el chevron despliega la lista entera y lo guarda', async () => {
    window.localStorage.setItem(FOLDED_KEY, '1');
    renderSidebar('g2');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar tus salones' }));

    expect(screen.getByRole('button', { name: 'Ocultar tus salones' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Salón A')).toBeVisible();
    expect(screen.getByText('Salón C')).toBeVisible();
    expect(window.localStorage.getItem(FOLDED_KEY)).toBe('0');
  });

  it('recuerda que se plegó en un render nuevo', async () => {
    const { unmount } = renderSidebar();

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar tus salones' }));
    unmount();
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Mostrar tus salones' })).toBeInTheDocument();
    expect(screen.queryByText('Salón A')).not.toBeInTheDocument();
  });

  it('plegar la lista no impide entrar en «Salón de clases»', async () => {
    renderSidebar();

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar tus salones' }));
    await userEvent.click(screen.getByRole('button', { name: /Salón de clases/ }));

    expect(screen.getByText('Mis salones')).toBeInTheDocument();
  });
});
