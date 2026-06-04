import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-8 py-16">
      <div className="flex items-center justify-between gap-12">
        <div className="flex-1">
          <h1 className="text-5xl font-bold text-neutral mb-6">¡Aprender a programar jugando!</h1>
          <p className="text-xl text-neutral-light mb-8">
            CodePlay es una plataforma educativa gamificada donde niños y jóvenes pueden aprender
            programación de forma divertida e interactiva.
          </p>
          <button
            onClick={() => navigate(ROUTES.SIGNUP)}
            className="bg-secondary hover:bg-secondary-dark text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Inicia tu aventura
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-96 h-96 bg-primary/10 rounded-3xl flex items-center justify-center">
            <span className="text-9xl">🐆</span>
          </div>
        </div>
      </div>
    </div>
  );
};
