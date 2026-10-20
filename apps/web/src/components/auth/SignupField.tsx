import type { InputHTMLAttributes, ReactNode } from 'react';

type SignupFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
  /** `tutor`: el campo y la etiqueta del panel del tutor. El acceso y el registro también montan este campo, sin la prop. */
  variant?: 'default' | 'tutor';
};

export const SignupField = ({
  label,
  error,
  rightElement,
  className = '',
  variant = 'default',
  ...props
}: SignupFieldProps) => {
  const tutor = variant === 'tutor';

  return (
    <label className="block">
      {label ? (
        <span
          className={
            tutor
              ? 'mb-1.5 block text-[13.5px] font-medium text-tutor-ink-soft'
              : 'field-label mb-2 block'
          }
        >
          {label}
        </span>
      ) : null}

      <span className="relative block">
        <input
          {...props}
          className={`${tutor ? 'tutor-field' : 'field'} ${rightElement ? 'pr-12' : ''} ${className}`}
        />
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
