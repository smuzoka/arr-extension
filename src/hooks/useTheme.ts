import { useCallback, useEffect, useState } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';

export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('themePreference');
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? (stored as ThemePreference)
      : 'system';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const preference = localStorage.getItem('themePreference');
    if (preference === 'light' || preference === 'dark') {
      return preference;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (preference === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (event: MediaQueryListEvent) => {
        setTheme(event.matches ? 'dark' : 'light');
      };
      setTheme(media.matches ? 'dark' : 'light');
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
  }, [preference]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('themePreference', preference);
  }, [theme, preference]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setPreference(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme, setPreference };
};
