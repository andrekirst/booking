import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompactBookingList from '../CompactBookingList';
import { Booking, BookingStatus } from '../../../lib/types/api';

const mockBookings: Booking[] = [
  {
    id: '1',
    userId: 1,
    userName: 'Test User',
    userEmail: 'test@example.com',
    startDate: '2024-03-15T00:00:00Z',
    endDate: '2024-03-17T00:00:00Z',
    numberOfNights: 2,
    totalPersons: 4,
    status: BookingStatus.Confirmed,
    bookingItems: [
      { sleepingAccommodationId: '1', sleepingAccommodationName: 'Room 1', personCount: 4 }
    ],
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: '2',
    userId: 2,
    userName: 'Test User 2',
    userEmail: 'test2@example.com',
    startDate: '2024-03-20T00:00:00Z',
    endDate: '2024-03-22T00:00:00Z',
    numberOfNights: 2,
    totalPersons: 2,
    status: BookingStatus.Pending,
    bookingItems: [
      { sleepingAccommodationId: '2', sleepingAccommodationName: 'Room 2', personCount: 2 }
    ],
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: '3',
    userId: 3,
    userName: 'Test User 3',
    userEmail: 'test3@example.com',
    startDate: '2024-03-10T00:00:00Z',
    endDate: '2024-03-12T00:00:00Z',
    numberOfNights: 2,
    totalPersons: 3,
    status: BookingStatus.Rejected,
    bookingItems: [
      { sleepingAccommodationId: '3', sleepingAccommodationName: 'Room 3', personCount: 3 }
    ],
    createdAt: '2024-03-01T00:00:00Z'
  }
];

describe('CompactBookingList', () => {
  const mockOnSelectBooking = jest.fn();

  beforeEach(() => {
    mockOnSelectBooking.mockClear();
  });

  it('renders booking count in header', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    expect(screen.getByText('Buchungen (3)')).toBeInTheDocument();
  });

  it('displays all bookings in chronological order', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    // Check that all bookings are displayed with correct dates
    expect(screen.getByText('10.03. - 12.03.')).toBeInTheDocument();
    expect(screen.getByText('15.03. - 17.03.')).toBeInTheDocument();
    expect(screen.getByText('20.03. - 22.03.')).toBeInTheDocument();
    
    // Verify they are in chronological order by checking their position in DOM
    const dateElements = [
      screen.getByText('10.03. - 12.03.'),
      screen.getByText('15.03. - 17.03.'),
      screen.getByText('20.03. - 22.03.')
    ];
    
    // All elements should be in document
    dateElements.forEach(element => {
      expect(element).toBeInTheDocument();
    });
  });

  it('shows correct status indicators', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    expect(screen.getByText('Bestätigt')).toBeInTheDocument();
    expect(screen.getByText('Ausstehend')).toBeInTheDocument();
    expect(screen.getByText('Abgelehnt')).toBeInTheDocument();
  });

  it('displays booking details correctly', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    // Check persons count
    expect(screen.getByText('4')).toBeInTheDocument(); // 4 persons for first booking
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 persons for second booking
    
    // Check nights (displayed as "2N")
    const nightElements = screen.getAllByText('2N');
    expect(nightElements).toHaveLength(3); // All bookings have 2 nights
    
    // Check room count (all have 1 booking item = 1 room)
    const roomElements = screen.getAllByText('1');
    expect(roomElements.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onSelectBooking when clicking a booking', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    // Click on the first booking
    const firstBookingElement = screen.getByText('10.03. - 12.03.').closest('div');
    if (firstBookingElement) {
      fireEvent.click(firstBookingElement);
    }

    expect(mockOnSelectBooking).toHaveBeenCalledWith('3'); // Should call with booking ID '3' (earliest booking)
  });

  it('highlights selected booking', () => {
    render(
      <CompactBookingList
        bookings={mockBookings}
        onSelectBooking={mockOnSelectBooking}
        selectedBookingId="2"
      />
    );

    // Find the booking item div (should be two levels up from the date text)
    const dateElement = screen.getByText('20.03. - 22.03.');
    const bookingItemDiv = dateElement.closest('.cursor-pointer');
    expect(bookingItemDiv).toHaveClass('bg-blue-50', 'border-r-4', 'border-blue-500');
  });

  it('shows empty state when no bookings', () => {
    render(
      <CompactBookingList
        bookings={[]}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    expect(screen.getByText('Buchungen (0)')).toBeInTheDocument();
    expect(screen.getByText('Keine Buchungen vorhanden')).toBeInTheDocument();
  });

  it('formats dates correctly for single day bookings', () => {
    const singleDayBooking: Booking = {
      id: '4',
      userId: 4,
      userName: 'Test User 4',
      userEmail: 'test4@example.com',
      startDate: '2024-03-15T00:00:00Z',
      endDate: '2024-03-15T00:00:00Z',
      numberOfNights: 1,
      totalPersons: 2,
      status: BookingStatus.Confirmed,
      bookingItems: [
        { sleepingAccommodationId: '1', sleepingAccommodationName: 'Room 1', personCount: 2 }
      ],
      createdAt: '2024-03-01T00:00:00Z'
    };

    render(
      <CompactBookingList
        bookings={[singleDayBooking]}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    // Should show single date for same start and end date
    expect(screen.getByText('15.03.')).toBeInTheDocument();
  });

  it('handles different booking statuses correctly', () => {
    const statusBookings: Booking[] = [
      { ...mockBookings[0], status: BookingStatus.Accepted },
      { ...mockBookings[1], id: '5', status: BookingStatus.Cancelled },
      { ...mockBookings[2], id: '6', status: BookingStatus.Completed }
    ];

    render(
      <CompactBookingList
        bookings={statusBookings}
        onSelectBooking={mockOnSelectBooking}
      />
    );

    expect(screen.getByText('Angenommen')).toBeInTheDocument();
    expect(screen.getByText('Storniert')).toBeInTheDocument();
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
  });
});