import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSeedGroups } from '../components/dashboard/teacher/classroomsData';
import { buildUser, renderClassrooms } from '../test/renderClassrooms';
import type { ClassroomsContextValue } from './ClassroomsContext';
import type { ClassGroup, StudentMembership } from '../types/classroom.types';

const SALON_1A = 'salon-1a';
const SALON_2B = 'salon-2b';
const CURRENT_STUDENT_ID = 'guest-child';

const findGroup = (store: ClassroomsContextValue, groupId: string): ClassGroup => {
  const group = store.groups.find((item) => item.id === groupId);

  if (!group) {
    throw new Error(`El salón ${groupId} no está en el store.`);
  }

  return group;
};

/** Id de la solicitud que el niño de la sesión tiene abierta en ese salón. */
const ownRequestId = (store: ClassroomsContextValue, groupId: string): string => {
  const request = findGroup(store, groupId).pendingRequests.find(
    (item) => item.studentId === CURRENT_STUDENT_ID
  );

  if (!request) {
    throw new Error(`El alumno no tiene solicitud en ${groupId}.`);
  }

  return request.id;
};

/** Deja al niño de la sesión inscrito en el salón, pasando por el tutor. */
const joinAndAccept = (store: () => ClassroomsContextValue, groupId: string): void => {
  act(() => store().requestJoin(groupId));
  act(() => store().acceptRequest(groupId, ownRequestId(store(), groupId)));
};

describe('Estado inicial', () => {
  it('arranca sin salón y con la semilla de ejemplo', () => {
    const { store } = renderClassrooms();

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(store().currentGroup).toBeNull();
    expect(store().groups.map((group) => group.id)).toEqual(
      buildSeedGroups().map((group) => group.id)
    );
  });
});

describe('requestJoin', () => {
  it('pasa el estado a pending y deja la solicitud en la bandeja del tutor', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_1A));

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });

    const request = findGroup(store(), SALON_1A).pendingRequests.find(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(request).toBeDefined();
    expect(store().currentGroup?.id).toBe(SALON_1A);
  });

  it('usa el nombre del usuario de la sesión cuando lo hay', () => {
    const { store } = renderClassrooms(buildUser({ fullName: 'Nina Prueba' }));

    act(() => store().requestJoin(SALON_1A));

    const request = findGroup(store(), SALON_1A).pendingRequests.find(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(request?.studentName).toBe('Nina Prueba');
    expect(request?.initials).toBe('NP');
  });

  it('cae al nombre por defecto cuando no hay usuario', () => {
    const { store } = renderClassrooms(null);

    act(() => store().requestJoin(SALON_1A));

    const request = findGroup(store(), SALON_1A).pendingRequests.find(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(request?.studentName).toBe('Explorer Leo');
  });
});

describe('cancelJoinRequest', () => {
  it('devuelve el estado a none y retira la solicitud', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_1A));
    act(() => store().cancelJoinRequest());

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(
      findGroup(store(), SALON_1A).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);
  });

  it('no toca las solicitudes de otros alumnos', () => {
    const { store } = renderClassrooms();
    const otras = findGroup(store(), SALON_1A).pendingRequests.length;

    act(() => store().requestJoin(SALON_1A));
    act(() => store().cancelJoinRequest());

    expect(findGroup(store(), SALON_1A).pendingRequests).toHaveLength(otras);
  });
});

describe('Decisiones del tutor sobre la solicitud', () => {
  it('acepta: el alumno pasa a member y entra en la lista del salón', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);

    expect(store().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });
    expect(
      findGroup(store(), SALON_1A).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(true);
    expect(
      findGroup(store(), SALON_1A).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);
  });

  it('rechaza: el alumno vuelve a none y no entra en la lista', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_2B));
    act(() => store().rejectRequest(SALON_2B, ownRequestId(store(), SALON_2B)));

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(
      findGroup(store(), SALON_2B).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(false);
    expect(
      findGroup(store(), SALON_2B).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);
  });

  it('la decisión sobre otro alumno no cambia el estado del niño de la sesión', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_1A));
    act(() => store().acceptRequest(SALON_1A, 'req-1'));

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
  });
});

describe('Salidas del salón', () => {
  it('removeStudent devuelve al alumno a none', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);
    act(() => store().removeStudent(SALON_1A, CURRENT_STUDENT_ID));

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(
      findGroup(store(), SALON_1A).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(false);
  });

  it('leaveGroup devuelve al alumno a none', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);
    act(() => store().leaveGroup());

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(
      findGroup(store(), SALON_1A).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(false);
  });

  it('deleteGroup borra el salón y devuelve al alumno inscrito a none', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);
    act(() => store().deleteGroup(SALON_1A));

    expect(store().groups.some((group) => group.id === SALON_1A)).toBe(false);
    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(store().currentGroup).toBeNull();
  });

  it('deleteGroup también devuelve a none al alumno que sólo estaba en espera', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_2B));
    act(() => store().deleteGroup(SALON_2B));

    expect(store().groups.some((group) => group.id === SALON_2B)).toBe(false);
    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
  });

  it('borrar otro salón no toca la pertenencia del alumno', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);
    act(() => store().deleteGroup(SALON_2B));

    expect(store().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });
  });
});

describe('Acciones del tutor sobre el salón', () => {
  it('createGroup añade el salón y devuelve el creado', () => {
    const { store } = renderClassrooms();
    const antes = store().groups.length;

    const created: ClassGroup[] = [];

    act(() => {
      created.push(
        store().createGroup({
          name: 'Salón 4D',
          gradeLabel: 'Cuarto',
          teacherName: 'Sra. Tutora',
          capacity: 15,
        })
      );
    });

    expect(store().groups).toHaveLength(antes + 1);
    expect(created).toHaveLength(1);
    expect(store().groups.some((group) => group.id === created[0].id)).toBe(true);
    expect(created[0].name).toBe('Salón 4D');
  });

  it('inviteByEmail añade la invitación con el correo normalizado', () => {
    const { store } = renderClassrooms();

    act(() => store().inviteByEmail(SALON_2B, '  Familia.Nieto@Correo.COM  '));

    const invitaciones = findGroup(store(), SALON_2B).invitations;
    const invitation = invitaciones[invitaciones.length - 1];

    expect(invitation?.email).toBe('familia.nieto@correo.com');
    expect(invitation?.status).toBe('pending');
  });
});

describe('Mutaciones estables bajo StrictMode', () => {
  it('crear un salón produce exactamente un salón nuevo', () => {
    const { store } = renderClassrooms();
    const antes = store().groups.length;

    act(() => {
      store().createGroup({
        name: 'Salón 5E',
        gradeLabel: 'Quinto',
        teacherName: 'Sra. Tutora',
        capacity: 12,
      });
    });

    expect(store().groups).toHaveLength(antes + 1);

    const ids = store().groups.map((group) => group.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('solicitar ingreso produce exactamente una solicitud', () => {
    const { store } = renderClassrooms();
    const antes = findGroup(store(), SALON_1A).pendingRequests.length;

    act(() => store().requestJoin(SALON_1A));

    const propias = findGroup(store(), SALON_1A).pendingRequests.filter(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(findGroup(store(), SALON_1A).pendingRequests).toHaveLength(antes + 1);
    expect(propias).toHaveLength(1);
  });
});

describe('requestJoin sin comprobar la pertenencia actual', () => {
  /**
   * Documenta el comportamiento de HOY, no el deseado. El requisito «un alumno
   * pertenece como máximo a un salón» lo sostiene el enrutado de
   * StudentClassroomModule, que sólo monta el buscador con el estado en `none`;
   * el store no lo comprueba. Trasladar la guarda al modelo es la tarea 5 de P3
   * en docs/CONTEXT.md §3. Cuando se implemente, este test debe cambiar.
   */
  it('sobrescribe la pertenencia si se llama estando ya inscrito', () => {
    const { store } = renderClassrooms();

    joinAndAccept(store, SALON_1A);
    act(() => store().requestJoin(SALON_2B));

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_2B,
    });

    // Y queda en los dos salones a la vez: inscrito en 1A, en espera en 2B.
    expect(
      findGroup(store(), SALON_1A).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(true);
  });
});

/**
 * ATENCIÓN: este bloque muere con P3 (salones-persistentes).
 *
 * Son los únicos tests que tocan `localStorage` y que conocen la clave y el
 * número de versión, porque los requisitos de persistencia de
 * openspec/specs/store-salones/spec.md son *sobre* el almacenamiento y no se
 * pueden comprobar de otra forma. Cuando el store pase a Supabase, se
 * sustituyen por sus equivalentes contra la base de datos o se borran. El resto
 * de la suite no menciona `localStorage` en ninguna línea.
 */
describe('Persistencia en localStorage', () => {
  const STORAGE_KEY = 'codeplay:classrooms';

  const readStored = (): { version: number; groups: ClassGroup[]; membership: StudentMembership } => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      throw new Error('No hay estado guardado.');
    }

    return JSON.parse(raw);
  };

  it('guarda versión, salones y pertenencia tras una mutación', () => {
    const { store } = renderClassrooms();

    act(() => store().requestJoin(SALON_1A));

    const stored = readStored();

    expect(stored.version).toBe(1);
    expect(stored.groups.map((group) => group.id)).toContain(SALON_1A);
    expect(stored.membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
  });

  it('restaura el estado guardado al montar', () => {
    // El estado inicial sólo se lee en el primer render: hay que sembrar antes.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        groups: [
          {
            id: 'salon-guardado',
            publicId: 'CP-SAVE',
            name: 'Salón guardado',
            gradeLabel: 'Sexto',
            teacherName: 'Sra. Tutora',
            capacity: 4,
            students: [],
            pendingRequests: [],
            invitations: [],
          },
        ],
        membership: { status: 'member', groupId: 'salon-guardado' },
      })
    );

    const { store } = renderClassrooms();

    expect(store().groups.map((group) => group.id)).toEqual(['salon-guardado']);
    expect(store().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: 'salon-guardado',
    });
    expect(store().currentGroup?.name).toBe('Salón guardado');
  });

  it('resiembra cuando la versión guardada no coincide', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 99,
        groups: [],
        membership: { status: 'member', groupId: 'salon-fantasma' },
      })
    );

    const { store } = renderClassrooms();

    expect(store().groups.map((group) => group.id)).toEqual(
      buildSeedGroups().map((group) => group.id)
    );
    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
  });

  it('resiembra cuando el contenido no se puede interpretar', () => {
    window.localStorage.setItem(STORAGE_KEY, 'esto no es JSON {{{');

    const { store } = renderClassrooms();

    expect(store().groups.map((group) => group.id)).toEqual(
      buildSeedGroups().map((group) => group.id)
    );
  });

  it('resiembra cuando el JSON es válido pero no trae lista de salones', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, groups: 'no soy una lista', membership: null })
    );

    const { store } = renderClassrooms();

    expect(store().groups.map((group) => group.id)).toEqual(
      buildSeedGroups().map((group) => group.id)
    );
  });
});
