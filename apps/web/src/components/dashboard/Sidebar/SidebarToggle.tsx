interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** La pestaña que asoma del borde derecho de la barra y la pliega o despliega. */
export const SidebarToggle = ({ collapsed, onToggle }: SidebarToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={collapsed ? 'Mostrar la barra lateral' : 'Ocultar la barra lateral'}
    aria-expanded={!collapsed}
    title={collapsed ? 'Mostrar la barra lateral' : 'Ocultar la barra lateral'}
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
