import type { GroupTheme } from './groupThemes';

interface GroupBadgeProps {
  theme: GroupTheme;
  size?: number;
}

/**
 * Insignia ilustrada del salón. La forma depende del tema, así que cada salón
 * tiene una mascota reconocible además de su color.
 */
export const GroupBadge = ({ theme, size = 62 }: GroupBadgeProps) => {
  const stroke = '#2A1B45';

  const artwork = () => {
    switch (theme.key) {
      case 'rocket':
        return (
          <>
            <path
              d="M32 12C39 18 42 26 42 34L32 40L22 34C22 26 25 18 32 12Z"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="26" r="4.5" fill={theme.color} stroke={stroke} strokeWidth="3" />
            <path
              d="M22 30L15 38L23 37M42 30L49 38L41 37"
              fill={theme.colorDark}
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M28 41L32 52L36 41"
              fill="#FFC93C"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </>
        );
      case 'robot':
        return (
          <>
            <path d="M32 10V17" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="9" r="3.5" fill="#FFC93C" stroke={stroke} strokeWidth="3" />
            <rect
              x="16"
              y="18"
              width="32"
              height="28"
              rx="9"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
            />
            <circle cx="25" cy="31" r="3.5" fill={stroke} />
            <circle cx="39" cy="31" r="3.5" fill={stroke} />
            <path d="M26 39H38" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
            <path d="M12 27V37M52 27V37" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'dino':
        return (
          <>
            <path
              d="M18 46C18 33 25 24 35 24C44 24 50 30 50 38C50 44 46 46 46 46H18Z"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M27 24L31 16L35 24M35 24L40 18L43 26"
              fill={theme.colorDark}
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="41" cy="34" r="3" fill={stroke} />
            <path d="M18 46L12 50H24" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          </>
        );
      case 'star':
        return (
          <>
            <path
              d="M32 12L38 26L53 27.5L42 37.5L45 52L32 44.5L19 52L22 37.5L11 27.5L26 26L32 12Z"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="27" cy="31" r="2.6" fill={stroke} />
            <circle cx="37" cy="31" r="2.6" fill={stroke} />
            <path
              d="M28 37C29.5 39 34.5 39 36 37"
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        );
      case 'forest':
        return (
          <>
            <path
              d="M32 10L44 30H20L32 10Z"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M32 22L48 44H16L32 22Z"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M32 44V54" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
            <circle cx="26" cy="36" r="2.4" fill={theme.colorDark} />
            <circle cx="38" cy="38" r="2.4" fill={theme.colorDark} />
          </>
        );
      default:
        return (
          <>
            <path
              d="M14 40C18 34 22 34 26 40C30 46 34 46 38 40C42 34 46 34 50 40"
              stroke={stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="32" cy="24" r="11" fill="#FFFFFF" stroke={stroke} strokeWidth="3" />
            <circle cx="28" cy="23" r="2.4" fill={stroke} />
            <circle cx="36" cy="23" r="2.4" fill={stroke} />
            <path
              d="M29 28C30.2 29.6 33.8 29.6 35 28"
              stroke={stroke}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M43 20L48 15M46 24L52 23"
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        );
    }
  };

  return (
    <span
      role="img"
      aria-label={`Salón ${theme.label}`}
      className="inline-flex shrink-0 items-center justify-center rounded-[20px]"
      style={{
        width: size,
        height: size,
        background: theme.gradient,
        border: '3px solid #2A1B45',
        boxShadow: '0 4px 0 rgba(42, 27, 69, 0.18)',
      }}
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {artwork()}
      </svg>
    </span>
  );
};
