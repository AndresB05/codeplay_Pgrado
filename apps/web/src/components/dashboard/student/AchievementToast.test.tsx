import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementToast } from './AchievementToast';
import type {
  AchievementUnlock,
  MissionCompletionUnlock,
} from '../../../types/progress.types';

const logro = (key: string, title: string): AchievementUnlock => ({
  key,
  title,
  description: `Descripción de ${title}`,
  iconName: 'trophy',
  awardedXp: 100,
});

const mision = (key: string, title: string): MissionCompletionUnlock => ({
  key,
  title,
  description: `Descripción de ${title}`,
  awardedXp: 300,
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
    render(<AchievementToast unlocked={[]} completedMissions={[]} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('enseña el logro con su título, su descripción y lo que dio', () => {
    render(<AchievementToast unlocked={[logro('no_dizzy', 'Sin mareos')]} completedMissions={[]} />);

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
        completedMissions={[]}
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
    render(<AchievementToast unlocked={[logro('streak_3', 'Vuelvo mañana')]} completedMissions={[]} />);

    act(() => {
      vi.advanceTimersByTime(UN_AVISO);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  /*
   * Una misión la puso su profesor y un logro sale de lo que acaba de hacer:
   * llamarlas igual confundiría las dos cosas. Comparten cola porque la misma
   * partida puede conceder las dos, y dos colas se pintarían una encima de otra.
   */
  it('distingue una misión cumplida de un logro, y las encola juntas', () => {
    render(
      <AchievementToast
        unlocked={[logro('perfect_w1_l1', 'Perfecto: Siempre adelante')]}
        completedMissions={[mision('clear_world_1', 'Recorre el Sendero')]}
      />
    );

    expect(screen.getByText('¡Logro desbloqueado!')).toBeInTheDocument();
    expect(screen.getByText('Perfecto: Siempre adelante')).toBeInTheDocument();
    expect(screen.getByText('y 1 más')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(UN_AVISO);
    });

    expect(screen.getByText('¡Misión cumplida!')).toBeInTheDocument();
    expect(screen.getByText('Recorre el Sendero')).toBeInTheDocument();
    expect(screen.getByText('+300 XP')).toBeInTheDocument();
    expect(screen.queryByText('¡Logro desbloqueado!')).not.toBeInTheDocument();
  });

  it('una misión cumplida sin ningún logro también avisa', () => {
    render(
      <AchievementToast unlocked={[]} completedMissions={[mision('flawless_3', 'Ni un paso de más')]} />
    );

    expect(screen.getByText('¡Misión cumplida!')).toBeInTheDocument();
    expect(screen.getByText('Ni un paso de más')).toBeInTheDocument();
  });

  /* Se anuncia sin interrumpir: el niño está mirando su resultado. */
  it('no roba el foco', () => {
    render(<AchievementToast unlocked={[logro('no_dizzy', 'Sin mareos')]} completedMissions={[]} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(document.activeElement).toBe(document.body);
  });
});
