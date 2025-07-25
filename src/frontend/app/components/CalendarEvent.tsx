'use client';

import { Booking } from '../../lib/types/api';

interface CalendarEventProps {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Booking;
  };
  onMouseEnter: (e: React.MouseEvent, booking: Booking) => void;
  onMouseLeave: () => void;
}

export default function CalendarEvent({ event, onMouseEnter, onMouseLeave }: CalendarEventProps) {
  const booking = event.resource;
  
  return (
    <div 
      className="text-xs"
      onMouseEnter={(e) => onMouseEnter(e, booking)}
      onMouseLeave={onMouseLeave}
    >
      <div className="font-medium">{event.title}</div>
      <div className="text-white/80">
        {booking.bookingItems.length} {booking.bookingItems.length === 1 ? 'Raum' : 'Räume'}
      </div>
    </div>
  );
}