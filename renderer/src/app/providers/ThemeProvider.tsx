import React, { createContext, useContext, useEffect, useState } from 'react';
import { ipc } from '@/shared/api/ipc';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    ipc.settings.get('theme', 'dark').then(t => {
      applyTheme((t as Theme) || 'dark');
    });
  }, []);

  function applyTheme(t: Theme) {
    document.documentElement.dataset.theme = t;
    setThemeState(t);
    ipc.settings.set('theme', t);
    ipc.titlebar.setTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
