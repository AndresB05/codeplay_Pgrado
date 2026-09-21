import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { ClassroomPodium } from './ClassroomPodium';
import { podiumRanking } from './podiumRanking';

const alumno = (over: Partial<ClassroomStudent> = {}): ClassroomStudent => ({
  id: 's',
  name: 'Alumno',
  initials: 'AL',
  avatarTone: 'bg-grape-soft text-grape-dark',
  currentWorld: null,
  hoursSinceLastActivity: null,
  streakDays: 0,
  xp: 0,
  attemptedLevels: 0,
  completedLevels: 0,
  completedWorlds: 0,
  totalAttempts: 0,
  averageBestScore: 0,
  ...over,
});

describe('podiumRanking', () => {
  it('ordena por XP, deja fuera a quien no tiene y se queda con tres', () => {
    const ranking = podiumRanking([
      alumno({ id: 'a', name: 'Ana', xp: 50 }),
      alumno({ id: 'b', name: 'Beto', xp: 300 }),
      alumno({ id: 'c', name: 'Caro', xp: 0 }),
      alumno({ id: 'd', name: 'Dani', xp: 120 }),
      alumno({ id: 'e', name: 'Eva', xp: 10 }),
    ]);

    expect(ranking.map((student) => student.id)).toEqual(['b', 'd', 'a']);
  });

  it('desempata por niveles superados antes que por nombre', () => {
    const ranking = podiumRanking([
      alumno({ id: 'a', name: 'Ana', xp: 100, completedLevels: 1 }),
      alumno({ id: 'z', name: 'Zoe', xp: 100, completedLevels: 3 }),
    ]);

    expect(ranking.map((student) => student.id)).toEqual(['z', 'a']);
  });
});

describe('ClassroomPodium', () => {
  it('no se pinta si nadie ha ganado XP', () => {
    const { container } = render(<ClassroomPodium students={[alumno()]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('pinta a los del podio con su XP', () => {
    render(
      <ClassroomPodium
        students={[
          alumno({ id: 'a', name: 'Ana', xp: 50 }),
          alumno({ id: 'b', name: 'Beto', xp: 300 }),
        ]}
      />
    );

    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText('300 XP')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });
});
