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

  const currentTheme = useMemo(() => buildTheme(themeMode), [themeMode, customColors]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('theme', themeMode); // fallback for older code
    document.documentElement.setAttribute('data-theme', themeMode);
    
    const rootStyle = document.documentElement.style;
    const isDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'midnight'].includes(themeMode);
    
    // Extract colors dynamically from MUI theme palette
    const primaryMain = currentTheme.palette.primary.main;
    const primaryDark = currentTheme.palette.primary.dark;
    const primaryLight = currentTheme.palette.primary.light;
    const bgDefault = currentTheme.palette.background.default;
    const bgPaper = currentTheme.palette.background.paper;
    const textPrimary = currentTheme.palette.text.primary;
    const textSecondary = currentTheme.palette.text.secondary;
    const divider = currentTheme.palette.divider;

    const presetPaperAlts = {
      light: '#F0F4F8',
      dark: '#18193C',
      sepia: '#F3E8CE',
      lava: '#2a0e0e',
      ocean: '#143c6d',
      forest: '#11331f',
      amber: '#003746',
      dracula: '#242533',
      amethyst: '#341b4a',
      nordic: '#434c5e',
      mint: '#eafbf2',
      lavender: '#f6efff',
      peach: '#ffeeda',
      rose: '#ffe5eb',
      clay: '#f0f0f0',
      kitty: '#ffdce5',
      midnight: '#172033'
    };

    const presetCodeBgs = {
      light: '#F7F9FC',
      dark: '#0F1424',
      sepia: '#F5ECD5',
      lava: '#110505',
      ocean: '#001b3a',
      forest: '#05140b',
      amber: '#073642',
      dracula: '#282a36',
      amethyst: '#1a0b28',
      nordic: '#2e3440',
      mint: '#e8f7f0',
      lavender: '#f5efff',
      peach: '#fff5ea',
      rose: '#ffeef2',
      clay: '#f3f4f6',
      kitty: '#ffd1dc',
      midnight: '#080c16'
    };

    const bgPaperAlt = themeMode === 'custom' ? (customColors.bgPaperAlt || '#F0F4F8') : (presetPaperAlts[themeMode] || (isDark ? '#18193C' : '#F0F4F8'));
    const codeBg = themeMode === 'custom' ? (customColors.codeBg || '#f8f9fa') : (presetCodeBgs[themeMode] || (isDark ? '#0F1424' : '#F7F9FC'));

    const primaryMainRgb = hexToRgb(primaryMain);
    const primaryDarkRgb = hexToRgb(primaryDark);
    const dividerRgb = hexToRgb(divider) || primaryMainRgb;
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
    rootStyle.setProperty('--surface-glass', bgPaperRgb ? `rgba(${bgPaperRgb}, 0.76)` : 'rgba(255, 255, 255, 0.76)');
    rootStyle.setProperty('--surface-glass-strong', bgPaperRgb ? `rgba(${bgPaperRgb}, 0.9)` : 'rgba(255, 255, 255, 0.9)');
    
    rootStyle.setProperty('--text-primary', textPrimary);
    rootStyle.setProperty('--text-secondary', textSecondary);
    rootStyle.setProperty('--text-disabled', textPrimaryRgb ? `rgba(${textPrimaryRgb}, 0.42)` : 'rgba(0, 0, 0, 0.42)');
    
    rootStyle.setProperty('--divider', divider);
    rootStyle.setProperty('--divider-rgb', dividerRgb);
    rootStyle.setProperty('--action-hover', primaryMainRgb ? `rgba(${primaryMainRgb}, 0.08)` : 'rgba(61, 92, 255, 0.08)');
    rootStyle.setProperty('--hero-gradient', primaryMain);
    
    rootStyle.setProperty('--code-bg', codeBg);
    rootStyle.setProperty('--code-header-bg', bgPaperAlt);
    rootStyle.setProperty('--code-border', divider);
    rootStyle.setProperty('--code-line-num', textSecondaryRgb ? `rgba(${textSecondaryRgb}, 0.38)` : 'rgba(0, 0, 0, 0.38)');
    rootStyle.setProperty('--code-text-default', textPrimary);
    
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [themeMode, customColors, currentTheme]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const isCurrentlyDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic', 'midnight'].includes(prev);
      return isCurrentlyDark ? 'light' : 'dark';
    });
  };
  
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
