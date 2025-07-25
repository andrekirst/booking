'use client';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import { Booking, BookingStatus } from '../../lib/types/api';
import { useState, useRef, useEffect } from 'react';
import BookingTooltip from './BookingTooltip';
import CalendarToolbar from './CalendarToolbar';
import CalendarLegend from './CalendarLegend';
import CalendarEvent from './CalendarEvent';
import './calendar.css';

// Set up moment localization
moment.locale('de');
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

export default function CalendarView({ bookings, onSelectBooking }: CalendarViewProps) {
  const [tooltip, setTooltip] = useState<{
    booking: Booking;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    booking: {} as Booking,
    position: { x: 0, y: 0 },
    visible: false,
  });

  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Transform bookings to calendar events
  const events: CalendarEvent[] = bookings.map((booking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    return {
      id: booking.id,
      title: `${booking.totalPersons} ${booking.totalPersons === 1 ? 'Person' : 'Personen'}`,
      start: startDate,
      end: endDate,
      resource: booking,
    };
  });

  const getEventStyle = (event: CalendarEvent) => {
    const booking = event.resource;
    let backgroundColor = '#6B7280'; // gray-500 default
    
    switch (booking.status) {
      case BookingStatus.Pending:
        backgroundColor = '#F59E0B'; // yellow-500
        break;
      case BookingStatus.Confirmed:
      case BookingStatus.Accepted:
        backgroundColor = '#10B981'; // emerald-500
        break;
      case BookingStatus.Cancelled:
      case BookingStatus.Rejected:
        backgroundColor = '#EF4444'; // red-500
        break;
      case BookingStatus.Completed:
        backgroundColor = '#3B82F6'; // blue-500
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectBooking(event.resource);
  };

  const handleEventMouseEnter = (e: React.MouseEvent, booking: Booking) => {
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      booking,
      position: { x: rect.left + rect.width / 2, y: rect.top },
      visible: true,
    });
  };

  const handleEventMouseLeave = () => {
    // Add a small delay before hiding to prevent flickering
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }, 100);
  };


  const messages = {
    allDay: 'Ganztägig',
    previous: 'Zurück',
    next: 'Weiter',
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Zeit',
    event: 'Ereignis',
    noEventsInRange: 'Keine Buchungen in diesem Zeitraum.',
    showMore: (total: number) => `+ ${total} weitere`,
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden"
      style={{ height: 'fit-content' }}
      onMouseLeave={() => {
        // Hide tooltip when mouse leaves the entire calendar container
        setTooltip(prev => ({ ...prev, visible: false }));
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={getEventStyle}
        components={{
          event: (props) => (
            <CalendarEvent
              {...props}
              onMouseEnter={handleEventMouseEnter}
              onMouseLeave={handleEventMouseLeave}
            />
          ),
          toolbar: (props) => (
            <CalendarToolbar
              {...props}
              onView={(view) => {
                setCurrentView(view);
                props.onView(view);
              }}
            />
          ),
        }}
        messages={messages}
        formats={{
          weekdayFormat: 'dddd',
          dayFormat: 'DD',
          monthHeaderFormat: 'MMMM YYYY',
          dayHeaderFormat: 'dddd DD.MM.YYYY',
          dayRangeHeaderFormat: ({ start, end }) =>
            `${moment(start).format('DD.MM.')} - ${moment(end).format('DD.MM.YYYY')}`,
        }}
        popup
        step={60}
        showMultiDayTimes
        view={currentView}
        onView={(view) => setCurrentView(view as 'month' | 'week' | 'day')}
        views={['month', 'week', 'day']}
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