import { AVATARS } from '../../constants/avatars';
import type { Avatar } from '../../types/user.types';

interface AvatarPickerProps {
  selectedAvatar: string | null;
  onSelect: (avatar: Avatar) => void;
}

export const AvatarPicker = ({ selectedAvatar, onSelect }: AvatarPickerProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar)}
          className={`relative aspect-square rounded-xl border-4 transition-all hover:scale-105 ${
            selectedAvatar === avatar.id
              ? 'border-primary ring-4 ring-primary/30'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <span className="text-4xl">🎭</span>
          </div>
          {selectedAvatar === avatar.id && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
