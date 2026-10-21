import { useCallback, useState } from 'react';
import { readTeacherGroupsFolded, saveTeacherGroupsFolded } from '../context/sidebar.helpers';

export const useTeacherGroupsFolded = (): [boolean, () => void] => {
  const [folded, setFolded] = useState(readTeacherGroupsFolded);

  const toggle = useCallback(() => {
    setFolded((current) => {
      saveTeacherGroupsFolded(!current);

      return !current;
    });
  }, []);

  return [folded, toggle];
};
