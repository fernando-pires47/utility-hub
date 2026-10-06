import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

// Preserve the saved theme from before the Utility Hub rename.
const THEME_KEY = 'text-formatter:theme';

const loadTheme = (): Theme => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // storage unavailable: fall back to default
  }
  return 'dark';
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // storage unavailable: keep toggling working in memory
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
};
