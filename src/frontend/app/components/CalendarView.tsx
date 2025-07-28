'use client';

import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import { Booking, BookingStatus } from '../../lib/types/api';
import { useState, useRef, useEffect } from 'react';
import BookingTooltip from './BookingTooltip';
import CalendarToolbar from './CalendarToolbar';
import CalendarLegend from './CalendarLegend';
import CalendarEvent from './CalendarEvent';
import './calendar.css';

// Set up dayjs localization and plugins
dayjs.extend(customParseFormat);
dayjs.extend(localeData);
dayjs.locale('de');
const localizer = dayjsLocalizer(dayjs);

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
  console.log('🔍 DEBUG CalendarView received bookings:', bookings.length, bookings);
  
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
  const [calendarInstance, setCalendarInstance] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a completely new calendar key based on bookings
  const calendarKey = `calendar-instance-${calendarInstance}-${bookings.length}-${JSON.stringify(bookings.map(b => b.id))}`;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Force completely new calendar instance when bookings change  
  useEffect(() => {
    console.log('🔍 DEBUG Creating new calendar instance for bookings:', bookings.length);
    setCalendarInstance(prev => prev + 1);
  }, [bookings]);
  
  // Transform bookings to calendar events - always fresh calculation
  const events: CalendarEvent[] = bookings.map((booking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    console.log('🔍 DEBUG Booking transform:', {
      id: booking.id,
      originalStart: booking.startDate,
      originalEnd: booking.endDate,
      transformedStart: startDate,
      transformedEnd: endDate,
      isValidStart: !isNaN(startDate.getTime()),
      isValidEnd: !isNaN(endDate.getTime())
    });
    
    return {
      id: booking.id,
      title: `${booking.totalPersons} ${booking.totalPersons === 1 ? 'Person' : 'Personen'}`,
      start: startDate,
      end: endDate,
      resource: booking,
    };
  });
  
  console.log('🔍 DEBUG Fresh events for calendar instance', calendarInstance, ':', events.length, events);

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
        key={calendarKey}
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
            `${dayjs(start).format('DD.MM.')} - ${dayjs(end).format('DD.MM.YYYY')}`,
        }}
        popup
        step={60}
        showMultiDayTimes
        view={currentView}
        onView={(view) => setCurrentView(view as 'month' | 'week' | 'day')}
        views={['month', 'week', 'day']}
        showAllEvents
        doShowMoreDrillDown={false}
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