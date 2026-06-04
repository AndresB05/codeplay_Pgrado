import { z } from 'zod';

const ENV_SCHEMA = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL debe ser una URL válida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY es obligatoria'),
});

type EnvSchema = z.infer<typeof ENV_SCHEMA>;

const validateEnv = (): EnvSchema => {
  const parsedEnv = ENV_SCHEMA.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });

  if (!parsedEnv.success) {
    const errorMessages = parsedEnv.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    throw new Error(`Falló la validación de variables de entorno:\n${errorMessages.join('\n')}`);
  }

  return parsedEnv.data;
};

export const env = validateEnv();
