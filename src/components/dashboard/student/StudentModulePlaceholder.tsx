type StudentModulePlaceholderProps = {
  title: string;
  description: string;
};

export const StudentModulePlaceholder = ({ title, description }: StudentModulePlaceholderProps) => {
  return (
    <div className="px-8 py-8">
      <div className="rounded-[28px] border border-[#E8E1F3] bg-white p-8 shadow-[0_10px_26px_rgba(124,58,237,0.06)]">
        <h2 className="text-[36px] font-semibold tracking-[-0.03em] text-[#6D42D9]">{title}</h2>
        <p className="mt-4 max-w-[720px] text-[18px] leading-[1.8] text-[#6F687C]">{description}</p>
        <div className="mt-8 flex h-[280px] items-center justify-center rounded-[22px] border border-dashed border-[#D8CEE8] bg-[#F8F5FD] text-[16px] font-medium text-[#9D90B2]">
          Contenido del módulo próximamente
        </div>
      </div>
    </div>
  );
};
