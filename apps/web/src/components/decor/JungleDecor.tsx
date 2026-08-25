/**
 * Adornos de selva tropical.
 *
 * Todos siguen la línea visual del panel del tutor: contorno de tinta grueso,
 * relleno saturado y formas redondeadas. Son decorativos, así que van marcados
 * con `aria-hidden` y nunca capturan el puntero: acompañan al contenido, no
 * compiten con él.
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

/** Hoja de palma: sirve de acento alargado en cabeceras y esquinas. */
export const PalmFrond = ({
  size = 64,
  className = '',
  color = '#4ECB85',
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
      d="M10 56C18 34 32 16 56 8"
      stroke={INK}
      strokeWidth="3.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 40C18 30 24 22 34 20C34 30 29 38 20 40Z"
      fill={color}
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M32 26C33 16 40 10 50 10C48 20 42 26 32 26Z"
      fill={color}
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M24 46C16 46 10 51 8 58C18 59 24 54 24 46Z"
      fill={color}
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
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

/** Tucán: la mascota del bioma, hasta que llegue la mascota definitiva. */
export const Toucan = ({ size = 64, className = '' }: DecorProps) => (
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
      d="M38 20C46 20 52 27 52 36C52 47 43 55 32 55C21 55 14 47 14 37C14 27 21 20 30 20"
      fill="#2A1B45"
      stroke={INK}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M36 26C36 26 22 22 12 26C18 31 26 33 34 32"
      fill="#FF8A3D"
      stroke={INK}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M30 40C36 38 42 40 45 45C40 50 33 50 28 46"
      fill="#FFC93C"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="38" cy="24" r="3.4" fill="#FFF9EF" stroke={INK} strokeWidth="2.4" />
  </svg>
);

/** Liana con hojas: separador horizontal entre bloques de contenido. */
export const VineDivider = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 400 24"
    preserveAspectRatio="none"
    className={`h-[24px] w-full ${className}`}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M0 12C50 2 90 22 140 12C190 2 230 22 280 12C330 2 360 22 400 12"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    {[70, 200, 330].map((x) => (
      <ellipse
        key={x}
        cx={x}
        cy="18"
        rx="12"
        ry="6"
        fill="#4ECB85"
        stroke={INK}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
);

/**
 * Dosel: hojas colgando del borde superior de una pantalla o tarjeta. El
 * contenedor debe ser `relative` y recortar el desbordamiento.
 */
export const Canopy = ({ className = '' }: { className?: string }) => (
  <div className={`pointer-events-none absolute inset-x-0 top-0 z-0 ${className}`} aria-hidden>
    <MonsteraLeaf size={112} className="absolute -left-8 -top-12 rotate-[18deg] opacity-90" />
    <PalmFrond size={96} className="absolute left-[16%] -top-10 rotate-[-12deg] opacity-80" />
    <TropicalFlower size={44} className="absolute left-[34%] top-2 rotate-[8deg] opacity-90" />
    <PalmFrond
      size={104}
      className="absolute right-[18%] -top-12 -scale-x-100 rotate-[10deg] opacity-80"
      color="#7ED957"
    />
    <MonsteraLeaf
      size={124}
      className="absolute -right-10 -top-14 -rotate-[16deg] opacity-90"
      color="#12703D"
    />
  </div>
);

/** Racimo de hojas para la esquina de una tarjeta grande. */
export const LeafCorner = ({ className = '' }: { className?: string }) => (
  <div className={`pointer-events-none absolute z-0 ${className}`} aria-hidden>
    <MonsteraLeaf size={72} className="rotate-[24deg]" color="#4ECB85" />
    <PalmFrond size={56} className="absolute -bottom-4 -left-6 rotate-[-18deg]" color="#1F9D5B" />
  </div>
);
