import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Default fallback preferences
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme_mode') || 'system');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('theme_color') || 'purple');
  const [textColor, setTextColor] = useState(() => localStorage.getItem('theme_text_color') || 'black');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('theme_font_size') || 'medium');
  const [syncing, setSyncing] = useState(false);

  // Mappings for theme colors, text colors, and font sizes to actual CSS values
  const themeColorsMap = {
    orange: '#f97316',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#eab308',
    teal: '#14b8a6',
    pink: '#ec4899',
    purple: '#8b5cf6'
  };

  const textColorsMap = {
    black: '#0f172a', // Slate 900 for premium text
    white: '#f8fafc', // Slate 50
    gray: '#64748b',  // Slate 500
    navy: '#0f172a'   // Deep Navy or Default Slate
  };

  const fontSizesMap = {
    small: '14px',
    medium: '16px',
    large: '18px'
  };

  // 1. Fetch preferences from backend on authentication
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await api.get('/api/accounts/preferences/');
        const { theme_mode, theme_color, text_color, font_size } = response.data;
        
        if (theme_mode) {
          setThemeMode(theme_mode);
          localStorage.setItem('theme_mode', theme_mode);
        }
        if (theme_color) {
          setThemeColor(theme_color);
          localStorage.setItem('theme_color', theme_color);
        }
        if (text_color) {
          setTextColor(text_color);
          localStorage.setItem('theme_text_color', text_color);
        }
        if (font_size) {
          setFontSize(font_size);
          localStorage.setItem('theme_font_size', font_size);
        }
      } catch (err) {
        console.error('Failed to retrieve user preferences from database:', err);
      }
    };

    fetchUserPreferences();
  }, [isAuthenticated]);

  // 2. Save user preferences to state, localStorage and backend API
  const savePreferences = async (newPrefs) => {
    setSyncing(true);
    try {
      const updatedMode = newPrefs.themeMode || themeMode;
      const updatedColor = newPrefs.themeColor || themeColor;
      const updatedText = newPrefs.textColor || textColor;
      const updatedFontSize = newPrefs.fontSize || fontSize;

      // Update State
      setThemeMode(updatedMode);
      setThemeColor(updatedColor);
      setTextColor(updatedText);
      setFontSize(updatedFontSize);

      // Save to LocalStorage
      localStorage.setItem('theme_mode', updatedMode);
      localStorage.setItem('theme_color', updatedColor);
      localStorage.setItem('theme_text_color', updatedText);
      localStorage.setItem('theme_font_size', updatedFontSize);

      // Save to Backend if logged in
      if (isAuthenticated) {
        await api.put('/api/accounts/preferences/', {
          theme_mode: updatedMode,
          theme_color: updatedColor,
          text_color: updatedText,
          font_size: updatedFontSize
        });
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to sync theme preferences with backend:', err);
      return { success: false, error: 'Local updates applied, but failed to sync to server.' };
    } finally {
      setSyncing(false);
    }
  };

  // 3. Dynamically inject CSS variables onto document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Determine target mode (handle system theme detection)
    let activeMode = themeMode;
    if (themeMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeMode = prefersDark ? 'dark' : 'light';
    }

    // Apply Mode Colors
    if (activeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.setProperty('--bg-color-main', '#0f172a'); // slate-900
      root.style.setProperty('--card-bg-main', '#1e293b'); // slate-800
      root.style.setProperty('--border-color-main', '#334155'); // slate-700
      root.style.setProperty('--text-color-main', '#f8fafc'); // slate-50
      root.style.setProperty('--text-muted-main', '#94a3b8'); // slate-400
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.setProperty('--bg-color-main', '#f8fafc'); // slate-50
      root.style.setProperty('--card-bg-main', '#ffffff'); // white
      root.style.setProperty('--border-color-main', '#e2e8f0'); // slate-200
      root.style.setProperty('--text-color-main', textColorsMap[textColor] || '#0f172a');
      root.style.setProperty('--text-muted-main', '#64748b'); // slate-500
    }

    // Apply Theme Accent and Font Size with robust default fallbacks
    const activeAccent = themeColorsMap[themeColor] || '#8b5cf6';
    const activeFontSize = fontSizesMap[fontSize] || '16px';
    
    root.style.setProperty('--primary-accent-color', activeAccent);
    root.style.setProperty('--font-size-base-val', activeFontSize);

    // Handle system theme changes dynamically in real time
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        const newActiveMode = e.matches ? 'dark' : 'light';
        if (newActiveMode === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
          root.style.setProperty('--bg-color-main', '#0f172a');
          root.style.setProperty('--card-bg-main', '#1e293b');
          root.style.setProperty('--border-color-main', '#334155');
          root.style.setProperty('--text-color-main', '#f8fafc');
          root.style.setProperty('--text-muted-main', '#94a3b8');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
          root.style.setProperty('--bg-color-main', '#f8fafc');
          root.style.setProperty('--card-bg-main', '#ffffff');
          root.style.setProperty('--border-color-main', '#e2e8f0');
          root.style.setProperty('--text-color-main', textColorsMap[textColor] || '#0f172a');
          root.style.setProperty('--text-muted-main', '#64748b');
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [themeMode, themeColor, textColor, fontSize]);

  return (
    <ThemeContext.Provider value={{
      themeMode,
      themeColor,
      textColor,
      fontSize,
      syncing,
      savePreferences
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
