import logo from '../../assets/brand/logo.webp';

/*
 * `alt` vacío a propósito: el logo va siempre junto a la palabra «CodePlay», y
 * con texto alternativo el lector de pantalla lo diría dos veces.
 */
export const BrandLogo = ({ size }: { size: number }) => (
  <img src={logo} alt="" width={size} height={size} className="shrink-0" />
);
