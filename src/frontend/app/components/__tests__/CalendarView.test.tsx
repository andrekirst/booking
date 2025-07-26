import React from 'react';
import { render, screen } from '@testing-library/react';
import CalendarView from '../CalendarView';
import { Booking, BookingStatus } from '../../../lib/types/api';

// Mock react-big-calendar to avoid calendar rendering issues in tests
jest.mock('react-big-calendar', () => ({
  Calendar: ({ localizer, events, messages }: { localizer?: unknown; events: unknown[]; messages?: unknown }) => (
    <div data-testid="calendar">
      <div data-testid="localizer-type">{localizer ? 'dayjs-localizer' : 'no-localizer'}</div>
      <div data-testid="events-count">{events.length}</div>
      <div data-testid="messages">{JSON.stringify(messages)}</div>
    </div>
  ),
  dayjsLocalizer: (dayjs: unknown) => ({
    type: 'dayjs-localizer',
    dayjs: dayjs
  })
}));

describe('CalendarView', () => {
  const mockBookings: Booking[] = [
    {
      id: '1',
      userId: 1,
      userName: 'Test User 1',
      userEmail: 'user1@example.com',
      startDate: '2025-07-25',
      endDate: '2025-07-27',
      totalPersons: 2,
      numberOfNights: 2,
      status: BookingStatus.Confirmed,
      createdAt: '2025-07-25T10:00:00Z',
      bookingItems: []
    },
    {
      id: '2',
      userId: 2,
      userName: 'Test User 2',
      userEmail: 'user2@example.com',
      startDate: '2025-07-28',
      endDate: '2025-07-30',
      totalPersons: 4,
      numberOfNights: 2,
      status: BookingStatus.Pending,
      createdAt: '2025-07-25T11:00:00Z',
      bookingItems: []
    }
  ];

  it('should render calendar with dayjs localizer', () => {
    const mockOnSelectBooking = jest.fn();

    render(
      <CalendarView 
        bookings={mockBookings} 
        onSelectBooking={mockOnSelectBooking} 
      />
    );

    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.getByTestId('localizer-type')).toHaveTextContent('dayjs-localizer');
  });

  it('should display correct number of events', () => {
    const mockOnSelectBooking = jest.fn();

    render(
      <CalendarView 
        bookings={mockBookings} 
        onSelectBooking={mockOnSelectBooking} 
      />
    );

    expect(screen.getByTestId('events-count')).toHaveTextContent('2');
  });

  it('should use German messages', () => {
    const mockOnSelectBooking = jest.fn();

    render(
      <CalendarView 
        bookings={mockBookings} 
        onSelectBooking={mockOnSelectBooking} 
      />
    );

    const messagesText = screen.getByTestId('messages').textContent;
    expect(messagesText).toContain('Ganztägig');
    expect(messagesText).toContain('Zurück');
    expect(messagesText).toContain('Weiter');
    expect(messagesText).toContain('Heute');
    expect(messagesText).toContain('Monat');
  });

  it('should render with empty bookings array', () => {
    const mockOnSelectBooking = jest.fn();

    render(
      <CalendarView 
        bookings={[]} 
        onSelectBooking={mockOnSelectBooking} 
      />
    );

    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
  });
});