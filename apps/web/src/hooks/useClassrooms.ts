import { useContext } from 'react';
import { ClassroomsContext } from '../context/ClassroomsContext';
import type { ClassroomsContextValue } from '../context/ClassroomsContext';

export const useClassrooms = (): ClassroomsContextValue => {
  const context = useContext(ClassroomsContext);

  if (!context) {
    throw new Error('useClassrooms debe usarse dentro de ClassroomsProvider.');
  }

  return context;
};
