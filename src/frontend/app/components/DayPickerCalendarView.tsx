'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Booking, BookingStatus } from '../../lib/types/api';
import BookingTooltip from './BookingTooltip';
import CalendarLegend from './CalendarLegend';
import 'react-day-picker/style.css';
import './day-picker-calendar.css';

interface DayPickerCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export default function DayPickerCalendarView({ bookings, onSelectBooking }: DayPickerCalendarViewProps) {
  console.log('🔍 DEBUG DayPickerCalendarView received bookings:', bookings.length, bookings);

  const [tooltip, setTooltip] = useState<{
    booking: Booking;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    booking: {} as Booking,
    position: { x: 0, y: 0 },
    visible: false,
  });

  // Force key change when bookings change to ensure calendar re-renders
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    console.log('🔍 DEBUG DayPickerCalendarView bookings changed, forcing re-render. New bookings:', bookings.length);
    setCalendarKey(prev => prev + 1);
  }, [bookings]);

  // Transform bookings into date ranges using useMemo for performance
  const bookingDates = useMemo(() => {
    console.log('🔍 DEBUG Recalculating booking dates for', bookings.length, 'bookings');
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
    
    console.log('🔍 DEBUG Booking dates calculated. Total dates with bookings:', dates.size);
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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden day-picker-calendar">
      <DayPicker
        key={calendarKey} // Force re-render when bookings change
        mode="single"
        locale={de}
        showOutsideDays
        fixedWeeks
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