'use client';

import { Booking } from '../../lib/types/api';
import FullCalendarView from './FullCalendarView';
import CompactBookingList from './CompactBookingList';

interface BookingFullCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectBookingById: (bookingId: string) => void;
  selectedBookingId?: string | null;
}

export default function BookingFullCalendarView({ 
  bookings, 
  onSelectBooking, 
  onSelectBookingById, 
  selectedBookingId 
}: BookingFullCalendarViewProps) {
  
  return (
    <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-3 xl:gap-6">
      <div className="xl:col-span-2">
        <FullCalendarView
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