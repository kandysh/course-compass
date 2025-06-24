
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

/**
 * A button component that allows users to toggle between light and dark themes.
 * Displays a sun icon for switching to light mode and a moon icon for dark mode.
 * @returns {JSX.Element} The ThemeToggleButton component.
 */
export function ThemeToggleButton(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
