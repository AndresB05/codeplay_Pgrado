import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportReportMenu } from './ExportReportMenu';
import type { ClassGroup, ClassroomStudent } from '../../../types/classroom.types';

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getClassroomDetail: vi.fn(),
  downloadSummaryCsv: vi.fn(),
  downloadDetailCsv: vi.fn(),
  downloadClassroomReportPdf: vi.fn(),
}));

vi.mock('../../../services/studentProgress.service', () => ({
  studentProgressService: {
    getCatalog: mocks.getCatalog,
    getClassroomDetail: mocks.getClassroomDetail,
  },
}));

vi.mock('./classroomReportCsv', () => ({
  downloadSummaryCsv: mocks.downloadSummaryCsv,
  downloadDetailCsv: mocks.downloadDetailCsv,
}));

vi.mock('./classroomReportPdf', () => ({
  downloadClassroomReportPdf: mocks.downloadClassroomReportPdf,
}));

const STUDENT: ClassroomStudent = {
  id: 's1',
  name: 'Axoluk',
  initials: 'AX',
  avatarTone: '',
  currentWorld: null,
  hoursSinceLastActivity: null,
  streakDays: null,
  xp: 0,
  attemptedLevels: 0,
  completedLevels: 0,
  completedWorlds: 0,
  totalAttempts: 0,
  averageBestScore: null,
};

const buildGroup = (students: ClassroomStudent[]): ClassGroup => ({
  id: 'g1',
  publicId: 'CP-PJE6',
  name: 'salon pinpon',
  gradeLabel: '3°',
  teacherName: 'Tutor',
  capacity: 30,
  memberCount: students.length,
  students,
  pendingRequests: [],
});

describe('ExportReportMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCatalog.mockResolvedValue({ data: [], error: null });
    mocks.getClassroomDetail.mockResolvedValue({ data: {}, error: null });
  });

  it('no deja exportar un salón sin exploradores, y dice por qué', () => {
    render(<ExportReportMenu group={buildGroup([])} />);

    expect(screen.getByRole('button', { name: /exportar reporte/i })).toBeDisabled();
    expect(screen.getByText('No hay exploradores que reportar.')).toBeInTheDocument();
  });

  it('descarga el resumen del salón al elegirlo', async () => {
    const user = userEvent.setup();

    render(<ExportReportMenu group={buildGroup([STUDENT])} />);

    await user.click(screen.getByRole('button', { name: /exportar reporte/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Resumen (CSV)' }));

    expect(mocks.getClassroomDetail).toHaveBeenCalledWith('g1');
    expect(mocks.downloadSummaryCsv).toHaveBeenCalledTimes(1);
    expect(mocks.downloadSummaryCsv.mock.calls[0][0]).toMatchObject({
      publicId: 'CP-PJE6',
      summary: [expect.objectContaining({ studentName: 'Axoluk' })],
    });
  });

  it('avisa y no descarga nada si el progreso no se puede leer', async () => {
    const user = userEvent.setup();

    mocks.getClassroomDetail.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'No tienes permiso' },
    });

    render(<ExportReportMenu group={buildGroup([STUDENT])} />);

    await user.click(screen.getByRole('button', { name: /exportar reporte/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Reporte completo (PDF)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo generar el reporte');
    expect(mocks.downloadClassroomReportPdf).not.toHaveBeenCalled();
    expect(mocks.downloadSummaryCsv).not.toHaveBeenCalled();
    expect(mocks.downloadDetailCsv).not.toHaveBeenCalled();
  });
});
