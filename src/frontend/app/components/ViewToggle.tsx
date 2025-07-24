'use client';

import { useState, useEffect } from 'react';

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
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'list'
            ? 'bg-blue-100 text-blue-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Liste
      </button>
      <button
        onClick={() => onViewChange('calendar')}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'calendar'
            ? 'bg-blue-100 text-blue-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
        </svg>
        Kalender
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