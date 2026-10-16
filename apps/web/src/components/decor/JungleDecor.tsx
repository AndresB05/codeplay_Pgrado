/**
 * Dibujos de selva tropical, con contorno de tinta grueso, relleno saturado y
 * formas redondeadas. Ya no se reparten como adornos por las esquinas —se
 * retiraron porque no casaban con las ilustraciones—: sólo quedan como iconos,
 * dentro de chips y tarjetas. Van con `aria-hidden` y sin capturar el puntero.
 */

type DecorProps = {
  size?: number;
  className?: string;
};

const INK = '#2A1B45';

/** Hoja de costilla de Adán: la silueta más reconocible de la selva. */
export const MonsteraLeaf = ({
  size = 64,
  className = '',
  color = '#1F9D5B',
}: DecorProps & { color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M32 5C50 13 58 26 58 37C58 50 46 59 32 59C18 59 6 50 6 37C6 26 14 13 32 5Z"
      fill={color}
      stroke={INK}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path d="M32 12V56" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <path
      d="M32 24L14 20M32 36L10 34M32 47L16 48M32 24L50 20M32 36L54 34M32 47L48 48"
      stroke={INK}
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);

/** Flor tropical de cinco pétalos, para puntear fondos y encabezados. */
export const TropicalFlower = ({
  size = 40,
  className = '',
  color = '#FF7BC2',
}: DecorProps & { color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse
        key={angle}
        cx="24"
        cy="12"
        rx="7.5"
        ry="10"
        fill={color}
        stroke={INK}
        strokeWidth="2.8"
        transform={`rotate(${angle} 24 24)`}
      />
    ))}
    <circle cx="24" cy="24" r="6" fill="#FFC93C" stroke={INK} strokeWidth="2.8" />
  </svg>
);
