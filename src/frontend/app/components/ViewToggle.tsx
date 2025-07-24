'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarDaysIcon, Bars3Icon } from '@heroicons/react/24/outline';

export type ViewMode = 'list' | 'calendar';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateSlider = () => {
      const activeButton = currentView === 'list' ? listButtonRef.current : calendarButtonRef.current;
      if (activeButton && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        
        setSliderStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateSlider, 0);
    
    // Update on resize
    window.addEventListener('resize', updateSlider);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSlider);
    };
  }, [currentView]);

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center bg-gray-100 rounded-lg p-1 shadow-sm"
    >
      {/* Sliding background */}
      <div 
        className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
        style={{
          left: `${sliderStyle.left}px`,
          width: `${sliderStyle.width}px`,
        }}
      />
      
      {/* Buttons */}
      <button
        ref={listButtonRef}
        onClick={() => onViewChange('list')}
        className={`relative z-10 flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ease-in-out ${
          currentView === 'list'
            ? 'text-blue-700 font-semibold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Bars3Icon className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Liste</span>
      </button>
      <button
        ref={calendarButtonRef}
        onClick={() => onViewChange('calendar')}
        className={`relative z-10 flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ease-in-out ${
          currentView === 'calendar'
            ? 'text-blue-700 font-semibold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <CalendarDaysIcon className="w-4 h-4 sm:mr-2" />
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