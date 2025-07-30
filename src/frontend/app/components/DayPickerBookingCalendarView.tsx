'use client';

import { Booking } from '../../lib/types/api';
import DayPickerCalendarView from './DayPickerCalendarView';
import CompactBookingList from './CompactBookingList';

interface DayPickerBookingCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectBookingById: (bookingId: string) => void;
  selectedBookingId?: string | null;
}

export default function DayPickerBookingCalendarView({ 
  bookings, 
  onSelectBooking, 
  onSelectBookingById, 
  selectedBookingId 
}: DayPickerBookingCalendarViewProps) {
  console.log('🔍 DEBUG DayPickerBookingCalendarView received bookings:', bookings.length, bookings);
  
  return (
    <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-3 xl:gap-6">
      <div className="xl:col-span-2">
        <DayPickerCalendarView
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