'use client';

import { useState, useRef, useEffect } from 'react';
import { SleepingAccommodationAvailability } from '../../../lib/types/api';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate: string, endDate: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
  error?: string;
  warning?: string;
  availability?: SleepingAccommodationAvailability[];
  onDateAvailabilityCheck?: (date: string) => Promise<boolean>;
}

export default function DateRangePicker({
  startDate = '',
  endDate = '',
  onDateChange,
  minDate,
  maxDate,
  className = '',
  error,
  warning,
  availability,
  onDateAvailabilityCheck
}: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [hoverNights, setHoverNights] = useState<number>(0);

  // Sync with external props
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    // Reset selection state when both dates are cleared from outside
    if (!startDate && !endDate) {
      setSelectingStart(true);
    }
  }, [startDate, endDate]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const effectiveMinDate = minDate ? new Date(minDate) : today;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDateForInput(date);
    
    // If both dates are already selected, start over with new start date
    if (localStartDate && localEndDate && !selectingStart) {
      setLocalStartDate(dateStr);
      setLocalEndDate('');
      setSelectingStart(false);
      onDateChange(dateStr, '');
      return;
    }
    
    if (selectingStart || !localStartDate) {
      setLocalStartDate(dateStr);
      setSelectingStart(false);
      
      // Clear end date if it's before the new start date
      if (localEndDate && new Date(dateStr) >= new Date(localEndDate)) {
        setLocalEndDate('');
        onDateChange(dateStr, '');
      } else {
        onDateChange(dateStr, localEndDate);
      }
    } else {
      if (new Date(dateStr) <= new Date(localStartDate)) {
        // If selected date is before start date, make it the new start date
        setLocalStartDate(dateStr);
        setLocalEndDate('');
        onDateChange(dateStr, '');
        setSelectingStart(false);
      } else {
        setLocalEndDate(dateStr);
        onDateChange(localStartDate, dateStr);
        setIsOpen(false);
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!localStartDate || !localEndDate) return false;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    return date >= start && date <= end;
  };

  const isDateInHoverRange = (date: Date) => {
    if (!localStartDate || !hoverDate || selectingStart) return false;
    const start = new Date(localStartDate);
    return date >= start && date <= hoverDate && date > start;
  };

  const isDateDisabled = (date: Date) => {
    // Create date objects for comparison at midnight to avoid time issues
    const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateAtMidnight = new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), effectiveMinDate.getDate());
    
    if (dateAtMidnight < minDateAtMidnight) return true;
    if (maxDate && dateAtMidnight > new Date(maxDate)) return true;
    return false;
  };

  const isDateFullyBooked = (date: Date) => {
    if (!availability) return false;
    
    // A date is fully booked if all accommodations have no available capacity
    const hasAnyAvailableCapacity = availability.some(acc => 
      acc.isAvailable && acc.availableCapacity > 0
    );
    
    return !hasAnyAvailableCapacity;
  };

  const calculateHoverNights = (hoverDate: Date) => {
    if (!localStartDate || selectingStart) return 0;
    const start = new Date(localStartDate);
    const diffTime = hoverDate.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const clearSelection = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setSelectingStart(true);
    onDateChange('', '');
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate start date for Monday-first week
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday (1) to be 0, Tuesday (2) to be 1, etc.
    const firstDayOfWeek = firstDay.getDay();
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - mondayOffset);
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const getNights = () => {
    if (!localStartDate || !localEndDate) return 0;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${
          isOpen 
            ? 'border-blue-500 ring-2 ring-blue-500/20' 
            : error 
              ? 'border-red-300 hover:border-red-400' 
              : 'border-gray-300 hover:border-gray-400'
        } bg-white`}
      >
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
          </svg>
          <div className="flex items-center space-x-2">
            <span className={`${localStartDate ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
              {localStartDate ? formatDisplayDate(localStartDate) : 'Anreise'}
            </span>
            {localStartDate && localEndDate && (
              <>
                <span className="text-gray-400">→</span>
                <span className="text-gray-900 font-medium">{formatDisplayDate(localEndDate)}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {localStartDate && localEndDate && (
            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {getNights()} {getNights() === 1 ? 'Nacht' : 'Nächte'}
            </span>
          )}
          
          {(localStartDate || localEndDate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Auswahl löschen"
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-6 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                Heute
              </button>
              
              {(localStartDate || localEndDate) && (
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Löschen
                </button>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = localStartDate === formatDateForInput(date) || localEndDate === formatDateForInput(date);
              const isInRange = isDateInRange(date);
              const isInHoverRange = isDateInHoverRange(date);
              const isDisabled = isDateDisabled(date);
              const isFullyBooked = isDateFullyBooked(date);
              const currentHoverNights = calculateHoverNights(date);
              
              return (
                <button
                  key={index}
                  onClick={() => !(isDisabled || isFullyBooked) && handleDateSelect(date)}
                  onMouseEnter={() => {
                    setHoverDate(date);
                    setHoverNights(currentHoverNights);
                  }}
                  onMouseLeave={() => {
                    setHoverDate(null);
                    setHoverNights(0);
                  }}
                  disabled={isDisabled || isFullyBooked}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-150 relative
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${isFullyBooked && !isDisabled ? 'bg-red-100 text-red-500 cursor-not-allowed line-through' : ''}
                    ${!isDisabled && !isFullyBooked ? 'hover:bg-blue-50 cursor-pointer' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-blue-200' : ''}
                    ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                    ${isInRange || isInHoverRange ? 'bg-blue-100 text-blue-800' : ''}
                  `}
                >
                  {date.getDate()}
                  {isFullyBooked && !isDisabled && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection Helper */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-800 font-medium">
              {selectingStart || !localStartDate 
                ? 'Wählen Sie das Anreisedatum' 
                : localEndDate 
                  ? `${getNights()} ${getNights() === 1 ? 'Nacht' : 'Nächte'} ausgewählt - Klicken Sie für neue Auswahl`
                  : hoverNights > 0
                    ? `${hoverNights} ${hoverNights === 1 ? 'Nacht' : 'Nächte'} - Klicken Sie um zu bestätigen`
                    : 'Wählen Sie das Abreisedatum'
              }
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-3 mt-3 bg-red-50 rounded-xl">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Warning Message */}
      {warning && !error && (
        <div className="flex items-center p-3 mt-3 bg-yellow-50 rounded-xl">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-700 text-sm">{warning}</span>
        </div>
      )}
    </div>
  );
}