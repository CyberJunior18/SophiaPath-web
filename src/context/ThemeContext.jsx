import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '../theme/theme';

const hexToRgb = (color) => {
  if (!color) return '';
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return `${match[0]}, ${match[1]}, ${match[2]}`;
    }
  }
  const cleanHex = color.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0].repeat(2), 16);
    const g = parseInt(cleanHex[1].repeat(2), 16);
    const b = parseInt(cleanHex[2].repeat(2), 16);
    return `${r}, ${g}, ${b}`;
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '';
};

const isColorDark = (hexColor) => {
  if (!hexColor) return false;
  const cleanHex = hexColor.replace('#', '');
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0].repeat(2), 16);
    g = parseInt(cleanHex[1].repeat(2), 16);
    b = parseInt(cleanHex[2].repeat(2), 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return false;
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
};

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
    const rootStyle = document.documentElement.style;
    
    if (themeMode === 'custom') {
      const bgDefault = customColors.bgDefault || '#F5F7FA';
      isDark = isColorDark(bgDefault);
      const primaryMain = customColors.primaryMain || '#3D5CFF';
      const primaryDark = customColors.primaryDark || '#2E49D1';
      const primaryLight = customColors.primaryLight || '#7C8DFF';
      const bgPaper = customColors.bgPaper || '#FFFFFF';
      const bgPaperAlt = customColors.bgPaperAlt || '#F0F4F8';
      const textPrimary = customColors.textPrimary || '#2D2D4D';
      const textSecondary = customColors.textSecondary || '#64748b';
      const divider = customColors.divider || '#3d5cff15';
      const codeBg = customColors.codeBg || '#f8f9fa';

      const primaryMainRgb = hexToRgb(primaryMain);
      const primaryDarkRgb = hexToRgb(primaryDark);
      const dividerRgb = hexToRgb(divider);
      const bgPaperRgb = hexToRgb(bgPaper);
      const textPrimaryRgb = hexToRgb(textPrimary);
      const textSecondaryRgb = hexToRgb(textSecondary);

      rootStyle.setProperty('--primary-main', primaryMain);
      rootStyle.setProperty('--primary-dark', primaryDark);
      rootStyle.setProperty('--primary-light', primaryLight);
      rootStyle.setProperty('--primary-main-rgb', primaryMainRgb);
      rootStyle.setProperty('--primary-dark-rgb', primaryDarkRgb);
      
      rootStyle.setProperty('--background-default', bgDefault);
      rootStyle.setProperty('--background-paper', bgPaper);
      rootStyle.setProperty('--background-paper-alt', bgPaperAlt);
      rootStyle.setProperty('--surface-elevated', bgPaper);
      rootStyle.setProperty('--surface-glass', `rgba(${bgPaperRgb}, 0.76)`);
      rootStyle.setProperty('--surface-glass-strong', `rgba(${bgPaperRgb}, 0.9)`);
      
      rootStyle.setProperty('--text-primary', textPrimary);
      rootStyle.setProperty('--text-secondary', textSecondary);
      rootStyle.setProperty('--text-disabled', `rgba(${textPrimaryRgb}, 0.42)`);
      
      rootStyle.setProperty('--divider', divider);
      rootStyle.setProperty('--divider-rgb', dividerRgb);
      rootStyle.setProperty('--action-hover', `rgba(${primaryMainRgb}, 0.08)`);
      rootStyle.setProperty('--hero-gradient', primaryMain);
      
      rootStyle.setProperty('--code-bg', codeBg);
      rootStyle.setProperty('--code-header-bg', bgPaperAlt);
      rootStyle.setProperty('--code-border', divider);
      rootStyle.setProperty('--code-line-num', `rgba(${textSecondaryRgb}, 0.38)`);
      rootStyle.setProperty('--code-text-default', textPrimary);
    } else {
      const propertiesToClear = [
        '--primary-main', '--primary-dark', '--primary-light', '--primary-main-rgb', '--primary-dark-rgb',
        '--background-default', '--background-paper', '--background-paper-alt', '--surface-elevated',
        '--surface-glass', '--surface-glass-strong', '--text-primary', '--text-secondary', '--text-disabled',
        '--divider', '--divider-rgb', '--action-hover', '--hero-gradient', '--code-bg', '--code-header-bg',
        '--code-border', '--code-line-num', '--code-text-default'
      ];
      propertiesToClear.forEach(prop => rootStyle.removeProperty(prop));
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
      return isColorDark(customColors.bgDefault || '#F5F7FA');
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
