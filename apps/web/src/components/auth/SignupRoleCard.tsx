export type RoleCardTone = 'grape' | 'papaya';

type SignupRoleCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  image: string;
  tone: RoleCardTone;
  onSelect: () => void;
};

const TONE_STYLES: Record<RoleCardTone, { gradient: string; button: string; chip: string }> = {
  grape: {
    gradient: 'linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)',
    button: 'btn-sun',
    chip: 'chip-grape',
  },
  papaya: {
    gradient: 'linear-gradient(135deg, #FFB27A 0%, #FF8A3D 100%)',
    button: 'btn-papaya',
    chip: 'chip-papaya',
  },
};

export const SignupRoleCard = ({
  title,
  description,
  buttonLabel,
  image,
  tone,
  onSelect,
}: SignupRoleCardProps) => {
  const styles = TONE_STYLES[tone];

  return (
    <article className="card overflow-hidden">
      <div className="relative h-[180px] w-full overflow-hidden" style={{ background: styles.gradient }}>
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="px-8 pb-8 pt-6 text-center">
        <span className={`chip ${styles.chip}`}>{title}</span>

        <p className="mx-auto mt-4 max-w-[300px] text-[15px] font-semibold leading-[1.7] text-ink-soft">
          {description}
        </p>

        <button type="button" onClick={onSelect} className={`btn ${styles.button} mt-7 w-full`}>
          {buttonLabel}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
};
