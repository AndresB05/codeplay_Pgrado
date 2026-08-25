import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

interface SidebarNavProps {
  activeRoute: string;
}

export const SidebarNav = ({ activeRoute }: SidebarNavProps) => {
  const navigate = useNavigate();

  const navItems = [
    { route: ROUTES.WORLDS, label: 'Mundos', icon: '🌍' },
    { route: ROUTES.TROPHY_ROOM, label: 'Sala de Trofeos', icon: '🏆' },
    { route: ROUTES.CLASSROOM, label: 'Salón de clases', icon: '📚' },
    { route: ROUTES.SETTINGS, label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <button
          key={item.route}
          onClick={() => navigate(item.route)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activeRoute === item.route
              ? 'bg-primary text-white'
              : 'text-neutral-light hover:bg-neutral-dark'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
