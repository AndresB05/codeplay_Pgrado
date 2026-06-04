import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { User } from '../../../types/user.types';

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      stroke="#9A6500"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="3.5" stroke="#5B5567" strokeWidth="1.9" />
    <path
      d="M5 19C6.4 16.67 8.89 15.5 12 15.5C15.11 15.5 17.6 16.67 19 19"
      stroke="#5B5567"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="9" stroke="#5B5567" strokeWidth="1.9" />
  </svg>
);

type StudentTopBarProps = {
  user: User | null;
};

export const StudentTopBar = ({ user }: StudentTopBarProps) => {
  const navigate = useNavigate();
  const streakDays = user?.streakDays || 42;

  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[#E5DDF2] bg-[#F6F3FA] px-4">
      <button
        type="button"
        onClick={() => navigate(ROUTES.WORLDS)}
        className="text-[34px] font-semibold tracking-[-0.04em] text-[#6D42D9]"
      >
        Codeplay
      </button>

      <div className="flex items-center gap-4">
        <div className="flex h-[44px] items-center gap-2 rounded-full bg-[#FFF2DE] px-4 text-[16px] font-medium text-[#8A5905]">
          <FireIcon />
          <span>{streakDays}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#ECE7F8]"
          aria-label="Perfil"
        >
          <UserIcon />
        </button>
      </div>
    </header>
  );
};
