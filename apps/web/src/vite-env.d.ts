/// <reference types="vite/client" />

/**
 * Las cuentas de prueba del acceso sin login son opcionales: sin ellas se entra
 * con la marca de invitado. Declararlas aquí las tipa como `string | undefined`
 * en vez del `any` que da la firma de índice de Vite, y así la comprobación de
 * que están configuradas la verifica el compilador.
 */
interface ImportMetaEnv {
  readonly VITE_DEV_TUTOR_EMAIL?: string;
  readonly VITE_DEV_TUTOR_PASSWORD?: string;
  readonly VITE_DEV_CHILD_EMAIL?: string;
  readonly VITE_DEV_CHILD_PASSWORD?: string;
}
