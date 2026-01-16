/**
 * AI Learning Playground - Settings Provider
 * Applies user preferences to the DOM
 */

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePreferencesStore } from '@/lib/store';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useAppStore();
  const { fontSize } = usePreferencesStore();

  // Apply theme to HTML element (runs on mount and when theme changes)
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  }, [theme]);

  // Apply font size to HTML element (runs on mount and when fontSize changes)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    html.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  return <>{children}</>;
};
