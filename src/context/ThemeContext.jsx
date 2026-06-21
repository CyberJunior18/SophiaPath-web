import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode') || localStorage.getItem('theme');
    if (['light', 'dark', 'sepia', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'mint', 'lavender', 'peach', 'rose', 'clay'].includes(savedTheme)) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('theme', themeMode); // fallback for older code
    document.documentElement.setAttribute('data-theme', themeMode);
    
    const isDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic'].includes(themeMode);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const isCurrentlyDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic'].includes(prev);
      return isCurrentlyDark ? 'light' : 'dark';
    });
  };

  const currentTheme = useMemo(() => buildTheme(themeMode), [themeMode]);
  const isDarkMode = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic'].includes(themeMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme }}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
