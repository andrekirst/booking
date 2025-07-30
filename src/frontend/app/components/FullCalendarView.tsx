'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { EventClickArg, EventInput, EventHoveringArg, PluginDef, Calendar, DatesSetArg } from '@fullcalendar/core';
import { Booking, BookingStatus } from '../../lib/types/api';
import BookingTooltip from './BookingTooltip';
import CalendarLegend from './CalendarLegend';
import CalendarToolbar from './CalendarToolbar';
import './fullcalendar.css';

// Dynamic import for FullCalendar to avoid SSR issues  
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as React.ComponentType<any>;

interface FullCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export default function FullCalendarView({ bookings, onSelectBooking }: FullCalendarViewProps) {
  const [plugins, setPlugins] = useState<PluginDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const calendarRef = useRef<{ getApi: () => Calendar } | null>(null);

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const [dayGridPlugin, timeGridPlugin, interactionPlugin] = await Promise.all([
          import('@fullcalendar/daygrid'),
          import('@fullcalendar/timegrid'),
          import('@fullcalendar/interaction')
        ]);
        
        setPlugins([dayGridPlugin.default, timeGridPlugin.default, interactionPlugin.default]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading FullCalendar plugins:', error);
        setIsLoading(false);
      }
    };

    loadPlugins();
  }, []);
  
  const [tooltip, setTooltip] = useState<{
    booking: Booking;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    booking: {} as Booking,
    position: { x: 0, y: 0 },
    visible: false,
  });

  // const calendarRef = useRef<HTMLDivElement>(null);

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

  const handleEventMouseEnter = (mouseEnterInfo: EventHoveringArg) => {
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

  // Handle calendar navigation
  const handleNavigate = (navigate: 'PREV' | 'NEXT' | 'TODAY') => {
    if (!calendarRef.current) return;
    
    const calendarApi = calendarRef.current.getApi();
    
    switch (navigate) {
      case 'PREV':
        calendarApi.prev();
        setCurrentDate(calendarApi.getDate());
        break;
      case 'NEXT':
        calendarApi.next();
        setCurrentDate(calendarApi.getDate());
        break;
      case 'TODAY':
        calendarApi.today();
        setCurrentDate(calendarApi.getDate());
        break;
    }
  };

  // Handle view change
  const handleViewChange = (view: 'month' | 'week' | 'day') => {
    if (!calendarRef.current) return;
    
    const calendarApi = calendarRef.current.getApi();
    let fullCalendarView: string;
    
    switch (view) {
      case 'month':
        fullCalendarView = 'dayGridMonth';
        setCurrentView('dayGridMonth');
        break;
      case 'week':
        fullCalendarView = 'timeGridWeek';
        setCurrentView('timeGridWeek');
        break;
      case 'day':
        fullCalendarView = 'timeGridDay';
        setCurrentView('timeGridDay');
        break;
      default:
        fullCalendarView = 'dayGridMonth';
        setCurrentView('dayGridMonth');
    }
    
    calendarApi.changeView(fullCalendarView);
  };

  // Generate label based on current view and date
  const generateLabel = (): string => {
    if (!currentDate) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long',
      year: 'numeric'
    };

    switch (currentView) {
      case 'dayGridMonth':
        return new Intl.DateTimeFormat('de-DE', options).format(currentDate);
      case 'timeGridWeek':
        // Calculate week range
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        
        return `${startOfWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      case 'timeGridDay':
        return currentDate.toLocaleDateString('de-DE', { 
          weekday: 'long', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      default:
        return new Intl.DateTimeFormat('de-DE', options).format(currentDate);
    }
  };

  // Convert FullCalendar view to simplified view
  const getSimplifiedView = (): 'month' | 'week' | 'day' => {
    switch (currentView) {
      case 'timeGridWeek':
        return 'week';
      case 'timeGridDay':
        return 'day';
      default:
        return 'month';
    }
  };

  if (isLoading || plugins.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden">
        <div className="animate-pulse bg-gray-100 h-96 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Kalender wird geladen...</div>
        </div>
        <CalendarLegend />
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden"
      style={{ height: 'fit-content' }}
    >
      {/* Custom Calendar Toolbar */}
      <CalendarToolbar
        label={generateLabel()}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        view={getSimplifiedView()}
      />
      
      <FullCalendar
        ref={calendarRef}
        plugins={plugins}
        initialView="dayGridMonth"
        headerToolbar={false} // Disable internal toolbar
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
        datesSet={(dateInfo: DatesSetArg) => {
          // Update current date when calendar navigates
          setCurrentDate(dateInfo.start);
        }}
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