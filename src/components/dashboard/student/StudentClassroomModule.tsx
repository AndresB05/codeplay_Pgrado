import type { ReactNode } from 'react';

const TeacherIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      stroke="#14857C"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke="#14857C"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const StudentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="9" r="2.5" stroke="#7C3AED" strokeWidth="1.8" />
    <circle cx="16" cy="10" r="2" stroke="#7C3AED" strokeWidth="1.8" />
    <path
      d="M3.5 18C4.1 15.8 6.02 14.5 8.5 14.5C10.98 14.5 12.9 15.8 13.5 18"
      stroke="#7C3AED"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13.5 17.5C13.92 16.15 15.14 15.25 16.75 15.25C18.36 15.25 19.58 16.15 20 17.5"
      stroke="#7C3AED"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MedalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3H11L12 6L13 3H16L14 8H10L8 3Z" fill="#0F948C" />
    <circle cx="12" cy="14" r="5" stroke="#0F948C" strokeWidth="1.8" />
    <path
      d="M12 11.6L12.7 13.05L14.3 13.2L13.1 14.3L13.45 15.85L12 15.1L10.55 15.85L10.9 14.3L9.7 13.2L11.3 13.05L12 11.6Z"
      fill="#0F948C"
    />
  </svg>
);

const WorldBadgeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.8" />
    <path d="M9.5 14L11.2 10.8L14.5 9.2L12.8 12.4L9.5 14Z" fill="white" />
  </svg>
);

const FireIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      stroke="#A46906"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type StudentRow = {
  id: string;
  initials: string;
  name: string;
  avatarTone: string;
  world: string;
  activity: string;
  streak: number | null;
};

const students: StudentRow[] = [
  {
    id: 's1',
    initials: 'E1',
    name: 'Estudiante 1',
    avatarTone: 'bg-[#EFE5FF] text-[#7C3AED]',
    world: 'Mundo 1',
    activity: 'hace 12 horas',
    streak: 42,
  },
  {
    id: 's2',
    initials: 'E2',
    name: 'Estudiante 2',
    avatarTone: 'bg-[#FFE8CC] text-[#C97A00]',
    world: 'Mundo 3',
    activity: 'hace 2 días',
    streak: 15,
  },
  {
    id: 's3',
    initials: '-',
    name: '-',
    avatarTone: 'bg-[#F5F1FB] text-[#B8AFC8]',
    world: '-',
    activity: '-',
    streak: null,
  },
  {
    id: 's4',
    initials: '-',
    name: '-',
    avatarTone: 'bg-[#F5F1FB] text-[#B8AFC8]',
    world: '-',
    activity: '-',
    streak: null,
  },
  {
    id: 's5',
    initials: '-',
    name: '-',
    avatarTone: 'bg-[#F5F1FB] text-[#B8AFC8]',
    world: '-',
    activity: '-',
    streak: null,
  },
];

const StatCard = ({
  icon,
  title,
  value,
  accentClass,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  accentClass: string;
}) => {
  return (
    <article
      className={`rounded-[16px] border border-[#E3DCEE] border-t-[3px] bg-white px-6 py-5 shadow-[0_8px_18px_rgba(124,58,237,0.04)] ${accentClass}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F3EEFD]">
          {icon}
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#7A728A]">
            {title}
          </p>
          <p className="mt-1 text-[20px] font-semibold text-[#231F2D]">{value}</p>
        </div>
      </div>
    </article>
  );
};

export const StudentClassroomModule = () => {
  return (
    <div className="px-4 py-4">
      <section className="px-2 pb-1">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[#6D42D9]">Salón 1A</h1>
        <div className="mt-2 flex items-center gap-2 text-[16px] text-[#14857C]">
          <TeacherIcon />
          <span>Profesor Sr. Robot</span>
        </div>
      </section>

      <section className="mt-7 grid grid-cols-1 gap-4 lg:max-w-[760px] lg:grid-cols-2">
        <StatCard
          icon={<StudentsIcon />}
          title="Total Estudiantes"
          value="24"
          accentClass="border-t-[#8B5CF6]"
        />
        <StatCard
          icon={<MedalIcon />}
          title="Promedio Nivel"
          value="Mundo 3"
          accentClass="border-t-[#0F948C]"
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-[18px] border border-[#E5DDF2] bg-white shadow-[0_8px_18px_rgba(124,58,237,0.04)]">
        <div className="grid grid-cols-[1.35fr_1fr_1fr_0.7fr] border-b border-[#EEE7F6] bg-[#FBF9FE] px-5 py-4 text-[14px] font-semibold text-[#6B637A]">
          <div>Estudiante</div>
          <div>Mundo actual</div>
          <div>Última actividad</div>
          <div>Racha</div>
        </div>

        <div>
          {students.map((student) => (
            <div
              key={student.id}
              className="grid grid-cols-[1.35fr_1fr_1fr_0.7fr] items-center border-b border-[#F0EAF8] px-5 py-5 text-[15px] text-[#231F2D] last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-[38px] w-[38px] items-center justify-center rounded-full text-[14px] font-semibold ${student.avatarTone}`}
                >
                  {student.initials}
                </div>
                <span className="font-medium">{student.name}</span>
              </div>

              <div>
                {student.world !== '-' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F948C] px-3 py-1 text-[12px] font-semibold text-white">
                    <WorldBadgeIcon />
                    {student.world}
                  </span>
                ) : (
                  <span className="text-[#8E88A0]">-</span>
                )}
              </div>

              <div className="text-[#5E576E]">{student.activity}</div>

              <div>
                {student.streak !== null ? (
                  <span className="inline-flex items-center gap-2 text-[16px] font-medium text-[#8A5905]">
                    <FireIcon />
                    {student.streak}
                  </span>
                ) : (
                  <span className="text-[#8E88A0]">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
