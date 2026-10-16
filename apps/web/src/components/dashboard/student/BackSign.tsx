import type { ReactNode } from 'react';

interface BackSignProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/** «Volver a…» en una flecha de madera que apunta hacia atrás. */
export const BackSign = ({ onClick, children, className = '' }: BackSignProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`back-arrow-sign wood-carved font-display text-[17px] ${className}`}
  >
    {children}
  </button>
);
