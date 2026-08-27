import { AppError } from '../errors/AppError';
import { buildInitials, pickAvatarTone } from '../components/dashboard/teacher/classroomsData';
import type { ClassroomsService, ClassroomsSnapshot } from '../services/classrooms.service';
import type {
  ClassGroup,
  ClassroomStudent,
  SkillKey,
  StudentMembership,
} from '../types/classroom.types';

/**
 * Servidor de salones en memoria. Imita a la base, no al store: impone el cupo,
 * «un alumno, un salón» y la acumulación del historial de solicitudes, de modo
 * que un test que pase aquí describe algo que la base también permitiría.
 */
interface GroupRow {
  id: string;
  tutorId: string;
  publicId: string;
  name: string;
  gradeLabel: string;
  teacherName: string;
  capacity: number;
}

interface MembershipRow {
  groupId: string;
  studentId: string;
}

interface RequestRow {
  id: string;
  groupId: string;
  studentId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
}

interface InvitationRow {
  id: string;
  groupId: string;
  email: string;
  sentAt: string;
  status: 'pending' | 'accepted';
}

const EMPTY_SKILLS: Record<SkillKey, number> = {
  sequences: 0,
  loops: 0,
  conditionals: 0,
  debugging: 0,
  decomposition: 0,
};

const EMPTY_MEMBERSHIP: StudentMembership = { status: 'none', groupId: null };

const FALLBACK_STUDENT_NAME = 'Explorador';

export interface SeedGroupInput {
  id: string;
  name?: string;
  publicId?: string;
  capacity?: number;
  tutorId?: string;
}

export interface FakeClassrooms {
  service: ClassroomsService;
  seedGroup: (input: SeedGroupInput) => void;
  seedProfile: (studentId: string, fullName: string) => void;
  seedRequest: (groupId: string, studentId: string) => string;
  seedMember: (groupId: string, studentId: string) => void;
  /** Escrituras recibidas. Es lo que delata una mutación duplicada. */
  writeCount: () => number;
  /** Hace fallar la siguiente escritura, para probar el camino de error. */
  failNextWrite: (message: string) => void;
  /** Hace fallar todas las lecturas. */
  failReads: (message: string | null) => void;
}

export const createFakeClassrooms = (tutorId = 'tutor-de-prueba'): FakeClassrooms => {
  const groups: GroupRow[] = [];
  const memberships: MembershipRow[] = [];
  const requests: RequestRow[] = [];
  const invitations: InvitationRow[] = [];
  const profiles = new Map<string, string>();

  let sequence = 0;
  let writes = 0;
  let nextWriteError: string | null = null;
  let readError: string | null = null;

  const nextId = (prefix: string): string => {
    sequence += 1;

    return `${prefix}-${sequence}`;
  };

  /** Marca de tiempo estrictamente creciente, para poder ordenar solicitudes. */
  const nextTimestamp = (): string => {
    sequence += 1;

    return new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)).toISOString();
  };

  const nameOf = (studentId: string): string => profiles.get(studentId) || FALLBACK_STUDENT_NAME;

  const buildStudent = (studentId: string): ClassroomStudent => {
    const name = nameOf(studentId);

    return {
      id: studentId,
      name,
      initials: buildInitials(name),
      avatarTone: pickAvatarTone(studentId),
      currentWorld: null,
      hoursSinceLastActivity: null,
      streakDays: 0,
      xp: 0,
      skills: { ...EMPTY_SKILLS },
    };
  };

  const buildGroup = (row: GroupRow, visibleStudents: string[]): ClassGroup => ({
    id: row.id,
    publicId: row.publicId,
    name: row.name,
    gradeLabel: row.gradeLabel,
    teacherName: row.teacherName,
    capacity: row.capacity,
    memberCount: memberships.filter((entry) => entry.groupId === row.id).length,
    students: visibleStudents.map(buildStudent),
    pendingRequests: requests
      .filter((entry) => entry.groupId === row.id && entry.status === 'pending')
      .map((entry) => ({
        id: entry.id,
        studentId: entry.studentId,
        studentName: nameOf(entry.studentId),
        initials: buildInitials(nameOf(entry.studentId)),
        avatarTone: pickAvatarTone(entry.studentId),
        requestedAtIso: entry.requestedAt,
      })),
    invitations: invitations
      .filter((entry) => entry.groupId === row.id)
      .map((entry) => ({
        id: entry.id,
        email: entry.email,
        sentAtIso: entry.sentAt,
        status: entry.status,
      })),
  });

  const membersOf = (groupId: string): string[] =>
    memberships.filter((entry) => entry.groupId === groupId).map((entry) => entry.studentId);

  const fail = (message: string) => ({
    data: null,
    error: new AppError(message, 'fake_error'),
  });

  const write = <T>(run: () => { data: T; error: null } | { data: null; error: AppError }) => {
    writes += 1;

    if (nextWriteError) {
      const message = nextWriteError;
      nextWriteError = null;

      return fail(message);
    }

    return run();
  };

  const ok = { data: null, error: null } as const;

  const service: ClassroomsService = {
    async getTutorSnapshot(requestingTutorId: string) {
      if (readError) {
        return fail(readError);
      }

      const own = groups.filter((row) => row.tutorId === requestingTutorId);

      return {
        data: {
          groups: own.map((row) => buildGroup(row, membersOf(row.id))),
          membership: EMPTY_MEMBERSHIP,
        } satisfies ClassroomsSnapshot,
        error: null,
      };
    },

    async getStudentSnapshot(studentId: string) {
      if (readError) {
        return fail(readError);
      }

      const own = memberships.find((entry) => entry.studentId === studentId);

      /*
       * La última por fecha, como en la base: un niño rechazado que vuelve a
       * pedir entrar deja dos filas para el mismo par.
       */
      const lastRequest = requests
        .filter((entry) => entry.studentId === studentId)
        .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt))[0];

      let membership: StudentMembership = EMPTY_MEMBERSHIP;

      if (own) {
        membership = { status: 'member', groupId: own.groupId };
      } else if (lastRequest?.status === 'pending') {
        membership = { status: 'pending', groupId: lastRequest.groupId };
      }

      return {
        data: {
          /* Del salón ajeno se conoce el recuento, nunca quiénes están dentro. */
          groups: groups.map((row) =>
            buildGroup(row, row.id === membership.groupId ? membersOf(row.id) : [])
          ),
          membership,
        } satisfies ClassroomsSnapshot,
        error: null,
      };
    },

    async createGroup(input, creatorId) {
      return write(() => {
        const row: GroupRow = {
          id: nextId('group'),
          tutorId: creatorId,
          publicId: `CP-${String(sequence).padStart(4, '0')}`,
          name: input.name.trim(),
          gradeLabel: input.gradeLabel.trim(),
          teacherName: input.teacherName.trim(),
          capacity: input.capacity,
        };

        groups.push(row);

        return { data: buildGroup(row, []), error: null };
      });
    },

    async deleteGroup(groupId) {
      return write(() => {
        const index = groups.findIndex((row) => row.id === groupId);

        if (index >= 0) {
          groups.splice(index, 1);
        }

        /* En cascada, igual que las claves ajenas de la migración 0013. */
        [memberships, requests, invitations].forEach((table) => {
          for (let position = table.length - 1; position >= 0; position -= 1) {
            if (table[position].groupId === groupId) {
              table.splice(position, 1);
            }
          }
        });

        return ok;
      });
    },

    async removeStudent(groupId, studentId) {
      return write(() => {
        const index = memberships.findIndex(
          (entry) => entry.groupId === groupId && entry.studentId === studentId
        );

        if (index >= 0) {
          memberships.splice(index, 1);
        }

        return ok;
      });
    },

    async acceptRequest(requestId) {
      return write(() => {
        const request = requests.find((entry) => entry.id === requestId);

        if (!request || request.status !== 'pending') {
          return fail('Join request is already resolved');
        }

        const group = groups.find((row) => row.id === request.groupId);

        if (!group) {
          return fail('Join request not found');
        }

        if (membersOf(group.id).length >= group.capacity) {
          return fail('Classroom is full');
        }

        if (memberships.some((entry) => entry.studentId === request.studentId)) {
          return fail('Student already belongs to a classroom');
        }

        memberships.push({ groupId: request.groupId, studentId: request.studentId });
        request.status = 'accepted';

        return ok;
      });
    },

    async rejectRequest(requestId) {
      return write(() => {
        const request = requests.find((entry) => entry.id === requestId);

        if (request?.status === 'pending') {
          request.status = 'rejected';
        }

        return ok;
      });
    },

    async inviteByEmail(groupId, email) {
      return write(() => {
        invitations.push({
          id: nextId('inv'),
          groupId,
          email: email.trim().toLowerCase(),
          sentAt: nextTimestamp(),
          status: 'pending',
        });

        return ok;
      });
    },

    async requestJoin(groupId, studentId) {
      return write(() => {
        if (memberships.some((entry) => entry.studentId === studentId)) {
          return fail('Student already belongs to a classroom');
        }

        if (requests.some((entry) => entry.studentId === studentId && entry.status === 'pending')) {
          return fail('Student already has a pending request');
        }

        requests.push({
          id: nextId('req'),
          groupId,
          studentId,
          status: 'pending',
          requestedAt: nextTimestamp(),
        });

        return ok;
      });
    },

    async cancelJoinRequest(studentId) {
      return write(() => {
        for (let position = requests.length - 1; position >= 0; position -= 1) {
          const entry = requests[position];

          if (entry.studentId === studentId && entry.status === 'pending') {
            requests.splice(position, 1);
          }
        }

        return ok;
      });
    },

    async leaveGroup(studentId) {
      return write(() => {
        const index = memberships.findIndex((entry) => entry.studentId === studentId);

        if (index >= 0) {
          memberships.splice(index, 1);
        }

        return ok;
      });
    },
  };

  return {
    service,

    seedGroup: (input) => {
      groups.push({
        id: input.id,
        tutorId: input.tutorId ?? tutorId,
        publicId: input.publicId ?? `CP-${input.id.slice(0, 4).toUpperCase()}`,
        name: input.name ?? input.id,
        gradeLabel: 'Primero de primaria',
        teacherName: 'Sra. Tutora',
        capacity: input.capacity ?? 30,
      });
    },

    seedProfile: (studentId, fullName) => {
      profiles.set(studentId, fullName);
    },

    seedRequest: (groupId, studentId) => {
      const id = nextId('req');

      requests.push({ id, groupId, studentId, status: 'pending', requestedAt: nextTimestamp() });

      return id;
    },

    seedMember: (groupId, studentId) => {
      memberships.push({ groupId, studentId });
    },

    writeCount: () => writes,

    failNextWrite: (message) => {
      nextWriteError = message;
    },

    failReads: (message) => {
      readError = message;
    },
  };
};
