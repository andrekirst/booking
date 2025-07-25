'use client';

interface CalendarToolbarProps {
  label: string;
  onNavigate: (navigate: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: 'month' | 'week' | 'day') => void;
  view: string;
}

export default function CalendarToolbar({ 
  label, 
  onNavigate, 
  onView, 
  view 
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Vorheriger Zeitraum"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
        >
          Heute
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Nächster Zeitraum"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <h2 className="text-lg font-semibold text-black">{label}</h2>
      
      <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'month'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Monat
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'week'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Woche
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'day'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Tag
        </button>
      </div>
    </div>
  );
}