import avatar1 from '../assets/brand/avatar-1.webp';
import avatar2 from '../assets/brand/avatar-2.webp';
import avatar3 from '../assets/brand/avatar-3.webp';

export const MASCOT_AVATARS = [avatar1, avatar2, avatar3];

/**
 * Los valores que se guardan en `profiles.avatar_key` para estos tres. Un
 * `avatar_key` que no sea ninguno de ellos —el `'colibri'` de siempre, de un
 * concepto anterior— cae en el reparto por hash.
 */
export const AVATAR_KEYS = ['avatar-1', 'avatar-2', 'avatar-3'] as const;
export type MascotAvatarKey = (typeof AVATAR_KEYS)[number];

/** Pedido a mano por el usuario para su propia cuenta de prueba. */
const NAME_OVERRIDES: Record<string, number> = {
  'Andrés Blanco Quiñonez': 1,
};

/**
 * El índice (0-2) que le toca a alguien. Si ya declaró uno en Ajustes
 * (`avatarKey` es uno de `AVATAR_KEYS`), es ese. Si no, el reparto es
 * determinista por `user.id` —mismo id, mismo leopardo siempre, sin sorteo en
 * cada carga— hasta que elija. Se comparte entre `pickMascotAvatar` y el
 * selector de Ajustes, que necesita el índice para marcar el elegido.
 */
export const resolveMascotAvatarIndex = (
  userId: string | null | undefined,
  fullName?: string | null,
  avatarKey?: string | null
): number => {
  const keyIndex = avatarKey ? AVATAR_KEYS.indexOf(avatarKey as MascotAvatarKey) : -1;
  if (keyIndex !== -1) return keyIndex;

  const overrideIndex = fullName ? NAME_OVERRIDES[fullName.trim()] : undefined;
  if (overrideIndex !== undefined) return overrideIndex;

  if (!userId) return 0;
  const hash = Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % MASCOT_AVATARS.length;
};

export const pickMascotAvatar = (
  userId: string | null | undefined,
  fullName?: string | null,
  avatarKey?: string | null
): string => MASCOT_AVATARS[resolveMascotAvatarIndex(userId, fullName, avatarKey)];
