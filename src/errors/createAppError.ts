import { AuthError } from '@supabase/supabase-js';
import { AppError } from './AppError';

type ErrorWithMessage = {
  code?: string;
  message: string;
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  );
};

export const createAppError = (
  error: unknown,
  fallbackMessage: string,
  fallbackCode = 'unexpected_error'
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof AuthError) {
    return new AppError(error.message, String(error.status ?? fallbackCode), error);
  }

  if (isErrorWithMessage(error)) {
    return new AppError(error.message, error.code ?? fallbackCode, error);
  }

  if (error instanceof Error) {
    return new AppError(error.message, fallbackCode, error);
  }

  return new AppError(fallbackMessage, fallbackCode, error);
};
