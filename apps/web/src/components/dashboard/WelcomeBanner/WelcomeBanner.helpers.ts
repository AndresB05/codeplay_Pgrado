export const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return '¡Buenos días';
  }

  if (hour < 18) {
    return '¡Buenas tardes';
  }

  return '¡Buenas noches';
};

export const getXPLevel = (xp: number): number => {
  return Math.floor(xp / 1000) + 1;
};

export const getXPForNextLevel = (xp: number): number => {
  return getXPLevel(xp) * 1000;
};

export const getXPProgressInLevel = (xp: number): number => {
  const xpInCurrentLevel = xp % 1000;
  return (xpInCurrentLevel / 1000) * 100;
};
