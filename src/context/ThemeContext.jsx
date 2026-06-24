import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode') || localStorage.getItem('theme');
    if (['light', 'dark', 'sepia', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'mint', 'lavender', 'peach', 'rose', 'clay', 'kitty', 'midnight', 'custom'].includes(savedTheme)) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [customColors, setCustomColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customThemeColors') || '{}');
    } catch (e) {
      return {};
    }
  });

  const updateCustomColors = (newColors) => {
    localStorage.setItem('customThemeColors', JSON.stringify(newColors));
    setCustomColors(newColors);
    // Force re-renders for theme propagation
    setThemeMode((prev) => (prev === 'custom' ? 'custom' : prev));
  };

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('theme', themeMode); // fallback for older code
    document.documentElement.setAttribute('data-theme', themeMode);
    
    let isDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'midnight'].includes(themeMode);
    if (themeMode === 'custom') {
      isDark = !!customColors.isDark;
    }
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [themeMode, customColors]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const isCurrentlyDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'midnight'].includes(prev);
      return isCurrentlyDark ? 'light' : 'dark';
    });
  };

  const currentTheme = useMemo(() => buildTheme(themeMode), [themeMode, customColors]);
  
  const isDarkMode = useMemo(() => {
    if (themeMode === 'custom') {
      return !!customColors.isDark;
    }
    return ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'midnight'].includes(themeMode);
  }, [themeMode, customColors]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme, customColors, updateCustomColors }}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
