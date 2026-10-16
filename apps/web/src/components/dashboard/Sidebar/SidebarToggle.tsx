import logSlice from '../../../assets/brand/sidebar-toggle-log-outlined.webp';

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  /** La del niño es una rodaja del tronco de su barra; la del tutor sigue blanca. */
  wooden?: boolean;
}

/** La pestaña que asoma del borde derecho de la barra y la pliega o despliega. */
export const SidebarToggle = ({ collapsed, onToggle, wooden = false }: SidebarToggleProps) => {
  const label = collapsed ? 'Mostrar la barra lateral' : 'Ocultar la barra lateral';

  if (wooden) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        title={label}
        className="absolute -right-[24px] top-5 z-10 h-[48px] w-[48px] drop-shadow-[0_3px_0_rgba(74,42,18,0.45)] transition-transform duration-200 hover:scale-110 motion-reduce:transition-none"
      >
        {/* Plegada, la rodaja entera da media vuelta y la flecha tallada apunta al otro lado. */}
        <img
          src={logSlice}
          alt=""
          className={`h-full w-full transition-transform duration-300 motion-reduce:transition-none ${
            collapsed ? 'rotate-180' : ''
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      className="absolute -right-[17px] top-6 z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full border-[3px] border-ink bg-white text-ink shadow-[0_3px_0_rgba(42,27,69,0.2)] transition-colors hover:bg-cream"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={collapsed ? 'rotate-180' : ''}
      >
        <path
          d="M15 5L8 12L15 19"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
