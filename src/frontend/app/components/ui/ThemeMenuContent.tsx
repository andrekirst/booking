'use client';

import { useTheme, Theme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { UserMenuItem } from '@/lib/types/auth';

const themes: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Hell', icon: SunIcon },
  { value: 'dark', label: 'Dunkel', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
];

/**
 * Hook that returns theme-related menu items for UserMenuDropdown
 */
export function useThemeMenuItems(): UserMenuItem[] {
  const { theme, setTheme } = useTheme();

  const themeItems: UserMenuItem[] = themes.map((themeOption) => {
    const Icon = themeOption.icon;
    const isSelected = theme === themeOption.value;
    
    return {
      label: themeOption.label,
      icon: ({ className }) => (
        <div className="flex items-center">
          <Icon className={className} />
          {isSelected && (
            <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </div>
      ),
      onClick: () => setTheme(themeOption.value),
      show: true,
      variant: isSelected ? 'selected' : undefined
    };
  });

  // Add a separator and theme label before theme items
  const themeMenuItems: UserMenuItem[] = [
    {
      label: 'Theme',
      icon: ({ className }) => (
        <ComputerDesktopIcon className={className} />
      ),
      onClick: () => {}, // No action, just a label
      show: true,
      variant: 'label',
      showSeparator: true
    },
    ...themeItems
  ];

  return themeMenuItems;
}