import type { InputHTMLAttributes, ReactNode } from 'react';

type SignupFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
};

export const SignupField = ({
  label,
  error,
  rightElement,
  className = '',
  ...props
}: SignupFieldProps) => {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-[13px] font-semibold text-[#231F2D]">{label}</span>
      ) : null}
      <span className="relative block">
        <input
          {...props}
          className={`h-[46px] w-full rounded-[10px] border border-[#E8E1F3] bg-[#F8F5FD] px-4 text-[14px] text-[#2F2938] outline-none transition-colors placeholder:text-[#A79CB9] focus:border-[#8B5CF6] ${rightElement ? 'pr-12' : ''} ${className}`}
        />
        {rightElement ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8D83A1]">
            {rightElement}
          </span>
        ) : null}
      </span>
      {error ? <span className="mt-2 block text-[12px] text-[#DC2626]">{error}</span> : null}
    </label>
  );
};
