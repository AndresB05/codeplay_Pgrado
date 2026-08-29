import { z } from 'zod';

/*
 * La longitud del nombre se declara UNA vez y la heredan el registro y el panel
 * de Ajustes. Vive en su propio archivo y no en `SignupForm.schema.ts` porque no
 * es propia de ninguno de los dos formularios: importarla del otro es la forma
 * que ya falló en `ChangePasswordForm.schema.ts`, que dice heredar el mínimo de
 * `signupSchema` y en realidad lo copia.
 *
 * Es además la ÚNICA validación del nombre que hay: `update_my_profile` hace
 * `coalesce(input_full_name, full_name)` sin `trim`, sin longitud y sin rechazar
 * la cadena vacía, y la columna no tiene `check`. Quien llame a la RPC por otra
 * vía se la salta.
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(60, 'El nombre no puede pasar de 60 caracteres');
