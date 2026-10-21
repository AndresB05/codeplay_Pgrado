import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../constants/routes';
import { StudentBottomNav } from './StudentBottomNav';

const CurrentPath = () => <p data-testid="path">{useLocation().pathname}</p>;

describe('StudentBottomNav', () => {
  it('lleva los tres módulos del niño, marca el abierto y navega', async () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.TROPHY_ROOM]}>
        <Routes>
          <Route path="*" element={<StudentBottomNav activeRoute={ROUTES.TROPHY_ROOM} />} />
        </Routes>
        <CurrentPath />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Sala de Trofeos' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('button', { name: 'Mundos' })).not.toHaveAttribute('aria-current');

    await userEvent.click(screen.getByRole('button', { name: 'Salón de clases' }));
    expect(screen.getByTestId('path')).toHaveTextContent(ROUTES.CLASSROOM);
  });
});
