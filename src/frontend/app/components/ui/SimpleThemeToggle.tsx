'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function SimpleThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-4 right-4 z-50
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
        border border-gray-200 dark:border-gray-700
        text-gray-700 dark:text-gray-200
        hover:bg-white dark:hover:bg-gray-800
        shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
      "
      title={`Zu ${resolvedTheme === 'dark' ? 'Hell' : 'Dunkel'} wechseln`}
    >
      {resolvedTheme === 'dark' ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
}