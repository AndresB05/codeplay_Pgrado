export const HowItWorksSection = () => {
  const steps = [
    {
      icon: '🧩',
      title: 'Bloques Lógicos',
      description: 'Arrastra y suelta bloques de código para crear programas',
    },
    {
      icon: '🎯',
      title: 'Resuelve Retos',
      description: 'Completa misiones y gana recompensas mientras aprendes',
    },
    {
      icon: '🏆',
      title: 'Gana Recompensas',
      description: 'Desbloquea logros y sube de nivel en tu aventura',
    },
  ];

  return (
    <div className="container mx-auto px-8 py-16">
      <h2 className="text-4xl font-bold text-neutral text-center mb-12">¿Cómo aprender?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-6xl mb-4">{step.icon}</div>
            <h3 className="text-2xl font-bold text-neutral mb-3">{step.title}</h3>
            <p className="text-neutral-light">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
