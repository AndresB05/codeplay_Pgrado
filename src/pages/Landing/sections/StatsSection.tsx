export const StatsSection = () => {
  const worlds = [
    {
      name: 'La Selva de las Secuencias',
      description: 'Aprende sobre secuencias y orden de ejecución',
      color: '#855CD6',
    },
    {
      name: 'El Espacio de los Bucles',
      description: 'Domina los bucles y repeticiones',
      color: '#4ECDC4',
    },
    {
      name: 'El Océano Condicional',
      description: 'Toma decisiones con condicionales',
      color: '#FFB840',
    },
  ];

  return (
    <div className="container mx-auto px-8 py-16">
      <h2 className="text-4xl font-bold text-neutral text-center mb-12">Explora mundos mágicos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {worlds.map((world, index) => (
          <div
            key={index}
            className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-white"
            style={{ backgroundColor: world.color }}
          >
            <h3 className="text-2xl font-bold mb-3">{world.name}</h3>
            <p className="opacity-90">{world.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gradient-to-r from-tertiary/10 to-primary/10 rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold text-neutral mb-4">Monitorea su progreso fácilmente</h2>
        <p className="text-neutral-light text-lg mb-6">
          Padres y tutores pueden acompañar el aprendizaje de los exploradores
        </p>
        <button className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-lg transition-all">
          Conoce más para tutores
        </button>
      </div>
    </div>
  );
};
