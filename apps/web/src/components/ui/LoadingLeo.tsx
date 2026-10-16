import loadingLeopard from '../../assets/brand/loading-leopard.webp';

interface LoadingLeoProps {
  /** Lo que lee el lector de pantalla; a la vista sólo va «Cargando…». */
  label?: string;
}

/** Leo caminando con su brújula mientras se carga una pantalla. */
export const LoadingLeo = ({ label = 'Cargando…' }: LoadingLeoProps) => (
  <div role="status" className="flex flex-col items-center">
    <img src={loadingLeopard} alt="" className="loading-leo h-[180px] w-auto" />
    <p aria-hidden className="mt-3 font-display text-[20px] text-ink-soft">
      Cargando…
    </p>
    <span className="sr-only">{label}</span>
  </div>
);
