import { bogotaDay } from './streak';

/*
 * La fecha límite de una misión es un DÍA de Colombia en `aaaa-mm-dd`, y vale
 * hasta que ese día acaba: la misma regla que `mission_assignment_is_active` en
 * la base (0047). Con ese formato comparar cadenas es comparar fechas.
 *
 * El servidor ya no devuelve las vencidas; esto cubre la pantalla que sigue
 * abierta cuando cambia el día.
 */
export const isAssignmentActive = (dueDate: string | null, today: string = bogotaDay()): boolean =>
  dueDate === null || dueDate >= today;

/*
 * «25 de septiembre». Se formatea en UTC a propósito: el día ya es de Colombia,
 * y pasarlo por la zona del navegador lo movería al anterior en cualquier zona
 * al oeste de Greenwich.
 */
export const formatDueDate = (dueDate: string): string =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${dueDate}T00:00:00Z`)
  );
