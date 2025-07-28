'use client';

import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import { Booking, BookingStatus } from '../../lib/types/api';
import BookingTooltip from './BookingTooltip';
import CalendarLegend from './CalendarLegend';

interface FullCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export default function FullCalendarView({ bookings, onSelectBooking }: FullCalendarViewProps) {
  
  const [tooltip, setTooltip] = useState<{
    booking: Booking;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    booking: {} as Booking,
    position: { x: 0, y: 0 },
    visible: false,
  });

  const calendarRef = useRef<FullCalendar>(null);

  // Transform bookings to FullCalendar events
  const events: EventInput[] = bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.totalPersons} ${booking.totalPersons === 1 ? 'Person' : 'Personen'}`,
    start: booking.startDate,
    end: booking.endDate,
    backgroundColor: getBackgroundColor(booking.status),
    borderColor: getBackgroundColor(booking.status),
    textColor: 'white',
    extendedProps: {
      booking: booking
    }
  }));

  function getBackgroundColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return '#F59E0B'; // yellow-500
      case BookingStatus.Confirmed:
      case BookingStatus.Accepted:
        return '#10B981'; // emerald-500
      case BookingStatus.Cancelled:
      case BookingStatus.Rejected:
        return '#EF4444'; // red-500
      case BookingStatus.Completed:
        return '#3B82F6'; // blue-500
      default:
        return '#6B7280'; // gray-500
    }
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps.booking as Booking;
    onSelectBooking(booking);
  };

  const handleEventMouseEnter = (mouseEnterInfo: any) => {
    const booking = mouseEnterInfo.event.extendedProps.booking as Booking;
    const rect = mouseEnterInfo.el.getBoundingClientRect();
    
    setTooltip({
      booking,
      position: { x: rect.left + rect.width / 2, y: rect.top },
      visible: true,
    });
  };

  const handleEventMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden"
      style={{ height: 'fit-content' }}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        eventClick={handleEventClick}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        height={600}
        locale="de"
        firstDay={1} // Monday
        weekends={true}
        dayMaxEvents={true}
        nowIndicator={true}
        eventDisplay="block"
        displayEventTime={false}
        buttonText={{
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag'
        }}
        noEventsText="Keine Buchungen in diesem Zeitraum"
      />
      
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