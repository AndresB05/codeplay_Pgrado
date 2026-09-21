import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../context/AuthContext';
import { AppError } from '../../../errors/AppError';
import { buildAuthValue } from '../../../test/buildAuthValue';
import { buildUser } from '../../../test/renderClassrooms';
import type { UserRole } from '../../../types/user.types';
import { DeleteAccountPanel } from './DeleteAccountPanel';

const renderPanel = (
  deleteAccount: () => Promise<boolean>,
  role: UserRole = 'child',
  error: AppError | null = null
) =>
  render(
    <AuthContext.Provider value={{ ...buildAuthValue(buildUser({ role })), deleteAccount, error }}>
      <MemoryRouter initialEntries={['/ajustes']}>
        <Routes>
          <Route path="/ajustes" element={<DeleteAccountPanel />} />
          <Route path="/" element={<p>Portada</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('DeleteAccountPanel', () => {
  it('no borra nada sin confirmar, y cancelar lo deja como estaba', async () => {
    const deleteAccount = vi.fn().mockResolvedValue(true);
    renderPanel(deleteAccount);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('al confirmar borra la cuenta y lleva a la portada', async () => {
    const deleteAccount = vi.fn().mockResolvedValue(true);
    renderPanel(deleteAccount);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminarla' }));

    expect(deleteAccount).toHaveBeenCalledOnce();
    expect(await screen.findByText('Portada')).toBeInTheDocument();
  });

  it('si falla se queda en Ajustes y dice por qué', async () => {
    const deleteAccount = vi.fn().mockResolvedValue(false);
    renderPanel(deleteAccount, 'child', new AppError('No se pudo eliminar la cuenta.', 'x'));

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminarla' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar la cuenta.');
    expect(screen.queryByText('Portada')).not.toBeInTheDocument();
  });

  it('al tutor le avisa de que se van también sus salones', () => {
    renderPanel(vi.fn(), 'tutor');

    expect(screen.getByText(/tus salones/)).toBeInTheDocument();
  });
});
