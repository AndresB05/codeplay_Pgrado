import type { StreakState } from '../types/progress.types';

/*
 * LA RACHA QUE SE ENSEÑA NO ES LA GUARDADA, y ésa es toda la razón de que este
 * archivo exista.
 *
 * `profiles.current_streak` sólo se recalcula al jugar, así que un niño que
 * lleve una semana sin entrar sigue teniendo escrito el 3 que dejó. Enseñarlo
 * tal cual diría que su racha sigue viva, y es justo lo contrario de lo que la
 * racha premia. La alternativa —una tarea que barra los perfiles cada noche—
 * exige un programador de tareas que este proyecto no tiene, y para una cifra
 * que sólo se mira estando dentro.
 *
 * EL DÍA ES EL DE COLOMBIA, la misma zona con la que el servidor cuenta. Que las
 * dos cuentas partan del mismo día es lo que impide que la pantalla diga cero
 * mientras el servidor cree que la racha sigue.
 */
const BOGOTA = 'America/Bogota';

/** El día natural en hora de Colombia, como `aaaa-mm-dd`. */
export const bogotaDay = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

const dayBefore = (day: string): string => {
  const [year, month, date] = day.split('-').map(Number);

  if (!year || !month || !date) {
    return '';
  }

  const previous = new Date(Date.UTC(year, month - 1, date - 1));

  return previous.toISOString().slice(0, 10);
};

/**
 * La racha vigente: lo guardado si el último día es hoy o ayer, y cero en
 * cualquier otro caso.
 *
 * Ayer cuenta porque la racha no se rompe hasta que el día termina: a un niño
 * que jugó ayer y todavía no ha entrado hoy no se le puede decir que ha perdido
 * algo que aún puede conservar.
 */
export const liveStreak = (streak: StreakState | null, now: Date = new Date()): number => {
  if (!streak || streak.current <= 0 || !streak.lastDay) {
    return 0;
  }

  const today = bogotaDay(now);

  return streak.lastDay === today || streak.lastDay === dayBefore(today) ? streak.current : 0;
};

/** «1 día» y «3 días». Con cero también en plural, que es como se dice. */
export const streakLabel = (days: number): string => (days === 1 ? '1 día' : `${days} días`);
