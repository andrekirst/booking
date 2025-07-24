'use client';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import { Booking, BookingStatus } from '../../lib/types/api';
import { useState } from 'react';
import BookingTooltip from './BookingTooltip';
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

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const booking = event.resource;
    
    return (
      <div 
        className="text-xs"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltip({
            booking,
            position: { x: rect.left + rect.width / 2, y: rect.top },
            visible: true,
          });
        }}
        onMouseLeave={() => {
          setTooltip(prev => ({ ...prev, visible: false }));
        }}
      >
        <div className="font-medium">{event.title}</div>
        <div className="text-white/80">
          {booking.bookingItems.length} {booking.bookingItems.length === 1 ? 'Raum' : 'Räume'}
        </div>
      </div>
    );
  };

  // Custom toolbar with German translations
  const CustomToolbar = ({ 
    label, 
    onNavigate, 
    onView, 
    view 
  }: {
    label: string;
    onNavigate: (navigate: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: 'month' | 'week' | 'day') => void;
    view: string;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
        >
          Heute
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <h2 className="text-lg font-semibold text-black">{label}</h2>
      
      <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'month'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Monat
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'week'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Woche
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            view === 'day'
              ? 'bg-blue-100 text-blue-700'
              : 'text-black hover:text-black hover:bg-gray-50'
          }`}
        >
          Tag
        </button>
      </div>
    </div>
  );

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
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={getEventStyle}
        components={{
          event: CustomEvent,
          toolbar: CustomToolbar,
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
        defaultView="month"
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span className="text-gray-800 font-medium">Ausstehend</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
          <span className="text-gray-800 font-medium">Bestätigt/Angenommen</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-800 font-medium">Storniert/Abgelehnt</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-800 font-medium">Abgeschlossen</span>
        </div>
      </div>
      
      {/* Tooltip */}
      <BookingTooltip
        booking={tooltip.booking}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  );
}