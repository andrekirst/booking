'use client';

import { useState, useEffect } from 'react';
import { CalendarDaysIcon, Bars3Icon } from '@heroicons/react/24/outline';

export type ViewMode = 'list' | 'calendar';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1 shadow-sm">
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 ease-in-out transform ${
          currentView === 'list'
            ? 'bg-blue-100 text-blue-700 shadow-sm scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102'
        }`}
      >
        <Bars3Icon className={`w-4 h-4 sm:mr-2 transition-transform duration-300 ${
          currentView === 'list' ? 'rotate-0' : 'rotate-0'
        }`} />
        <span className="hidden sm:inline">Liste</span>
      </button>
      <button
        onClick={() => onViewChange('calendar')}
        className={`flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 ease-in-out transform ${
          currentView === 'calendar'
            ? 'bg-blue-100 text-blue-700 shadow-sm scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102'
        }`}
      >
        <CalendarDaysIcon className={`w-4 h-4 sm:mr-2 transition-transform duration-300 ${
          currentView === 'calendar' ? 'rotate-0' : 'rotate-0'
        }`} />
        <span className="hidden sm:inline">Kalender</span>
      </button>
    </div>
  );
}

// Hook für localStorage persistence
export function useViewMode(): [ViewMode, (view: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    // Load from localStorage on mount
    const savedView = localStorage.getItem('bookingsViewMode') as ViewMode;
    if (savedView && (savedView === 'list' || savedView === 'calendar')) {
      setViewMode(savedView);
    }
  }, []);

  const setAndSaveViewMode = (view: ViewMode) => {
    setViewMode(view);
    localStorage.setItem('bookingsViewMode', view);
  };

  return [viewMode, setAndSaveViewMode];
}