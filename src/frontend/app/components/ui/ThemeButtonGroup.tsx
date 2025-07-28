'use client';

import { useTheme, Theme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const themes: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Hell', icon: SunIcon },
  { value: 'dark', label: 'Dunkel', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
];

export function ThemeButtonGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </span>
      </div>
      
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        {themes.map((themeOption, index) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          const isFirst = index === 0;
          const isLast = index === themes.length - 1;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium transition-all duration-200
                ${!isFirst ? 'border-l border-gray-200 dark:border-gray-600' : ''}
                ${isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
              `}
              title={themeOption.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {themes.find(t => t.value === theme)?.label}
      </div>
    </div>
  );
}