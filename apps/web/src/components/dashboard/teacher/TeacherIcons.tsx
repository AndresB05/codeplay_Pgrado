interface IconProps {
  active?: boolean;
}

export const GraduationIcon = ({ active = false }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

export const StudentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="9" r="2.5" stroke="#7B3FE4" strokeWidth="1.8" />
    <circle cx="16" cy="10" r="2" stroke="#7B3FE4" strokeWidth="1.8" />
    <path
      d="M3.5 18C4.1 15.8 6.02 14.5 8.5 14.5C10.98 14.5 12.9 15.8 13.5 18"
      stroke="#7B3FE4"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13.5 17.5C13.92 16.15 15.14 15.25 16.75 15.25C18.36 15.25 19.58 16.15 20 17.5"
      stroke="#7B3FE4"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const MedalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3H11L12 6L13 3H16L14 8H10L8 3Z" fill="#0C8577" />
    <circle cx="12" cy="14" r="5" stroke="#0C8577" strokeWidth="1.8" />
    <path
      d="M12 11.6L12.7 13.05L14.3 13.2L13.1 14.3L13.45 15.85L12 15.1L10.55 15.85L10.9 14.3L9.7 13.2L11.3 13.05L12 11.6Z"
      fill="#0C8577"
    />
  </svg>
);

export const PulseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 12H7L9.5 5L14.5 19L17 12H21"
      stroke="#D99A00"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SeatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 11V6.5C5 5.67 5.67 5 6.5 5H17.5C18.33 5 19 5.67 19 6.5V11"
      stroke="#1C6DC4"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4 11H20C20.55 11 21 11.45 21 12V16H3V12C3 11.45 3.45 11 4 11Z"
      stroke="#1C6DC4"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M5.5 16V19M18.5 16V19" stroke="#1C6DC4" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const UserIcon = () => (
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

export const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 17L15 12L10 7"
      stroke="#C72C2C"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 12H6" stroke="#C72C2C" strokeWidth="1.9" strokeLinecap="round" />
    <path
      d="M12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12"
      stroke="#C72C2C"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

export const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 6L8 12L14 18"
      stroke="#6D42D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChartIcon = ({ active = false }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 20V10M10 20V4M16 20V13M22 20H2"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

export const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.5" stroke="#7B3FE4" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.5" stroke="#7B3FE4" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.4" fill="#7B3FE4" />
  </svg>
);

export const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 5.5C4 4.67 4.67 4 5.5 4H11V19H5.5C4.67 19 4 18.33 4 17.5V5.5Z"
      stroke="#0C8577"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M20 5.5C20 4.67 19.33 4 18.5 4H13V19H18.5C19.33 19 20 18.33 20 17.5V5.5Z"
      stroke="#0C8577"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingsIcon = ({ active = false }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke={active ? '#FFFFFF' : '#2A1B45'} strokeWidth="1.9" />
    <path
      d="M12 3.5L13.4 5.9C13.9 6 14.4 6.2 14.8 6.5L17.4 5.8L19 8.6L17.1 10.4C17.2 10.9 17.2 11.4 17.1 11.9L19 13.7L17.4 16.5L14.8 15.8C14.4 16.1 13.9 16.3 13.4 16.4L12 18.8L10.6 16.4C10.1 16.3 9.6 16.1 9.2 15.8L6.6 16.5L5 13.7L6.9 11.9C6.8 11.4 6.8 10.9 6.9 10.4L5 8.6L6.6 5.8L9.2 6.5C9.6 6.2 10.1 6 10.6 5.9L12 3.5Z"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const InviteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.5" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3.5 19C4.4 16.3 6.7 15 9.5 15C11 15 12.4 15.4 13.5 16.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M18 14V20M15 17H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const ProgressIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 16L9 10.5L13 14L20 6.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 6.5H20V11.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 12.5L10 17.5L19 7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Birrete pequeño en verde azulado, usado junto al nombre del profesor. */
export const TeacherBadgeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      stroke="#0C8577"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke="#0C8577"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M6 7L6.8 18.6C6.9 19.4 7.5 20 8.3 20H15.7C16.5 20 17.1 19.4 17.2 18.6L18 7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 11V16M13.5 11V16"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);
