'use client';

import { Booking } from '../../lib/types/api';
import CalendarView from './CalendarView';
import CompactBookingList from './CompactBookingList';

interface BookingCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectBookingById: (bookingId: string) => void;
  selectedBookingId?: string | null;
}

export default function BookingCalendarView({ 
  bookings, 
  onSelectBooking, 
  onSelectBookingById, 
  selectedBookingId 
}: BookingCalendarViewProps) {
  console.log('🔍 DEBUG BookingCalendarView received bookings:', bookings.length, bookings);
  
  return (
    <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-3 xl:gap-6">
      <div className="xl:col-span-2">
        <CalendarView
          bookings={bookings}
          onSelectBooking={onSelectBooking}
        />
      </div>
      <div className="xl:col-span-1">
        <CompactBookingList
          bookings={bookings}
          onSelectBooking={onSelectBookingById}
          selectedBookingId={selectedBookingId}
        />
      </div>
    </div>
  );
}