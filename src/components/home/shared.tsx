import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionContainer = ({ children, className = '' }: ContainerProps) => {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-4 ${className}`}>
      {children}
    </div>
  );
};

type PlaceholderProps = {
  className?: string;
  rounded?: string;
};

export const ImagePlaceholder = ({
  className = '',
  rounded = 'rounded-[18px]',
}: PlaceholderProps) => {
  return (
    <div
      aria-label="placeholder"
      className={`border border-[#DDD5E8] bg-white ${rounded} ${className}`}
    />
  );
};

export const LevelBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex h-[24px] items-center rounded-full bg-[#7C3AED] px-3 text-[11px] font-semibold leading-none text-white shadow-[0_6px_14px_rgba(124,58,237,0.18)]">
      {children}
    </span>
  );
};

export const InfoBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center rounded-full border border-[#C7B4EE] bg-white px-4 py-[5px] text-[11px] font-semibold text-[#7C3AED]">
      {children}
    </span>
  );
};

export const CheckBullet = () => {
  return (
    <span className="mt-[4px] inline-block h-[16px] w-[16px] rounded-full border border-[#8B5CF6]">
      <span className="mx-auto mt-[3px] block h-[6px] w-[6px] rounded-full bg-[#8B5CF6]" />
    </span>
  );
};
