import { z } from 'zod';
import { fullNameSchema } from './fullName.schema';

export const signupSchema = z
  .object({
    confirmPassword: z.string(),
    email: z.string().email('Correo electrónico inválido'),
    fullName: fullNameSchema,
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['child', 'tutor']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
