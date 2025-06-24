
'use client';

import * as React from 'react';

type Theme = 'dark' | 'light';

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

/**
 * Provides theme management (dark/light) for the application.
 * It applies the theme class to the root HTML element and persists the
 * user's preference in localStorage.
 * @param {ThemeProviderProps} props - The props for the ThemeProvider.
 * @returns {JSX.Element} The ThemeProvider component.
 */
export function ThemeProvider({
  children,
  initialTheme = 'dark', // Defaulting to dark to match previous state
  storageKey = 'course-compass-theme',
}: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        return storedTheme;
      }
    }
    return initialTheme;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    // Remove the opposite theme class and add the current theme class
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    // Save the current theme to localStorage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Custom hook to access the current theme and theme control functions.
 * Must be used within a component wrapped by ThemeProvider.
 * @returns {ThemeProviderState} The current theme state and control functions.
 * @throws Error if used outside of a ThemeProvider.
 */
export const useTheme = (): ThemeProviderState => {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
