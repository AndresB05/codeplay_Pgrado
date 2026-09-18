import { useEffect } from 'react';
import { useClassrooms } from './useClassrooms';

/**
 * Pone al día los salones al abrirse una pantalla que los muestra.
 *
 * Hace falta porque `ClassroomsProvider` vive en la raíz y **no se desmonta al
 * navegar dentro de la aplicación**: ir de Ajustes al panel no volvía a leer
 * nada, así que el tutor veía lo que hubiera cuando arrancó la aplicación. Lo
 * que ocurre entre medias tampoco llega por la suscripción: el progreso no
 * puede publicarse, y el motivo está en `ClassroomsContext`.
 *
 * Se salta la consulta si el store ya está cargando, que es el caso de entrar
 * directamente a esta ruta: ahí la carga del provider ya viene en camino y
 * pedirla otra vez serían dos consultas para lo mismo.
 */
export const useFreshClassrooms = (): void => {
  const { loading, refreshSilently } = useClassrooms();

  useEffect(() => {
    if (loading) {
      return;
    }

    void refreshSilently();
    /*
     * `loading` queda FUERA de las dependencias a propósito: está sólo para
     * decidir si esta apertura concreta consulta, y dejarlo dentro volvería a
     * consultar cada vez que una carga termina, que es justo lo que acaba de
     * traer el dato.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSilently]);
};
