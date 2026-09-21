import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const Broken = () => {
  throw new Error('fallo de prueba');
};

describe('ErrorBoundary', () => {
  /* React y el propio componente escriben el error en consola; aquí es ruido. */
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sin errores pinta lo de dentro y nada más', () => {
    render(
      <ErrorBoundary>
        <p>Contenido</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un error de render enseña el aviso con salida, no la pantalla en blanco', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Nos perdimos en la selva');
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
  });
});
