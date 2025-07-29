'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Booking } from '../../lib/types/api';
import BookingTooltip from './BookingTooltip';
import CalendarLegend from './CalendarLegend';
import CalendarToolbar from './CalendarToolbar';
import 'react-day-picker/style.css';
import './day-picker-calendar.css';

interface DayPickerCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export default function DayPickerCalendarView({ bookings, onSelectBooking }: DayPickerCalendarViewProps) {

  const [tooltip] = useState<{
    booking: Booking;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    booking: {} as Booking,
    position: { x: 0, y: 0 },
    visible: false,
  });

  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Force key change when bookings change to ensure calendar re-renders
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [bookings]);

  // Transform bookings into date ranges using useMemo for performance
  const bookingDates = useMemo(() => {
    const dates = new Map<string, Booking[]>();
    
    bookings.forEach(booking => {
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);
      
      // Create date range for this booking
      let currentDate = startDate;
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!dates.has(dateKey)) {
          dates.set(dateKey, []);
        }
        dates.get(dateKey)!.push(booking);
        
        // Move to next day
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return dates;
  }, [bookings]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return bookingDates.get(dateKey) || [];
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    if (dayBookings.length > 0) {
      onSelectBooking(dayBookings[0]);
    }
  };

  // Handle calendar navigation
  const handleNavigate = (navigate: 'PREV' | 'NEXT' | 'TODAY') => {
    switch (navigate) {
      case 'PREV':
        setCurrentMonth(subMonths(currentMonth, 1));
        break;
      case 'NEXT':
        setCurrentMonth(addMonths(currentMonth, 1));
        break;
      case 'TODAY':
        setCurrentMonth(new Date());
        break;
    }
  };

  // Generate label for current month
  const generateLabel = (): string => {
    return format(currentMonth, 'MMMM yyyy', { locale: de });
  };

  // Handle view change (DayPicker only supports month view)
  const handleViewChange = () => {
    // DayPicker only supports month view, so we ignore view changes
    // This is for consistency with the CalendarToolbar interface
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden day-picker-calendar">
      {/* Calendar Toolbar */}
      <CalendarToolbar
        label={generateLabel()}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        view="month"
      />
      
      <DayPicker
        key={calendarKey} // Force re-render when bookings change
        mode="single"
        locale={de}
        showOutsideDays
        fixedWeeks
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        onDayClick={handleDayClick}
        modifiers={{
          'has-bookings': (date) => getBookingsForDate(date).length > 0
        }}
      />
      
      {/* Simple booking summary */}
      {bookings.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            {bookings.length} {bookings.length === 1 ? 'Buchung' : 'Buchungen'} gefunden
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Klicken Sie auf ein hervorgehobenes Datum für Details
          </p>
        </div>
      )}
      
      {/* Legend */}
      <CalendarLegend />
      
      {/* Tooltip */}
      <BookingTooltip
        booking={tooltip.booking}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  );
}