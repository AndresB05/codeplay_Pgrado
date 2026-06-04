import type { ReactNode } from 'react';

type SignupRoleCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  placeholderLabel: string;
  accentClassName: string;
  titleClassName: string;
  buttonClassName: string;
  onSelect: () => void;
  icon?: ReactNode;
};

export const SignupRoleCard = ({
  title,
  description,
  buttonLabel,
  placeholderLabel,
  accentClassName,
  titleClassName,
  buttonClassName,
  onSelect,
}: SignupRoleCardProps) => {
  return (
    <article className={`overflow-hidden rounded-[18px] border border-[#E8E1F3] bg-white shadow-[0_12px_32px_rgba(124,58,237,0.08)] ${accentClassName}`}>
      <div className="flex h-[180px] w-full items-center justify-center border-b border-[#EFE8F7] bg-[#F8F5FD] text-[14px] font-medium text-[#A195B7]">
        {placeholderLabel}
      </div>

      <div className="px-8 pb-8 pt-6 text-center">
        <h3 className={`text-[21px] font-semibold ${titleClassName}`}>{title}</h3>
        <p className="mx-auto mt-4 max-w-[290px] text-[14px] leading-[1.9] text-[#6F687C]">
          {description}
        </p>

        <button
          type="button"
          onClick={onSelect}
          className={`mt-7 inline-flex h-[48px] w-full items-center justify-center rounded-full text-[14px] font-semibold transition-transform duration-150 hover:scale-[1.01] ${buttonClassName}`}
        >
          {buttonLabel}
          <span className="ml-2">→</span>
        </button>
      </div>
    </article>
  );
};
