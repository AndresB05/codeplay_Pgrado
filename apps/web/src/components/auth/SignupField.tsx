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
      {label ? <span className="field-label mb-2 block">{label}</span> : null}

      <span className="relative block">
        <input {...props} className={`field ${rightElement ? 'pr-12' : ''} ${className}`} />
        {rightElement ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink-faint">
            {rightElement}
          </span>
        ) : null}
      </span>

      {error ? (
        <span className="mt-2 block text-[13px] font-bold text-coral-dark">{error}</span>
      ) : null}
    </label>
  );
};
