import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { SectionContainer } from './shared';

const centerLinks = [
  { label: 'Recursos', href: '#como-aprender' },
  { label: 'Tutor', href: '#tutores' },
  { label: 'Inicio', to: ROUTES.LANDING },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E5DEEF] bg-[#F6F3FA]/95 backdrop-blur-sm">
      <SectionContainer className="flex h-[70px] items-center justify-between gap-4">
        <Link
          to={ROUTES.LANDING}
          className="text-[22px] font-semibold tracking-[-0.03em] text-[#6D28D9] sm:text-[24px]"
        >
          Codeplay
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {centerLinks.map((item) => {
            const active = 'to' in item && location.pathname === item.to;

            return 'href' in item ? (
              <a
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-[#3F394A]"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`relative pb-[7px] text-[13px] font-medium ${active ? 'text-[#6D28D9]' : 'text-[#3F394A]'}`}
              >
                {item.label}
                {active ? (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#6D28D9]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-8 md:flex">
          <Link to={ROUTES.LOGIN} className="text-[13px] font-medium text-[#8B5CF6]">
            Login
          </Link>
          <Link to={ROUTES.SIGNUP} className="text-[13px] font-medium text-[#2F283A]">
            Regístrate
          </Link>
          {import.meta.env.DEV ? (
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('dev:skipAuth', '1');
                navigate(ROUTES.DASHBOARD);
              }}
              className="rounded-md bg-[#F3E8FF] px-3 py-1 text-[13px] font-medium text-[#6D28D9]"
            >
              Entrar sin login
            </button>
          ) : null}
        </div>

        <div className="md:hidden text-[13px] font-medium text-[#6D28D9]">Inicio</div>
      </SectionContainer>
    </header>
  );
};
