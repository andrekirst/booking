'use client';

import { useState } from 'react';
import { BookingStatus, TimeRange } from '../../lib/types/api';

interface FilterPanelProps {
  selectedTimeRange: TimeRange;
  statusFilter: BookingStatus | null;
  isFilterLoading: boolean;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  onStatusChange: (status: BookingStatus | null) => void;
}

const timeRangeOptions = [
  { value: TimeRange.Future, label: 'Aktuelle & Zukünftige' },
  { value: TimeRange.All, label: 'Alle Buchungen' },
  { value: TimeRange.Past, label: 'Vergangene' },
  { value: TimeRange.Last30Days, label: 'Letzte 30 Tage' },
  { value: TimeRange.LastYear, label: 'Letztes Jahr' },
];

const statusOptions = [
  { value: null, label: 'Alle Status' },
  { value: BookingStatus.Pending, label: 'Ausstehend' },
  { value: BookingStatus.Confirmed, label: 'Bestätigt' },
  { value: BookingStatus.Accepted, label: 'Angenommen' },
  { value: BookingStatus.Rejected, label: 'Abgelehnt' },
  { value: BookingStatus.Cancelled, label: 'Storniert' },
  { value: BookingStatus.Completed, label: 'Abgeschlossen' },
];

export default function FilterPanel({
  selectedTimeRange,
  statusFilter,
  isFilterLoading,
  onTimeRangeChange,
  onStatusChange,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTimeRangeLabel = () => {
    return timeRangeOptions.find(option => option.value === selectedTimeRange)?.label || 'Unbekannt';
  };

  const getStatusLabel = () => {
    return statusOptions.find(option => option.value === statusFilter)?.label || 'Alle Status';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Header - Always visible */}
      <div 
        className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <svg 
                className="w-4 h-4 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Filter</h3>
              <p className="text-xs text-gray-500">
                {getTimeRangeLabel()} • {getStatusLabel()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isFilterLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500">Laden...</span>
              </div>
            )}
            
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 py-5 space-y-6">
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Zeitraum
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={`timerange-${option.value}`}
                  onClick={() => onTimeRangeChange(option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all duration-150 ${
                    selectedTimeRange === option.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value !== null ? option.value.toString() : 'status-all'}
                  onClick={() => onStatusChange(option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all duration-150 ${
                    statusFilter === option.value
                      ? 'bg-green-500 text-white border-green-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                onTimeRangeChange(TimeRange.Future);
                onStatusChange(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}