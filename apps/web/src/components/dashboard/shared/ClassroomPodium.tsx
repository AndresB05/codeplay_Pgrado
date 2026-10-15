import { useState } from 'react';
import mountains from '../../../assets/brand/podium-mountains.webp';
import treasureTrail from '../../../assets/brand/podium-treasure-trail.webp';
import miniMap1 from '../../../assets/brand/podium-minimap-1.webp';
import miniMap2 from '../../../assets/brand/podium-minimap-2.webp';
import miniMap3 from '../../../assets/brand/podium-minimap-3.webp';
import sealBronze from '../../../assets/brand/podium-seal-bronze.webp';
import sealGold from '../../../assets/brand/podium-seal-gold.webp';
import sealSilver from '../../../assets/brand/podium-seal-silver.webp';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { podiumRanking } from './podiumRanking';

const PLACES = [
  {
    label: '1.º',
    medal: '🥇',
    seal: sealGold,
    height: 'h-[120px]',
    mapHeight: 'h-[140px]',
    block: 'bg-sun',
    text: 'text-ink',
  },
  {
    label: '2.º',
    medal: '🥈',
    seal: sealSilver,
    height: 'h-[88px]',
    mapHeight: 'h-[108px]',
    block: 'bg-line',
    text: 'text-ink',
  },
  {
    label: '3.º',
    medal: '🥉',
    seal: sealBronze,
    height: 'h-[64px]',
    mapHeight: 'h-[84px]',
    block: 'bg-papaya',
    text: 'text-white',
  },
];

/* El orden olímpico: el primero en el centro, el segundo a su izquierda. */
const VISUAL_ORDER = [1, 0, 2];

/*
 * Mapas sueltos que asoman por detrás del pergamino, como un montón apilado:
 * los dos pergaminos de la aplicación alternados, para que no parezcan copias,
 * y con el mapa de dentro elegido a mano para que dos vecinos nunca lo repitan.
 * Llenan el hueco que deja la tarjeta al no ocupar todo el ancho, así que sólo
 * salen cuando ese hueco existe: por debajo de 1520 px la tarjeta ya llena la
 * columna y saldrían de la pantalla.
 */
const LOOSE_MAPS = [
  {
    sheet: 'map-sheet',
    map: miniMap1,
    place: 'left-[-100px] top-[80px] h-[140px] w-[160px] -rotate-[25deg]',
  },
  {
    sheet: 'podium-scroll',
    map: miniMap2,
    place: 'left-[-115px] top-[210px] h-[240px] w-[160px] -rotate-[18deg]',
  },
  {
    sheet: 'map-sheet',
    map: miniMap1,
    place: 'right-[-90px] top-[160px] h-[260px] w-[170px] rotate-[22deg]',
  },
  {
    sheet: 'map-sheet',
    map: miniMap2,
    place: 'right-[60px] top-[-28px] h-[150px] w-[200px] rotate-[12deg]',
  },
  {
    sheet: 'map-sheet',
    map: miniMap3,
    place: 'bottom-[-50px] left-[40px] h-[120px] w-[260px] -rotate-[3deg]',
  },
  // Éste va por delante del pergamino del podio, como si lo hubieran dejado encima.
  {
    sheet: 'podium-scroll',
    map: miniMap3,
    place: 'bottom-0 right-[-48px] h-[165px] w-[230px] rotate-[12deg]',
    front: true,
  },
];

interface ClassroomPodiumProps {
  students: ClassroomStudent[];
  /** `map`: sobre su propio pergamino, con escalones a tinta y sellos de lacre. */
  variant?: 'card' | 'map';
}

/**
 * Los tres exploradores con más XP del salón. No se pinta si nadie ha ganado
 * nada todavía: un podio de ceros premiaría el orden alfabético.
 */
export const ClassroomPodium = ({ students, variant = 'card' }: ClassroomPodiumProps) => {
  const ranking = podiumRanking(students);
  const [shaking, setShaking] = useState(false);

  /*
   * El secreto del podio: el mapa de la esquina sacude el montón entero. No se
   * relanza a media sacudida —pulsando seguido se volvía un baile sin fin— y
   * con movimiento reducido no hace nada, como el confeti de los trofeos.
   */
  const shakeMaps = (): void => {
    if (shaking || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    setShaking(true);
  };

  if (ranking.length === 0) {
    return null;
  }

  const onMap = variant === 'map';

  return (
    <section
      className={
        onMap
          ? 'relative isolate mx-auto mt-6 max-w-[920px] px-5 pb-12 pt-8 sm:px-10'
          : 'card mt-6 px-5 pb-0 pt-5'
      }
    >
      {onMap ? (
        <>
          {LOOSE_MAPS.map(({ sheet, map, place, front }, index) => {
            const className = `${sheet} loose-map absolute hidden min-[1520px]:block ${
              front ? '-z-[5] cursor-pointer bg-transparent p-0' : 'pointer-events-none -z-20'
            } ${shaking ? 'loose-map-shake' : ''} ${place}`;
            // Cada papel empieza un poco después que el anterior: se mueve el montón, no un bloque.
            const style = shaking ? { animationDelay: `${index * 70}ms` } : undefined;
            const onAnimationEnd =
              index === LOOSE_MAPS.length - 1 ? () => setShaking(false) : undefined;
            const drawing = (
              <img src={map} alt="" className="h-full w-full object-contain opacity-80" />
            );

            /*
             * Un botón fuera del teclado y del lector de pantalla: es un huevo de
             * pascua, no una acción más de la página.
             */
            return front ? (
              <button
                key={place}
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={shakeMaps}
                onAnimationEnd={onAnimationEnd}
                className={className}
                style={style}
              >
                {drawing}
              </button>
            ) : (
              <div
                key={place}
                aria-hidden
                onAnimationEnd={onAnimationEnd}
                className={className}
                style={style}
              >
                {drawing}
              </div>
            );
          })}
          <div aria-hidden className="podium-scroll pointer-events-none absolute inset-0 -z-10" />
          {/*
           * El camino al tesoro a la derecha, aunque el papel de la esquina lo
           * tape en parte, y sus montes y palmeras solos a la izquierda. Sólo con
           * la tarjeta a su ancho máximo: más estrecha, pisarían el podio.
           */}
          <img
            src={treasureTrail}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-[50px] top-[60px] -z-[8] hidden h-[300px] opacity-90 min-[1310px]:block"
          />
          <img
            src={mountains}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-[50px] top-[230px] -z-[8] hidden w-[180px] opacity-90 min-[1310px]:block"
          />
        </>
      ) : null}

      <h2
        className={onMap ? 'font-map text-[36px] font-bold leading-tight text-sepia' : 'title-lg'}
      >
        Podio del salón
      </h2>
      <p className={onMap ? 'font-map text-[17px] font-normal text-sepia-soft' : 'subtitle mt-1'}>
        Los tres exploradores con más experiencia.
      </p>

      {/*
       * En el pergamino los escalones crecen 20 px y el hueco de encima los cede,
       * y el podio sube 12 px más para quedar centrado en el papel: lo que sube
       * arriba lo gana el margen de abajo, así que la tarjeta no cambia de alto.
       */}
      <ol className={`${onMap ? '-mt-2' : 'mt-6'} flex items-end justify-center gap-3 sm:gap-5`}>
        {VISUAL_ORDER.filter((place) => place < ranking.length).map((place) => {
          const student = ranking[place];
          const style = PLACES[place];

          return (
            <li key={student.id} className="flex w-[110px] flex-col items-center sm:w-[150px]">
              {onMap ? (
                <img src={style.seal} alt="" aria-hidden="true" className="h-[40px] w-[40px]" />
              ) : (
                <span className="text-[28px]" aria-hidden="true">
                  {style.medal}
                </span>
              )}
              <div
                className="mt-1 h-[52px] w-[52px] overflow-hidden rounded-full border-[3px] border-ink"
                aria-hidden="true"
              >
                <img
                  src={pickMascotAvatar(student.id, student.name)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              {/* En el pergamino el nombre baja a dos líneas: cortado, «Andrés Blanco Quiño…» no se podía leer. */}
              <span
                className={`mt-2 w-full text-center ${
                  onMap
                    ? 'line-clamp-2 break-words font-map text-[18px] font-normal leading-tight text-sepia'
                    : 'truncate font-bold text-ink'
                }`}
              >
                {student.name}
              </span>
              <span
                className={
                  onMap
                    ? 'font-map text-[16px] font-normal text-sepia-soft'
                    : 'font-display text-[14px] text-ink-soft'
                }
              >
                {student.xp} XP
              </span>

              <div
                className={`mt-2 flex w-full items-start justify-center ${
                  onMap
                    ? `podium-block ${style.mapHeight} font-map text-[30px] font-normal leading-none text-sepia`
                    : `${style.height} rounded-t-[16px] border-[3px] border-b-0 border-ink pt-2 font-display text-[24px] ${style.block} ${style.text}`
                }`}
              >
                <span className="sr-only">Puesto </span>
                {style.label}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
