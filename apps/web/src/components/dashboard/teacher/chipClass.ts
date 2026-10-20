/** El botón de elegir explorador en el panel. El alcance va en un `tutor-seg`. */
export const chipClass = (active: boolean) =>
  `tutor-focus h-[30px] rounded-[8px] border px-2.5 text-[13.5px] font-semibold transition-colors ${
    active
      ? 'border-tutor-accent bg-tutor-accent text-white'
      : 'border-tutor-rule-strong bg-tutor-surface text-tutor-ink hover:bg-tutor-sunken'
  }`;
