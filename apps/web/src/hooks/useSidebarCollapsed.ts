import { useCallback, useState } from 'react';
import { readSidebarCollapsed, saveSidebarCollapsed } from '../context/sidebar.helpers';

export const useSidebarCollapsed = (): [boolean, () => void] => {
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      saveSidebarCollapsed(!current);

      return !current;
    });
  }, []);

  return [collapsed, toggle];
};
