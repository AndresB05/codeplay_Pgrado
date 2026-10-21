export const CompassIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.5" stroke={active ? '#FFFFFF' : '#2A1B45'} strokeWidth="2.4" />
    <path
      d="M9.6 14.4L11.4 10.2L15.6 8.4L13.8 12.6L9.6 14.4Z"
      fill={active ? '#FFC93C' : '#7B3FE4'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const TrophyIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 4H15.5V9C15.5 10.93 13.93 12.5 12 12.5C10.07 12.5 8.5 10.93 8.5 9V4Z"
      fill={active ? '#FFC93C' : '#FFE29A'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 5.5H6.3C5.3 5.5 4.5 6.3 4.5 7.3C4.5 9.5 6.3 11.3 8.5 11.3M15.5 5.5H17.7C18.7 5.5 19.5 6.3 19.5 7.3C19.5 9.5 17.7 11.3 15.5 11.3"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M12 12.5V17M8.5 20H15.5"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export const GraduationIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      fill={active ? '#FFC93C' : '#D6F7F3'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const CubeIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
      fill={active ? '#FFC93C' : '#F0E6FF'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M4 7.5L12 12L20 7.5M12 12V21"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </svg>
);
