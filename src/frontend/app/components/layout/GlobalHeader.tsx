'use client';

import { ThemeToggle } from '@/app/components/ui/ThemeToggle';

interface GlobalHeaderProps {
  showThemeToggle?: boolean;
}

export function GlobalHeader({ showThemeToggle = false }: GlobalHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Garten Buchungssystem
          </h1>
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}