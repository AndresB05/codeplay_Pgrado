import { useCallback, useState } from 'react';
import {
  readTeacherGroupsView,
  saveTeacherGroupsView,
  type TeacherGroupsView,
} from '../context/sidebar.helpers';

export const useTeacherGroupsView = (): [
  TeacherGroupsView | null,
  (view: TeacherGroupsView) => void,
] => {
  const [view, setView] = useState(readTeacherGroupsView);

  const choose = useCallback((next: TeacherGroupsView) => {
    saveTeacherGroupsView(next);
    setView(next);
  }, []);

  return [view, choose];
};
