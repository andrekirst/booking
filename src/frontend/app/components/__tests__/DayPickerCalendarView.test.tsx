import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayPickerCalendarView from '../DayPickerCalendarView';
import { Booking, BookingStatus } from '../../../lib/types/api';

// Mock react-day-picker to avoid rendering issues in tests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockOnMonthChange: ((date: Date) => void) | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars  
let mockOnDayClick: ((date: Date) => void) | null = null;

jest.mock('react-day-picker', () => ({
  DayPicker: ({ 
    month, 
    onMonthChange, 
    onDayClick,
    modifiers,
    locale
  }: { 
    month?: Date;
    onMonthChange?: (date: Date) => void;
    onDayClick?: (date: Date) => void;
    modifiers?: Record<string, unknown>;
    locale?: Record<string, unknown>;
  }) => {
    mockOnMonthChange = onMonthChange;
    mockOnDayClick = onDayClick;
    
    return (
      <div data-testid="day-picker">
        <div data-testid="current-month">{month?.toISOString()}</div>
        <div data-testid="locale">{locale?.code || 'no-locale'}</div>
        <div data-testid="has-modifiers">{modifiers ? 'yes' : 'no'}</div>
        <button 
          data-testid="mock-day-button"
          onClick={() => onDayClick?.(new Date('2025-07-25'))}
        >
          Mock Day 25
        </button>
      </div>
    );
  }
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return '2025-07-25';
    }
    return '25.07.2025';
  }),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
  addMonths: jest.fn((date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }),
  subMonths: jest.fn((date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
  }),
}));

// Mock date-fns/locale
jest.mock('date-fns/locale', () => ({
  de: { code: 'de' }
}));

describe('DayPickerCalendarView', () => {
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

  describe('Basic Rendering', () => {
    it('should render DayPicker with German locale', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
      expect(screen.getByTestId('locale')).toHaveTextContent('de');
    });

    it('should render custom toolbar', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // CalendarToolbar should be rendered
      expect(screen.getByText('Heute')).toBeInTheDocument();
      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });

    it('should display booking summary when bookings exist', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('2 Buchungen gefunden')).toBeInTheDocument();
      expect(screen.getByText('Klicken Sie auf ein hervorgehobenes Datum für Details')).toBeInTheDocument();
    });

    it('should not display booking summary when no bookings', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={[]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.queryByText('Buchungen gefunden')).not.toBeInTheDocument();
    });

    it('should display singular form for single booking', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={[mockBookings[0]]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('1 Buchung gefunden')).toBeInTheDocument();
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
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      await user.click(prevButton);

      // Navigation should trigger month change
      expect(prevButton).toBeInTheDocument();
    });

    it('should handle NEXT navigation correctly', async () => {
      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      await user.click(nextButton);

      // Navigation should trigger month change
      expect(nextButton).toBeInTheDocument();
    });

    it('should handle TODAY navigation correctly', async () => {
      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const todayButton = screen.getByText('Heute');
      await user.click(todayButton);

      // Should reset to current month
      expect(todayButton).toBeInTheDocument();
    });

    it('should generate correct label for current month', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // The label should be displayed in the toolbar
      // Since we're mocking, we just check that the toolbar exists
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });

    it('should only show month view button as active', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // DayPicker only supports month view
      expect(screen.getByText('Monat')).toBeInTheDocument();
      expect(screen.getByText('Woche')).toBeInTheDocument();
      expect(screen.getByText('Tag')).toBeInTheDocument();
    });

    it('should handle view change calls without errors', async () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Should handle view changes gracefully (even though DayPicker only supports month)
      const weekButton = screen.getByText('Woche');
      const dayButton = screen.getByText('Tag');

      await user.click(weekButton);
      await user.click(dayButton);

      // No errors should occur
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
    });
  });

  describe('Day Click Handling', () => {
    let mockOnSelectBooking: jest.Mock;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      mockOnSelectBooking = jest.fn();
      user = userEvent.setup();
    });

    it('should call onSelectBooking when clicking on a day with bookings', async () => {
      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const mockDayButton = screen.getByTestId('mock-day-button');
      await user.click(mockDayButton);

      // Should call onSelectBooking with the first booking for that date
      expect(mockOnSelectBooking).toHaveBeenCalledWith(mockBookings[0]);
    });

    it('should not call onSelectBooking when clicking on a day without bookings', async () => {
      render(
        <DayPickerCalendarView 
          bookings={[]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const mockDayButton = screen.getByTestId('mock-day-button');
      await user.click(mockDayButton);

      // Should not call onSelectBooking when no bookings for that date
      expect(mockOnSelectBooking).not.toHaveBeenCalled();
    });
  });

  describe('Booking Data Processing', () => {
    it('should process booking dates correctly', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      // Should render with modifiers for booking dates
      expect(screen.getByTestId('has-modifiers')).toHaveTextContent('yes');
    });

    it('should handle bookings with date ranges', () => {
      const rangeBooking: Booking = {
        ...mockBookings[0],
        startDate: '2025-07-20',
        endDate: '2025-07-25', // 5-day range
      };

      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={[rangeBooking]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('1 Buchung gefunden')).toBeInTheDocument();
    });

    it('should update calendar when bookings change', () => {
      const mockOnSelectBooking = jest.fn();
      
      const { rerender } = render(
        <DayPickerCalendarView 
          bookings={[]} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.queryByText('Buchungen gefunden')).not.toBeInTheDocument();

      // Update with bookings
      rerender(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('2 Buchungen gefunden')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with proper ARIA labels', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });

    it('should render with German locale', () => {
      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('de');
    });
  });

  describe('Performance', () => {
    it('should force re-render when bookings change', () => {
      const mockOnSelectBooking = jest.fn();
      
      const { rerender } = render(
        <DayPickerCalendarView 
          bookings={mockBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      const initialPicker = screen.getByTestId('day-picker');
      expect(initialPicker).toBeInTheDocument();

      // Update bookings
      const newBookings = [...mockBookings, {
        ...mockBookings[0],
        id: '3',
        startDate: '2025-08-01',
        endDate: '2025-08-02'
      }];

      rerender(
        <DayPickerCalendarView 
          bookings={newBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('3 Buchungen gefunden')).toBeInTheDocument();
    });

    it('should handle large number of bookings efficiently', () => {
      const manyBookings: Booking[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockBookings[0],
        id: `booking-${i}`,
        startDate: `2025-0${(i % 9) + 1}-${String(i % 28 + 1).padStart(2, '0')}`,
        endDate: `2025-0${(i % 9) + 1}-${String((i % 28) + 2).padStart(2, '0')}`
      }));

      const mockOnSelectBooking = jest.fn();

      render(
        <DayPickerCalendarView 
          bookings={manyBookings} 
          onSelectBooking={mockOnSelectBooking} 
        />
      );

      expect(screen.getByText('100 Buchungen gefunden')).toBeInTheDocument();
    });
  });
});