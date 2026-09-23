import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import {
  AVATAR_KEYS,
  MASCOT_AVATARS,
  resolveMascotAvatarIndex,
} from '../../../constants/mascotAvatars';

/**
 * Elegir cuál de los tres leopardos usar. Vive en `shared/` como
 * `ChangeNamePanel`, aunque hoy sólo lo monta la pantalla del niño: los tutores
 * no tienen mascota que elegir.
 *
 * Sin paso de confirmación, a diferencia del nombre: tocar un avatar ya es la
 * decisión, no hace falta un campo que revisar antes de guardar.
 */
export const ChangeAvatarPanel = () => {
  const { updateAvatarKey, user } = useAuth();
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  const selectedIndex = resolveMascotAvatarIndex(user?.id, user?.fullName, user?.avatarKey);

  const handlePick = async (index: number): Promise<void> => {
    if (savingIndex !== null || index === selectedIndex) return;

    setSavingIndex(index);
    setChanged(false);
    const didChange = await updateAvatarKey(AVATAR_KEYS[index]);
    setSavingIndex(null);

    if (didChange) setChanged(true);
  };

  return (
    <div className="mt-6">
      <p className="field-label">Elige tu avatar</p>

      <div className="mt-2 flex items-center gap-3">
        {MASCOT_AVATARS.map((avatar, index) => {
          const isSelected = index === selectedIndex;

          return (
            <button
              key={AVATAR_KEYS[index]}
              type="button"
              onClick={() => void handlePick(index)}
              disabled={savingIndex !== null}
              aria-pressed={isSelected}
              aria-label={`Avatar ${index + 1}`}
              className={`h-[60px] w-[60px] overflow-hidden rounded-full border-[3px] transition-transform disabled:opacity-60 ${
                isSelected ? 'border-grape scale-105 shadow-[0_4px_0_rgba(42,27,69,0.15)]' : 'border-line'
              }`}
            >
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            </button>
          );
        })}
      </div>

      {changed ? (
        <p
          role="status"
          className="mt-4 rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
        >
          Tu avatar quedó cambiado.
        </p>
      ) : null}
    </div>
  );
};
