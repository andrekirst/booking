import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingTooltip from '../BookingTooltip';
import { Booking, BookingStatus } from '../../../lib/types/api';

const mockBooking: Booking = {
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
    { sleepingAccommodationId: '1', sleepingAccommodationName: 'Room 1', personCount: 2 },
    { sleepingAccommodationId: '2', sleepingAccommodationName: 'Room 2', personCount: 2 }
  ],
  createdAt: '2024-03-01T00:00:00Z'
};

describe('BookingTooltip', () => {
  it('does not render when not visible', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={false}
      />
    );

    expect(screen.queryByText('Buchungsdetails')).not.toBeInTheDocument();
  });

  it('renders when visible', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
  });

  it('displays correct booking status', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Bestätigt')).toBeInTheDocument();
  });

  it('displays formatted date range', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
  });

  it('displays total persons count', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Personen')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays number of nights', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Nächte')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays number of rooms (booking items)', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Schlafmöglichkeiten')).toBeInTheDocument();
    expect(screen.getByText('2 Räume')).toBeInTheDocument();
  });

  it('displays single room correctly', () => {
    const singleRoomBooking = {
      ...mockBooking,
      bookingItems: [mockBooking.bookingItems[0]]
    };

    render(
      <BookingTooltip
        booking={singleRoomBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('1 Raum')).toBeInTheDocument();
  });

  it('displays click hint', () => {
    render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    expect(screen.getByText('Klicken für Details')).toBeInTheDocument();
  });

  it('positions tooltip correctly', () => {
    const { container } = render(
      <BookingTooltip
        booking={mockBooking}
        position={{ x: 150, y: 200 }}
        visible={true}
      />
    );

    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip).toHaveStyle({
      left: '160px', // x + 10
      top: '190px',  // y - 10
    });
  });

  it('handles different booking statuses correctly', () => {
    const statuses = [
      { status: BookingStatus.Pending, text: 'Ausstehend' },
      { status: BookingStatus.Accepted, text: 'Angenommen' },
      { status: BookingStatus.Cancelled, text: 'Storniert' },
      { status: BookingStatus.Rejected, text: 'Abgelehnt' },
      { status: BookingStatus.Completed, text: 'Abgeschlossen' }
    ];

    statuses.forEach(({ status, text }) => {
      const booking = { ...mockBooking, status };
      
      const { rerender } = render(
        <BookingTooltip
          booking={booking}
          position={{ x: 100, y: 100 }}
          visible={true}
        />
      );

      expect(screen.getByText(text)).toBeInTheDocument();

      rerender(
        <BookingTooltip
          booking={booking}
          position={{ x: 100, y: 100 }}
          visible={false}
        />
      );
    });
  });

  it('applies correct CSS classes for different statuses', () => {
    const pendingBooking = { ...mockBooking, status: BookingStatus.Pending };
    
    render(
      <BookingTooltip
        booking={pendingBooking}
        position={{ x: 100, y: 100 }}
        visible={true}
      />
    );

    const statusBadge = screen.getByText('Ausstehend');
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });
});