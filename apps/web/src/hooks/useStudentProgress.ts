import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { studentProgressService } from '../services/studentProgress.service';
import type { StudentProgressDetail } from '../types/classroom.types';

interface UseStudentProgressReturn {
  detail: StudentProgressDetail | null;
  loading: boolean;
  error: AppError | null;
}

const EMPTY_DETAIL: StudentProgressDetail = { levels: [], attemptsByLevel: {} };

/**
 * El avance de un explorador concreto. Con `studentId` a `null` no consulta
 * nada: lo monta sólo el panel del tutor y sólo cuando hay alguien elegido, para
 * que el historial no se cargue en cada entrada al panel.
 */
export const useStudentProgress = (studentId: string | null): UseStudentProgressReturn => {
  const [detail, setDetail] = useState<StudentProgressDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!studentId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await studentProgressService.getDetail(studentId);

    if (result.error) {
      setError(result.error);
      setDetail(null);
      setLoading(false);
      return;
    }

    setDetail(result.data ?? EMPTY_DETAIL);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { detail, loading, error };
};
