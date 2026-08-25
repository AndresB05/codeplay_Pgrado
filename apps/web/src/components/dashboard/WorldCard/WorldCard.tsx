import type { WorldWithStatus } from '../../../types/world.types';

interface WorldCardProps {
  world: WorldWithStatus;
  onPlay: (worldId: string) => void;
}

export const WorldCard = ({ world, onPlay }: WorldCardProps) => {
  const isLocked = world.status === 'locked';
  const isCompleted = world.status === 'completed';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all hover:scale-105 ${
        isLocked ? 'opacity-60 grayscale' : ''
      }`}
      style={{ backgroundColor: world.color }}
    >
      <div className="p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">🎮</span>
          </div>
          {isCompleted && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Completado
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold mb-2">{world.name}</h3>
        <p className="text-white/90 mb-4">{world.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-full h-2 bg-white/30 rounded-full overflow-hidden"
              style={{ width: '100px' }}
            >
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${world.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{world.progress}%</span>
          </div>

          {!isLocked && (
            <button
              onClick={() => onPlay(world.id)}
              className="bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Jugar
            </button>
          )}

          {isLocked && (
            <div className="bg-black/30 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <span>🔒</span>
              <span>Bloqueado</span>
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-4xl">🔒</span>
        </div>
      )}
    </div>
  );
};
