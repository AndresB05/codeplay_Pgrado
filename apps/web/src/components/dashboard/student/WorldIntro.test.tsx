import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorldIntro } from './WorldIntro';

const BUBBLES = ['Primera', 'Segunda', 'Tercera'];

const renderIntro = () => {
  const onClose = vi.fn();
  render(<WorldIntro image="leo.webp" bubbles={BUBBLES} onClose={onClose} />);

  return onClose;
};

describe('WorldIntro', () => {
  it('avanza con «Siguiente» y cierra con «¡Entendido!»', () => {
    const onClose = renderIntro();

    expect(screen.getByRole('dialog')).toHaveTextContent('Primera');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Tercera');
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '¡Entendido!' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el foco empieza en el botón', () => {
    renderIntro();

    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
  });

  it('se cierra con Escape', () => {
    const onClose = renderIntro();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra tocando el velo y no tocando la burbuja', () => {
    const onClose = renderIntro();

    fireEvent.click(screen.getByText('Primera'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('con movimiento', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('espera a que Leo salga antes de cerrar', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: false }));
      const onClose = renderIntro();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toHaveClass('leo-veil-out');

      fireEvent.animationEnd(screen.getByRole('dialog'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('con movimiento reducido cierra al instante', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      const onClose = renderIntro();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
