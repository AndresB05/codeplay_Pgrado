import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/*
 * Clase y no función, a diferencia del resto de componentes: React sólo permite
 * capturar errores de render con `componentDidCatch`, que no tiene hook.
 *
 * Sin esto un error inesperado deja la pantalla en blanco, sin mensaje ni salida.
 * Está por encima del router, así que el respaldo usa enlaces normales y no
 * `navigate`. Recargar arregla además el caso típico tras un despliegue: una
 * pestaña abierta que pide un trozo de la versión anterior que ya no existe.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no capturado en la interfaz', error, info.componentStack);
  }

  public render(): ReactNode {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <div className="jungle-surface flex min-h-screen items-center justify-center px-6 py-4">
        <section role="alert" className="card w-full max-w-[480px] px-8 py-10 text-center">
          <span className="chip chip-coral">Algo salió mal</span>
          <h1 className="title-xl mt-3">¡Ups! Nos perdimos en la selva</h1>
          <p className="subtitle mt-1">
            Ocurrió un error inesperado. Recarga la página para seguir donde estabas.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-grape w-full"
            >
              Recargar la página
            </button>
            <a href="/" className="btn btn-ghost w-full">
              Ir al inicio
            </a>
          </div>
        </section>
      </div>
    );
  }
}
