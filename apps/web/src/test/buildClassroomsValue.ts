import { vi } from 'vitest';
import type { ClassroomsContextValue } from '../context/ClassroomsContext';

/**
 * Doble del contexto de salones para los tests que montan una pantalla suelta,
 * sin el store de verdad.
 *
 * Vive aparte por el mismo motivo que `buildAuthValue`: es lo que se rompe cada
 * vez que `ClassroomsContextValue` gana un campo. Con dos copias, `tsc` señala
 * una, se arregla, y la otra aparece en la compilación siguiente.
 *
 * `loading` arranca en `false` porque estos tests montan sobre datos que ya
 * llegaron: pasarlos por la carga inicial sólo añadiría una espera a cada
 * aserto.
 */
export const buildClassroomsValue = (
  overrides: Partial<ClassroomsContextValue> = {}
): ClassroomsContextValue => ({
  acceptRequest: async () => undefined,
  cancelJoinRequest: async () => undefined,
  createGroup: async () => null,
  currentGroup: null,
  deleteGroup: async () => undefined,
  error: null,
  groups: [],
  leaveGroup: async () => undefined,
  loading: false,
  membership: { status: 'none', groupId: null },
  onlineStudentIds: new Set(),
  redeemInvitation: async () => false,
  refreshSilently: vi.fn(async () => undefined),
  rejectRequest: async () => undefined,
  removeStudent: async () => undefined,
  requestJoin: async () => undefined,
  ...overrides,
});
