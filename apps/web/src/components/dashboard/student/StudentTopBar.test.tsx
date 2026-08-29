import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { buildUser } from '../../../test/renderClassrooms';
import { StudentTopBar } from './StudentTopBar';

/*
 * El `|| 0` frente al `?? 0` es indistinguible en cualquier cuenta que tenga
 * racha, y por eso este fallo vivió meses: con el relleno puesto, una cuenta
 * recién creada afirmaba «42 días» mientras la tabla de su salón enseñaba el cero
 * verdadero. La racha en cero es el único caso que separa las dos versiones.
 */
describe('StudentTopBar', () => {
  it('muestra la racha en cero en vez de un valor de relleno', () => {
    render(
      <MemoryRouter>
        <StudentTopBar user={buildUser({ streakDays: 0 })} />
      </MemoryRouter>
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
