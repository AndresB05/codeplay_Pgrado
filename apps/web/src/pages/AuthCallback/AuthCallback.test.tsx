import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../constants/routes';
import { AuthContext, type UpdateRoleResult } from '../../context/AuthContext';
import { clearPendingSignupRole, savePendingSignupRole } from '../../context/oauthRole.helpers';
import { buildAuthValue, FAKE_SESSION } from '../../test/buildAuthValue';
import { buildUser } from '../../test/renderClassrooms';
import type { User, UserRole } from '../../types/user.types';
import { AuthCallback } from './AuthCallback';

const renderCallback = (user: User, updateRole: (role: UserRole) => Promise<UpdateRoleResult>) =>
  render(
    <AuthContext.Provider value={{ ...buildAuthValue(user, FAKE_SESSION), updateRole }}>
      <MemoryRouter initialEntries={[ROUTES.AUTH_CALLBACK]}>
        <Routes>
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
          <Route path={ROUTES.WORLDS} element={<p>Panel del niño</p>} />
          <Route path={ROUTES.TEACHER_GROUPS} element={<p>Panel del tutor</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('AuthCallback', () => {
  afterEach(() => {
    clearPendingSignupRole();
  });

  /*
   * Google desde «Entrar» sin cuenta previa: el disparador la creó `child` sin
   * que nadie lo eligiera, y antes se entraba directo al panel de niño.
   */
  it('pregunta el tipo de cuenta si nadie lo eligió, y aplica el elegido', async () => {
    const tutor = buildUser({ role: 'tutor', isRoleDeclared: true });
    const updateRole = vi.fn().mockResolvedValue({ status: 'updated', user: tutor });

    renderCallback(buildUser({ role: 'child', isRoleDeclared: false }), updateRole);

    await userEvent.click(await screen.findByRole('button', { name: 'Soy tutor' }));

    expect(updateRole).toHaveBeenCalledWith('tutor');
    expect(await screen.findByText('Panel del tutor')).toBeInTheDocument();
  });

  it('a quien ya eligió no le pregunta nada', async () => {
    const updateRole = vi.fn();

    renderCallback(buildUser({ role: 'child', isRoleDeclared: true }), updateRole);

    expect(await screen.findByText('Panel del niño')).toBeInTheDocument();
    expect(updateRole).not.toHaveBeenCalled();
  });

  /* Quien viene del registro ya eligió allí: preguntarle otra vez sobraría. */
  it('con la intención del registro aplica ésa sin preguntar', async () => {
    savePendingSignupRole('tutor');
    const tutor = buildUser({ role: 'tutor', isRoleDeclared: true });
    const updateRole = vi.fn().mockResolvedValue({ status: 'updated', user: tutor });

    renderCallback(buildUser({ role: 'child', isRoleDeclared: false }), updateRole);

    expect(await screen.findByText('Panel del tutor')).toBeInTheDocument();
    expect(updateRole).toHaveBeenCalledWith('tutor');
    expect(screen.queryByRole('button', { name: 'Soy tutor' })).not.toBeInTheDocument();
  });
});
