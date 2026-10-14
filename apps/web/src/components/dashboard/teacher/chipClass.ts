/** La píldora de elegir del panel: el alcance y el explorador. */
export const chipClass = (active: boolean) =>
  `rounded-full border-[3px] px-5 py-2 font-display text-[15px] transition-colors ${
    active
      ? 'border-ink bg-grape text-white shadow-[0_4px_0_rgba(42,27,69,0.2)]'
      : 'border-line bg-white text-ink hover:bg-cream'
  }`;
