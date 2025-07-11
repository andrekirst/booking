'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate: string, endDate: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
  error?: string;
  warning?: string;
}

export default function DateRangePicker({
  startDate = '',
  endDate = '',
  onDateChange,
  minDate,
  maxDate,
  className = '',
  error,
  warning
}: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const effectiveMinDate = minDate || today;

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    
    // If end date is before new start date, clear it
    if (localEndDate && value && new Date(value) >= new Date(localEndDate)) {
      setLocalEndDate('');
      onDateChange(value, '');
    } else {
      onDateChange(value, localEndDate);
    }
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    onDateChange(localStartDate, value);
  };

  const getMinEndDate = () => {
    if (!localStartDate) return effectiveMinDate;
    
    // End date must be at least one day after start date
    const startDateObj = new Date(localStartDate);
    startDateObj.setDate(startDateObj.getDate() + 1);
    return startDateObj.toISOString().split('T')[0];
  };

  const getNights = () => {
    if (!localStartDate || !localEndDate) return 0;
    
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = getNights();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Anreise
          </label>
          <input
            type="date"
            id="startDate"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={effectiveMinDate}
            max={maxDate}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-gray-900 ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-gray-300'
            }`}
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            Abreise
          </label>
          <input
            type="date"
            id="endDate"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={getMinEndDate()}
            max={maxDate}
            disabled={!localStartDate}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-gray-300'
            }`}
            required
          />
        </div>
      </div>

      {/* Night Count Display */}
      {nights > 0 && (
        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="text-blue-700 font-medium">
            {nights} {nights === 1 ? 'Nacht' : 'Nächte'}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 rounded-xl">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Warning Message */}
      {warning && !error && (
        <div className="flex items-center p-3 bg-yellow-50 rounded-xl">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-700 text-sm">{warning}</span>
        </div>
      )}
    </div>
  );
}