import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementToast } from './AchievementToast';
import type { AchievementUnlock } from '../../../types/progress.types';

const logro = (key: string, title: string): AchievementUnlock => ({
  key,
  title,
  description: `Descripción de ${title}`,
  iconName: 'trophy',
  awardedXp: 100,
});

/* Lo que tarda un aviso en irse del todo: visible más lo que dura la salida. */
const UN_AVISO = 4600;

describe('AchievementToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin logros no pinta nada, que es el caso de casi todas las partidas', () => {
    render(<AchievementToast unlocked={[]} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('enseña el logro con su título, su descripción y lo que dio', () => {
    render(<AchievementToast unlocked={[logro('no_dizzy', 'Sin mareos')]} />);

    expect(screen.getByText('Sin mareos')).toBeInTheDocument();
    expect(screen.getByText('Descripción de Sin mareos')).toBeInTheDocument();
    expect(screen.getByText('+100 XP')).toBeInTheDocument();
  });

  /*
   * Terminar el noveno nivel al 100 concede el del nivel, el del mundo y el de
   * todo en la MISMA partida. Tres tarjetas a la vez no se leen.
   */
  it('con tres logros los enseña de uno en uno y dice cuántos quedan', () => {
    render(
      <AchievementToast
        unlocked={[
          logro('perfect_w3_l3', 'Perfecto: Muchos caminos'),
          logro('perfect_world_3', 'Dueño de la Costa'),
          logro('perfect_all', 'Maestro Explorador'),
        ]}
      />
    );

    expect(screen.getByText('Perfecto: Muchos caminos')).toBeInTheDocument();
    expect(screen.queryByText('Dueño de la Costa')).not.toBeInTheDocument();
    expect(screen.getByText('y 2 más')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(UN_AVISO);
    });

    expect(screen.getByText('Dueño de la Costa')).toBeInTheDocument();
    expect(screen.queryByText('Perfecto: Muchos caminos')).not.toBeInTheDocument();
    expect(screen.getByText('y 1 más')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(UN_AVISO);
    });

    expect(screen.getByText('Maestro Explorador')).toBeInTheDocument();
    expect(screen.queryByText(/más$/)).not.toBeInTheDocument();
  });

  it('el último aviso también se va solo', () => {
    render(<AchievementToast unlocked={[logro('streak_3', 'Vuelvo mañana')]} />);

    act(() => {
      vi.advanceTimersByTime(UN_AVISO);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  /* Se anuncia sin interrumpir: el niño está mirando su resultado. */
  it('no roba el foco', () => {
    render(<AchievementToast unlocked={[logro('no_dizzy', 'Sin mareos')]} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(document.activeElement).toBe(document.body);
  });
});
