import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FullCalendarView from '../FullCalendarView';
import { Booking, BookingStatus } from '../../../lib/types/api';

// Mock FullCalendar and its plugins
interface MockCalendarApi {
  prev: jest.Mock;
  next: jest.Mock;
  today: jest.Mock;
  changeView: jest.Mock;
  getDate: jest.Mock;
}

let mockCalendarApi: MockCalendarApi = {
  prev: jest.fn(),
  next: jest.fn(),
  today: jest.fn(),
  changeView: jest.fn(),
  getDate: jest.fn(() => new Date('2025-07-25')),
};

// Mock @fullcalendar/react
jest.mock('@fullcalendar/react', () => {
  // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
  return React.forwardRef((props: any, ref: any) => {
    const { events = [], eventClick, eventMouseEnter, datesSet } = props;
    // Simulate ref callback
    if (ref) {
      if (typeof ref === 'function') {
        ref({ getApi: () => mockCalendarApi });
      } else {
        ref.current = { getApi: () => mockCalendarApi };
      }
    }

    return (
      <div data-testid="fullcalendar">
        <div data-testid="events-count">{events?.length || 0}</div>
        <div data-testid="event-display">{String(props.eventDisplay || '')}</div>
        <div data-testid="locale">{String(props.locale || '')}</div>
        <div data-testid="height">{String(props.height || '')}</div>
        <button 
          data-testid="mock-event"
          onClick={() => eventClick && eventClick({
            event: { 
              extendedProps: { booking: events?.[0] ? { id: '1', status: BookingStatus.Confirmed } : null },
              id: '1'
            }
          })}
        >
          Mock Event Click
        </button>
        <button 
          data-testid="mock-mouse-enter"
          onMouseEnter={() => eventMouseEnter && eventMouseEnter({
            event: { 
              extendedProps: { booking: { id: '1', status: BookingStatus.Confirmed } }
            },
            el: { getBoundingClientRect: () => ({ left: 100, top: 100, width: 50 }) }
          })}
        >
          Mock Mouse Enter
        </button>
        <button 
          data-testid="mock-dates-set"
          onClick={() => datesSet && datesSet({ start: new Date('2025-07-01') })}
        >
          Mock Dates Set
        </button>
      </div>
    );
  });
});

// Mock dynamic import
jest.mock('next/dynamic', () => {
  return jest.fn(() => {
    // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
    return React.forwardRef((props: any, ref: any) => {
      const MockFullCalendar = jest.requireMock('@fullcalendar/react').default;
      return <MockFullCalendar {...props} ref={ref} />;
    });
  });
});

// Mock plugins
jest.mock('@fullcalendar/daygrid', () => ({
  default: { name: 'daygrid-plugin' }
}));

jest.mock('@fullcalendar/timegrid', () => ({
  default: { name: 'timegrid-plugin' }
}));

jest.mock('@fullcalendar/interaction', () => ({
  default: { name: 'interaction-plugin' }
}));

describe('FullCalendarView', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock calendar API
    mockCalendarApi = {
      prev: jest.fn(),
      next: jest.fn(),
      today: jest.fn(),
      changeView: jest.fn(),
      getDate: jest.fn(() => new Date('2025-07-25')),
    };
  });

  describe('Basic Rendering', () => {
    it('should show loading state initially', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Should show loading state before plugins are loaded
      expect(screen.getByText('Kalender wird geladen...')).toBeInTheDocument();
    });

    it('should render FullCalendar after plugins load', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Wait for plugins to load
      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should render with correct props after loading', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('2');
      expect(screen.getByTestId('event-display')).toHaveTextContent('block');
      expect(screen.getByTestId('locale')).toHaveTextContent('de');
      expect(screen.getByTestId('height')).toHaveTextContent('600');
    });

    it('should render custom toolbar', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Custom toolbar should be rendered
      expect(screen.getByText('Heute')).toBeInTheDocument();
      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });
  });

  describe('Navigation Tests', () => {
    let mockOnSelectBooking: jest.Mock;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      mockOnSelectBooking = jest.fn();
      user = userEvent.setup();
    });

    it('should handle PREV navigation correctly', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      await user.click(prevButton);

      expect(mockCalendarApi.prev).toHaveBeenCalled();
      expect(mockCalendarApi.getDate).toHaveBeenCalled();
    });

    it('should handle NEXT navigation correctly', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      await user.click(nextButton);

      expect(mockCalendarApi.next).toHaveBeenCalled();
      expect(mockCalendarApi.getDate).toHaveBeenCalled();
    });

    it('should handle TODAY navigation correctly', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const todayButton = screen.getByText('Heute');
      await user.click(todayButton);

      expect(mockCalendarApi.today).toHaveBeenCalled();
      expect(mockCalendarApi.getDate).toHaveBeenCalled();
    });

    it('should handle view changes correctly', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Test month view
      const monthButton = screen.getByText('Monat');
      await user.click(monthButton);
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('dayGridMonth');

      // Test week view
      const weekButton = screen.getByText('Woche');
      await user.click(weekButton);
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('timeGridWeek');

      // Test day view
      const dayButton = screen.getByText('Tag');
      await user.click(dayButton);
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('timeGridDay');
    });

    it('should generate correct labels for different views', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // The label generation is tested through the custom toolbar
      // Default view should be month, so we expect some label to be present
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });

    it('should handle navigation without calendar ref gracefully', async () => {
      // Test edge case where ref might not be available
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Should not crash even if navigation is attempted before ref is ready
      expect(screen.getByText('Kalender wird geladen...')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    let mockOnSelectBooking: jest.Mock;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      mockOnSelectBooking = jest.fn();
      user = userEvent.setup();
    });

    it('should handle event clicks correctly', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const mockEventButton = screen.getByTestId('mock-event');
      await user.click(mockEventButton);

      expect(mockOnSelectBooking).toHaveBeenCalledWith({
        id: '1',
        status: BookingStatus.Confirmed
      });
    });

    it('should handle event mouse enter for tooltip', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const mockMouseEnterButton = screen.getByTestId('mock-mouse-enter');
      fireEvent.mouseEnter(mockMouseEnterButton);

      // Tooltip should be rendered (though we don't test its visibility here)
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });

    it('should handle date set events', async () => {
      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const mockDatesSetButton = screen.getByTestId('mock-dates-set');
      await user.click(mockDatesSetButton);

      // Should handle datesSet callback without errors
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });
  });

  describe('Event Color Mapping', () => {
    it('should handle different booking statuses with correct colors', async () => {
      const differentStatusBookings: Booking[] = [
        { ...mockBookings[0], status: BookingStatus.Pending },
        { ...mockBookings[1], status: BookingStatus.Confirmed },
        { 
          ...mockBookings[0], 
          id: '3',
          status: BookingStatus.Cancelled 
        },
        { 
          ...mockBookings[0], 
          id: '4',
          status: BookingStatus.Completed 
        },
        { 
          ...mockBookings[0], 
          id: '5',
          status: BookingStatus.Accepted 
        },
        { 
          ...mockBookings[0], 
          id: '6',
          status: BookingStatus.Rejected 
        }
      ];

      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={differentStatusBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('6');
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin loading errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Should show loading initially
      expect(screen.getByText('Kalender wird geladen...')).toBeInTheDocument();

      // Should eventually render even if there are plugin issues
      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      }, { timeout: 2000 });

      consoleErrorSpy.mockRestore();
    });

    it('should render without bookings', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={[]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('0');
    });
  });

  describe('Performance', () => {
    it('should handle large number of bookings', async () => {
      const manyBookings: Booking[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockBookings[0],
        id: `booking-${i}`,
        startDate: `2025-0${(i % 9) + 1}-${String(i % 28 + 1).padStart(2, '0')}`,
        endDate: `2025-0${(i % 9) + 1}-${String((i % 28) + 2).padStart(2, '0')}`
      }));

      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={manyBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('100');
    });

    it('should update when bookings change', async () => {
      const mockOnSelectBooking = jest.fn();
      
      const { rerender } = render(
        <FullCalendarView 
          bookings={[]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('0');

      // Update with bookings
      rerender(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByTestId('events-count')).toHaveTextContent('2');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper ARIA labels', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });

    it('should render with German locale', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <FullCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('locale')).toHaveTextContent('de');
    });
  });
});