import { fireEvent, render, screen } from '@testing-library/react';
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

  it('el mapa de la esquina sacude todos los mapas sueltos', () => {
    const { container } = render(
      <ClassroomPodium students={[alumno({ id: 'a', name: 'Ana', xp: 50 })]} variant="map" />
    );
    const maps = container.querySelectorAll('.loose-map');

    expect(maps.length).toBeGreaterThan(1);
    expect(container.querySelector('.loose-map-shake')).toBeNull();

    fireEvent.click(container.querySelector('button.loose-map') as HTMLElement);

    maps.forEach((map) => expect(map).toHaveClass('loose-map-shake'));
  });
});
