import { Canvas } from '@react-three/fiber';

/*
 * El único hexadecimal del juego, y va aquí por lo mismo que en los iconos SVG:
 * un material de three recibe un color, no una clase de Tailwind. Es el `grape`
 * del tema, duplicado a mano desde tailwind.config.js.
 */
const CUBE_COLOR = '#7B3FE4';

/*
 * El cubo del J1 no es el personaje ni una casilla: es la prueba de que el
 * motor 3D dibuja dentro de la aplicación. La rejilla y el personaje son el J2,
 * y el paso de rejilla será la constante 1,0 — nunca deducido de un modelo.
 */
export const GameScene = () => (
  <Canvas camera={{ position: [3.2, 2.8, 3.2], fov: 45 }}>
    <directionalLight position={[4, 6, 3]} intensity={2.6} />

    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={CUBE_COLOR} />
    </mesh>
  </Canvas>
);
