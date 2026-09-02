import { act } from '@testing-library/react';
import { StudentClassroomModule } from '../components/dashboard/student/StudentClassroomModule';
import { describe, expect, it } from 'vitest';
import { buildUser, renderClassrooms } from '../test/renderClassrooms';
import { createFakeClassrooms } from '../test/fakeClassroomsService';
import type { FakeClassrooms } from '../test/fakeClassroomsService';
import type { ClassroomsContextValue } from './ClassroomsContext';
import type { ClassGroup, StudentMembership } from '../types/classroom.types';

const SALON_1A = 'salon-1a';
const SALON_2B = 'salon-2b';
const CURRENT_STUDENT_ID = 'nino-de-la-sesion';
const OTHER_STUDENT_ID = 'otro-nino';
const TUTOR_ID = 'tutor-de-prueba';

const currentChild = buildUser({ id: CURRENT_STUDENT_ID, fullName: 'Nina Prueba' });
const currentTutor = buildUser({ id: TUTOR_ID, fullName: 'Sra. Tutora', role: 'tutor' });

/** Dos salones y un solicitante ajeno: el escenario mínimo de los flujos. */
const seedTwoGroups = (server: FakeClassrooms): void => {
  server.seedGroup({ id: SALON_1A, name: 'Salón 1A' });
  server.seedGroup({ id: SALON_2B, name: 'Salón 2B' });
  server.seedProfile(CURRENT_STUDENT_ID, 'Nina Prueba');
  server.seedProfile(OTHER_STUDENT_ID, 'Joaquín Vega');
  server.seedRequest(SALON_1A, OTHER_STUDENT_ID);
};

/**
 * Niño y tutor son dos sesiones distintas contra el mismo servidor. Montar la
 * otra es lo que comprueba que el estado viaja de una a otra, que es el motivo
 * entero de sacar los salones de `localStorage`.
 */
const mountChild = (server: FakeClassrooms) => renderClassrooms({ user: currentChild, server });
const mountTutor = (server: FakeClassrooms) => renderClassrooms({ user: currentTutor, server });

const findGroup = (store: ClassroomsContextValue, groupId: string): ClassGroup => {
  const group = store.groups.find((item) => item.id === groupId);

  if (!group) {
    throw new Error(`El salón ${groupId} no está en el store.`);
  }

  return group;
};

/** Id de la solicitud que un alumno tiene abierta en ese salón. */
const requestIdOf = (store: ClassroomsContextValue, groupId: string, studentId: string): string => {
  const request = findGroup(store, groupId).pendingRequests.find(
    (item) => item.studentId === studentId
  );

  if (!request) {
    throw new Error(`El alumno ${studentId} no tiene solicitud en ${groupId}.`);
  }

  return request.id;
};

describe('Estado inicial', () => {
  it('arranca sin salón y con los salones que devuelve el servidor', async () => {
    const { store } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(store().currentGroup).toBeNull();
    expect(store().groups.map((group) => group.id)).toEqual([SALON_1A, SALON_2B]);
  });
});

describe('requestJoin', () => {
  it('pasa el estado a pending y deja la solicitud en la bandeja del tutor', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
    expect(store().currentGroup?.id).toBe(SALON_1A);

    const { store: tutorStore } = await mountTutor(server);

    expect(
      findGroup(tutorStore(), SALON_1A).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(true);
  });

  it('la solicitud llega a la bandeja con el nombre del perfil del niño', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    const { store: tutorStore } = await mountTutor(server);
    const request = findGroup(tutorStore(), SALON_1A).pendingRequests.find(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(request?.studentName).toBe('Nina Prueba');
    expect(request?.initials).toBe('NP');
  });

  it('cae al nombre por defecto cuando el perfil no trae nombre', async () => {
    const { store, server } = await renderClassrooms({
      user: currentChild,
      seed: (fake) => {
        fake.seedGroup({ id: SALON_1A, name: 'Salón 1A' });
      },
    });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    const { store: tutorStore } = await mountTutor(server);

    expect(findGroup(tutorStore(), SALON_1A).pendingRequests[0]?.studentName).toBe('Explorador');
  });
});

describe('cancelJoinRequest', () => {
  it('devuelve el estado a none y retira la solicitud', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });
    await act(async () => {
      await store().cancelJoinRequest();
    });

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });

    const { store: tutorStore } = await mountTutor(server);

    expect(
      findGroup(tutorStore(), SALON_1A).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);
  });

  it('no toca las solicitudes de otros alumnos', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });
    await act(async () => {
      await store().cancelJoinRequest();
    });

    const { store: tutorStore } = await mountTutor(server);
    const pendientes = findGroup(tutorStore(), SALON_1A).pendingRequests;

    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].studentId).toBe(OTHER_STUDENT_ID);
  });
});

describe('Decisiones del tutor sobre la solicitud', () => {
  it('acepta: el alumno pasa a member y entra en la lista del salón', async () => {
    const { store: childStore, server } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
    });

    await act(async () => {
      await childStore().requestJoin(SALON_1A);
    });

    const { store: tutorStore } = await mountTutor(server);

    await act(async () => {
      await tutorStore().acceptRequest(
        SALON_1A,
        requestIdOf(tutorStore(), SALON_1A, CURRENT_STUDENT_ID)
      );
    });

    expect(
      findGroup(tutorStore(), SALON_1A).students.some(
        (student) => student.id === CURRENT_STUDENT_ID
      )
    ).toBe(true);
    expect(
      findGroup(tutorStore(), SALON_1A).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });
  });

  it('rechaza: el alumno vuelve a none y no entra en la lista', async () => {
    const { store: childStore, server } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
    });

    await act(async () => {
      await childStore().requestJoin(SALON_2B);
    });

    const { store: tutorStore } = await mountTutor(server);

    await act(async () => {
      await tutorStore().rejectRequest(
        SALON_2B,
        requestIdOf(tutorStore(), SALON_2B, CURRENT_STUDENT_ID)
      );
    });

    expect(
      findGroup(tutorStore(), SALON_2B).students.some(
        (student) => student.id === CURRENT_STUDENT_ID
      )
    ).toBe(false);
    expect(
      findGroup(tutorStore(), SALON_2B).pendingRequests.some(
        (item) => item.studentId === CURRENT_STUDENT_ID
      )
    ).toBe(false);

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'none',
      groupId: null,
    });
  });

  it('la decisión sobre otro alumno no cambia el estado del niño de la sesión', async () => {
    const { store: childStore, server } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
    });

    await act(async () => {
      await childStore().requestJoin(SALON_1A);
    });

    const { store: tutorStore } = await mountTutor(server);

    await act(async () => {
      await tutorStore().acceptRequest(
        SALON_1A,
        requestIdOf(tutorStore(), SALON_1A, OTHER_STUDENT_ID)
      );
    });

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
  });
});

describe('Salidas del salón', () => {
  const seedWithMember = (fake: FakeClassrooms) => {
    seedTwoGroups(fake);
    fake.seedMember(SALON_1A, CURRENT_STUDENT_ID);
  };

  it('removeStudent devuelve al alumno a none', async () => {
    const { store, server } = await renderClassrooms({
      user: currentTutor,
      seed: seedWithMember,
    });

    await act(async () => {
      await store().removeStudent(SALON_1A, CURRENT_STUDENT_ID);
    });

    expect(
      findGroup(store(), SALON_1A).students.some((student) => student.id === CURRENT_STUDENT_ID)
    ).toBe(false);

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'none',
      groupId: null,
    });
  });

  it('leaveGroup devuelve al alumno a none', async () => {
    const { store, server } = await renderClassrooms({
      user: currentChild,
      seed: seedWithMember,
    });

    expect(store().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });

    await act(async () => {
      await store().leaveGroup();
    });

    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });

    const { store: tutorStore } = await mountTutor(server);

    expect(
      findGroup(tutorStore(), SALON_1A).students.some(
        (student) => student.id === CURRENT_STUDENT_ID
      )
    ).toBe(false);
  });

  it('deleteGroup borra el salón y devuelve al alumno inscrito a none', async () => {
    const { store, server } = await renderClassrooms({
      user: currentTutor,
      seed: seedWithMember,
    });

    await act(async () => {
      await store().deleteGroup(SALON_1A);
    });

    expect(store().groups.some((group) => group.id === SALON_1A)).toBe(false);

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'none',
      groupId: null,
    });
    expect(childAfter().currentGroup).toBeNull();
    expect(childAfter().groups.some((group) => group.id === SALON_1A)).toBe(false);
  });

  it('deleteGroup también devuelve a none al alumno que sólo estaba en espera', async () => {
    const { store: childStore, server } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
    });

    await act(async () => {
      await childStore().requestJoin(SALON_2B);
    });

    const { store: tutorStore } = await mountTutor(server);

    await act(async () => {
      await tutorStore().deleteGroup(SALON_2B);
    });

    expect(tutorStore().groups.some((group) => group.id === SALON_2B)).toBe(false);

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'none',
      groupId: null,
    });
  });

  it('borrar otro salón no toca la pertenencia del alumno', async () => {
    const { store, server } = await renderClassrooms({
      user: currentTutor,
      seed: seedWithMember,
    });

    await act(async () => {
      await store().deleteGroup(SALON_2B);
    });

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });
  });
});

describe('Acciones del tutor sobre el salón', () => {
  it('createGroup añade el salón y devuelve el creado', async () => {
    const { store } = await renderClassrooms({ user: currentTutor, seed: seedTwoGroups });
    const antes = store().groups.length;

    const created: (ClassGroup | null)[] = [];

    await act(async () => {
      created.push(
        await store().createGroup({
          name: 'Salón 4D',
          gradeLabel: 'Cuarto',
          teacherName: 'Sra. Tutora',
          capacity: 15,
        })
      );
    });

    expect(store().groups).toHaveLength(antes + 1);
    expect(created).toHaveLength(1);
    expect(created[0]).not.toBeNull();
    expect(store().groups.some((group) => group.id === created[0]?.id)).toBe(true);
    expect(created[0]?.name).toBe('Salón 4D');
  });
});

describe('Mutaciones estables bajo StrictMode', () => {
  it('crear un salón produce exactamente un salón nuevo', async () => {
    const { store, server } = await renderClassrooms({ user: currentTutor, seed: seedTwoGroups });
    const antes = store().groups.length;
    const escriturasAntes = server.writeCount();

    await act(async () => {
      await store().createGroup({
        name: 'Salón 5E',
        gradeLabel: 'Quinto',
        teacherName: 'Sra. Tutora',
        capacity: 12,
      });
    });

    expect(store().groups).toHaveLength(antes + 1);
    expect(server.writeCount()).toBe(escriturasAntes + 1);

    const ids = store().groups.map((group) => group.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('solicitar ingreso produce exactamente una solicitud', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });
    const escriturasAntes = server.writeCount();

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(server.writeCount()).toBe(escriturasAntes + 1);

    const { store: tutorStore } = await mountTutor(server);
    const propias = findGroup(tutorStore(), SALON_1A).pendingRequests.filter(
      (item) => item.studentId === CURRENT_STUDENT_ID
    );

    expect(propias).toHaveLength(1);
  });
});

/**
 * Este bloque documentaba lo contrario: que el store sobrescribía la pertenencia
 * sin comprobarla, y que el invariante lo sostenía el enrutado de la vista. La
 * guarda ya está en el store, así que el aserto se invierte.
 */
describe('Un alumno pertenece como máximo a un salón', () => {
  it('no crea la solicitud si el alumno ya está inscrito', async () => {
    const { store, server } = await renderClassrooms({
      user: currentChild,
      seed: (fake) => {
        seedTwoGroups(fake);
        fake.seedMember(SALON_1A, CURRENT_STUDENT_ID);
      },
    });

    const escriturasAntes = server.writeCount();

    await act(async () => {
      await store().requestJoin(SALON_2B);
    });

    expect(store().membership).toEqual<StudentMembership>({
      status: 'member',
      groupId: SALON_1A,
    });
    expect(server.writeCount()).toBe(escriturasAntes);
  });

  it('no crea una segunda solicitud si ya tiene una pendiente', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    const escriturasAntes = server.writeCount();

    await act(async () => {
      await store().requestJoin(SALON_2B);
    });

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
    expect(server.writeCount()).toBe(escriturasAntes);
  });
});

/**
 * Sustituyen al bloque de persistencia en `localStorage`, que murió con la
 * capacidad que probaba: los salones ya no se guardan en el navegador.
 */
describe('Identidad de la sesión', () => {
  it('sin usuario no hay salones ni pertenencia', async () => {
    const { store } = await renderClassrooms({ user: null, seed: seedTwoGroups });

    expect(store().groups).toEqual([]);
    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
    expect(store().currentGroup).toBeNull();
  });

  it('el tutor sólo ve los salones que él creó', async () => {
    const { store } = await renderClassrooms({
      user: currentTutor,
      seed: (fake) => {
        seedTwoGroups(fake);
        fake.seedGroup({ id: 'salon-ajeno', name: 'Salón ajeno', tutorId: 'otro-tutor' });
      },
    });

    expect(store().groups.map((group) => group.id)).toEqual([SALON_1A, SALON_2B]);
  });

  it('el niño ve el catálogo entero, con el recuento de cada salón', async () => {
    const { store } = await renderClassrooms({
      user: currentChild,
      seed: (fake) => {
        seedTwoGroups(fake);
        fake.seedGroup({ id: 'salon-ajeno', name: 'Salón ajeno', tutorId: 'otro-tutor' });
        fake.seedMember('salon-ajeno', OTHER_STUDENT_ID);
      },
    });

    const ajeno = findGroup(store(), 'salon-ajeno');

    expect(store().groups).toHaveLength(3);
    expect(ajeno.memberCount).toBe(1);
    /* Cuántos hay, nunca quiénes: del salón ajeno no llega la lista. */
    expect(ajeno.students).toEqual([]);
  });
});

describe('Carga y error', () => {
  it('termina de cargar y lo declara', async () => {
    const { store } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    expect(store().loading).toBe(false);
    expect(store().error).toBeNull();
  });

  it('expone el error de una lectura en vez de descartarlo', async () => {
    const { store } = await renderClassrooms({
      user: currentChild,
      seed: (fake) => {
        seedTwoGroups(fake);
        fake.failReads('No se pudieron cargar los salones.');
      },
    });

    expect(store().error?.message).toBe('No se pudieron cargar los salones.');
    expect(store().groups).toEqual([]);
  });

  it('expone el error de una escritura y no cambia el estado', async () => {
    const { store, server } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
    });

    server.failNextWrite('No se pudo enviar la solicitud.');

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(store().error?.message).toBe('No se pudo enviar la solicitud.');
    expect(store().membership).toEqual<StudentMembership>({ status: 'none', groupId: null });
  });

  /**
   * El aserto de arriba no basta como red, y se demostró: pasaba mientras la
   * pantalla no pintaba nada y el botón parecía roto. Lo que hay que afirmar es
   * que el motivo le llega a quien pulsó, no que esté disponible en el store.
   */
  it('muestra en la pantalla el motivo de una escritura fallida', async () => {
    const { store, server, screen } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
      ui: <StudentClassroomModule />,
    });

    expect(screen.queryByRole('alert')).toBeNull();

    server.failNextWrite('El salón está lleno.');

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('El salón está lleno.');
  });

  it('retira el mensaje en cuanto una acción posterior sale bien', async () => {
    const { store, server, screen } = await renderClassrooms({
      user: currentChild,
      seed: seedTwoGroups,
      ui: <StudentClassroomModule />,
    });

    server.failNextWrite('No se pudo enviar la solicitud.');

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    expect(store().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Historial de solicitudes acumulado', () => {
  it('manda la solicitud más reciente, no la primera que aparezca', async () => {
    const { store, server } = await renderClassrooms({ user: currentChild, seed: seedTwoGroups });

    await act(async () => {
      await store().requestJoin(SALON_1A);
    });

    const { store: tutorStore } = await mountTutor(server);

    await act(async () => {
      await tutorStore().rejectRequest(
        SALON_1A,
        requestIdOf(tutorStore(), SALON_1A, CURRENT_STUDENT_ID)
      );
    });

    /* Vuelve a pedir entrar: queda una rechazada y una pendiente posterior. */
    const { store: childAgain } = await mountChild(server);

    await act(async () => {
      await childAgain().requestJoin(SALON_1A);
    });

    const { store: childAfter } = await mountChild(server);

    expect(childAfter().membership).toEqual<StudentMembership>({
      status: 'pending',
      groupId: SALON_1A,
    });
  });
});

/**
 * El servidor falso entrega la noticia de que algo cambió, nunca el cambio,
 * igual que el servicio real: quien escucha vuelve a consultar, y ahí es donde
 * la base decide qué ve.
 */
describe('Sincronización en vivo', () => {
  it('una solicitud que entra aparece en el panel del tutor sin volver a montar', async () => {
    const { store, server } = await renderClassrooms({ user: currentTutor, seed: seedTwoGroups });

    expect(findGroup(store(), SALON_2B).pendingRequests).toHaveLength(0);

    server.seedRequest(SALON_2B, CURRENT_STUDENT_ID);

    await act(async () => {
      server.emit();
    });

    expect(findGroup(store(), SALON_2B).pendingRequests).toHaveLength(1);
  });

  /**
   * El aserto tiene que caer MIENTRAS la relectura está en vuelo. Mirar el
   * estado final no sirve —para entonces la espera ya se apagó—, y mirar el
   * historial de renders tampoco: con una lectura que resuelve al instante,
   * React agrupa el `loading` intermedio y nadie llega a verlo. De ahí la
   * retención: es el hueco que en la aplicación abre el viaje a la base.
   *
   * Sin este test, cualquiera que unifique los dos caminos de recarga vuelve a
   * blanquear el panel del tutor con cada evento ajeno.
   */
  it('un evento no vuelve a declarar espera mientras relee', async () => {
    const { store, server } = await renderClassrooms({
      user: currentTutor,
      seed: seedTwoGroups,
    });

    server.seedRequest(SALON_2B, CURRENT_STUDENT_ID);

    const releaseRead = server.holdReads();

    act(() => {
      server.emit();
    });

    /* La consulta está a medias y la pantalla no se ha movido. */
    expect(store().loading).toBe(false);

    await act(async () => {
      releaseRead();
    });

    expect(store().loading).toBe(false);
    expect(findGroup(store(), SALON_2B).pendingRequests).toHaveLength(1);
  });

  /**
   * La otra mitad de la regla, y la que la hace estrecha: la recarga silenciosa
   * NO declara espera, pero sí la apaga. Si un evento entra con la carga
   * inicial todavía en vuelo, aquélla se descarta por `loadId` sin apagar nada,
   * así que si ésta tampoco lo hiciera el indicador se quedaría encendido para
   * siempre.
   */
  it('un evento durante la carga inicial no deja el indicador encendido', async () => {
    const server = createFakeClassrooms(TUTOR_ID);

    seedTwoGroups(server);

    const releaseRead = server.holdReads();

    const mounted = renderClassrooms({ user: currentTutor, server });

    /* El evento entra antes de que la primera consulta haya resuelto. */
    act(() => {
      server.emit();
    });

    await act(async () => {
      releaseRead();
    });

    const { store } = await mounted;

    expect(store().loading).toBe(false);
  });

  it('bajo StrictMode queda una sola suscripción, y ninguna al desmontar', async () => {
    const { server, unmount } = await renderClassrooms({
      user: currentTutor,
      seed: seedTwoGroups,
    });

    expect(server.subscriptionCount()).toBe(1);

    unmount();

    expect(server.subscriptionCount()).toBe(0);
  });

  /*
   * Un canal abierto sin sesión pasa la autorización con las manos vacías y no
   * se reintenta solo cuando después llega el usuario.
   */
  it('sin sesión no se suscribe', async () => {
    const { server } = await renderClassrooms({ user: null, seed: seedTwoGroups });

    expect(server.subscriptionCount()).toBe(0);
  });
});
