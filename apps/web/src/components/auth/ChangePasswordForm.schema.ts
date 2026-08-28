import { z } from 'zod';

/*
 * La regla de las dos contraseñas nuevas se declara UNA vez y la usan los dos
 * esquemas. Copiarla es como los dos formularios acabarían con mínimos distintos
 * sin que nadie lo decidiera. El mínimo se hereda de `signupSchema`, para que la
 * aplicación no tenga dos longitudes mínimas.
 */
const newPasswordShape = {
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
};

const passwordsMatch = (data: { confirmPassword: string; password: string }): boolean =>
  data.password === data.confirmPassword;

const matchIssue: { message: string; path: string[] } = {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
};

/** Ajustes: hay sesión, así que la contraseña actual se pide y se verifica. */
export const changePasswordSchema = z
  .object({
    ...newPasswordShape,
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
  })
  .refine(passwordsMatch, matchIssue);

/**
 * Pantalla del enlace del correo: NO pide la contraseña actual. Quien llega ahí
 * es exactamente quien no la sabe, así que pedírsela sería exigirle el dato que
 * vino a recuperar.
 */
export const resetPasswordSchema = z.object(newPasswordShape).refine(passwordsMatch, matchIssue);

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
