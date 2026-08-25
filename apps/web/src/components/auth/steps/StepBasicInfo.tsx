import { Input } from '../../ui/Input';

interface StepBasicInfoProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  errors?: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export const StepBasicInfo = ({
  fullName,
  email,
  password,
  confirmPassword,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  errors,
}: StepBasicInfoProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nombre completo"
        type="text"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        error={errors?.fullName}
        placeholder="Tu nombre"
      />
      <Input
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        error={errors?.email}
        placeholder="tu@ejemplo.com"
      />
      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        error={errors?.password}
        placeholder="••••••••"
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        error={errors?.confirmPassword}
        placeholder="••••••••"
      />
    </div>
  );
};
