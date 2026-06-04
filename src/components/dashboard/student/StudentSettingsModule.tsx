import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useAuth } from '../../../hooks/useAuth';
import type { User } from '../../../types/user.types';

type StudentSettingsModuleProps = {
  user: User | null;
};

export const StudentSettingsModule = ({ user }: StudentSettingsModuleProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.fullName || 'ANDRÉS';
  const email = user?.email || 'andresblancoq05@gmail.com';

  const handleSignOut = async (): Promise<void> => {
    const didSignOut = await signOut();

    if (didSignOut) {
      navigate(ROUTES.LANDING);
    }
  };

  return (
    <div className="min-h-full bg-[#F6F3FA] px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-[980px]">
        <div className="rounded-[20px] border border-[#E5DDF2] bg-white px-6 py-7 shadow-[0_10px_24px_rgba(124,58,237,0.05)] sm:px-8 lg:px-10 lg:py-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-medium uppercase tracking-[0.08em] text-[#8B5CF6]">
                Cuenta
              </p>
              <h1 className="mt-2 text-[38px] font-semibold tracking-[-0.04em] text-[#231F2D] sm:text-[46px]">
                Mi Cuenta
              </h1>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-[48px] items-center justify-center rounded-full border border-[#F3C7C7] bg-[#FFF5F5] px-6 text-[15px] font-semibold text-[#D14343] transition-colors hover:bg-[#FFEDED]"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="mt-6">
          <section className="rounded-[20px] border border-[#E5DDF2] bg-white px-6 py-7 shadow-[0_10px_24px_rgba(124,58,237,0.05)] sm:px-8 lg:px-10">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#4A587C]">
              Detalles del usuario
            </h2>
            <div className="mt-4 h-px w-full bg-[#E6E0F0]" />

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-[118px] w-[118px] items-center justify-center rounded-full border-[4px] border-[#EFE7F8] bg-[radial-gradient(circle_at_top,_#5E626F_0%,_#24252E_95%)] text-[14px] font-medium text-white shadow-[0_12px_22px_rgba(45,40,55,0.16)]">
                Avatar
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[38px] font-semibold uppercase tracking-[0.02em] text-[#3E4E75]">
                  {displayName}
                </h3>
                <p className="mt-1 text-[18px] text-[#6C6C72]">Usuario Casero</p>

                <div className="mt-8 space-y-5">
                  <div>
                    <p className="text-[17px] font-semibold text-[#4A587C]">
                      Email / Nombre de Usuario
                    </p>
                    <p className="mt-2 text-[18px] text-[#3E4E75]">{email}</p>
                  </div>

                  <div>
                    <p className="text-[17px] font-semibold text-[#4A587C]">Rol</p>
                    <p className="mt-2 text-[18px] text-[#3E4E75]">
                      {user?.role === 'tutor' ? 'Tutor' : 'Estudiante'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-8 rounded-full border border-[#D9CFEA] bg-[#F8F5FD] px-5 py-2 text-[14px] font-semibold text-[#6D42D9] transition-colors hover:bg-[#F2ECFB]"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
