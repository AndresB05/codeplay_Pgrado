import { AvatarPicker } from '../../ui/AvatarPicker';
import type { Avatar } from '../../../types/user.types';

interface StepProfileProps {
  selectedAvatar: string | null;
  onAvatarSelect: (avatar: Avatar) => void;
}

export const StepProfile = ({ selectedAvatar, onAvatarSelect }: StepProfileProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-neutral mb-2">Elige tu avatar</h3>
        <p className="text-neutral-light">
          Selecciona el personaje que te representará en CodePlay
        </p>
      </div>
      <AvatarPicker selectedAvatar={selectedAvatar} onSelect={onAvatarSelect} />
    </div>
  );
};
