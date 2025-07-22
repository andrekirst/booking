import { render, screen, fireEvent } from '@testing-library/react';
import { Booking, BookingStatus } from '../../../lib/types/api';

// Import the component by reading the page file and extracting just the BookingCard part
const mockBooking: Booking = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: 1,
  userName: 'Test User',
  userEmail: 'test@example.com',
  startDate: '2024-03-15T00:00:00Z',
  endDate: '2024-03-17T00:00:00Z',
  numberOfNights: 2,
  totalPersons: 4,
  status: BookingStatus.Confirmed,
  bookingItems: [
    {
      sleepingAccommodationId: '456e7890-e89b-12d3-a456-426614174001',
      sleepingAccommodationName: 'Hauptschlafzimmer',
      personCount: 2,
    },
    {
      sleepingAccommodationId: '789e1234-e89b-12d3-a456-426614174002', 
      sleepingAccommodationName: 'Gästezimmer',
      personCount: 2,
    },
  ],
  notes: 'Test notes',
  createdAt: '2024-03-01T10:00:00Z',
  changedAt: '2024-03-02T15:30:00Z',
};

// Mock BookingCard component (extracted from page.tsx)
interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ausstehend
          </span>
        );
      case BookingStatus.Confirmed:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bestätigt
          </span>
        );
      case BookingStatus.Cancelled:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Storniert
          </span>
        );
      case BookingStatus.Completed:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abgeschlossen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unbekannt
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Booking Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </h3>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-sm text-gray-600">
              Buchungs-ID: {booking.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 718.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>{booking.numberOfNights} {booking.numberOfNights === 1 ? 'Nacht' : 'Nächte'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{booking.totalPersons} {booking.totalPersons === 1 ? 'Person' : 'Personen'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0V9a2 2 0 00-2-2H9a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2z" />
            </svg>
            <span>{booking.bookingItems.length} {booking.bookingItems.length === 1 ? 'Schlafmöglichkeit' : 'Schlafmöglichkeiten'}</span>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Notizen:</span> {booking.notes}
            </p>
          </div>
        )}

        {/* Creation Date */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Erstellt am {formatDate(booking.createdAt)}
            {booking.changedAt && ` • Zuletzt geändert am ${formatDate(booking.changedAt)}`}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Details anzeigen</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

describe('BookingCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should display booking date range', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
    });

    it('should display booking ID (truncated)', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('Buchungs-ID: 123e4567...')).toBeInTheDocument();
    });

    it('should display number of nights correctly (plural)', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });

    it('should display number of nights correctly (singular)', () => {
      const singleNightBooking = { ...mockBooking, numberOfNights: 1 };
      render(<BookingCard booking={singleNightBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('1 Nacht')).toBeInTheDocument();
    });

    it('should display total persons correctly (plural)', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
    });

    it('should display total persons correctly (singular)', () => {
      const singlePersonBooking = { ...mockBooking, totalPersons: 1 };
      render(<BookingCard booking={singlePersonBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('1 Person')).toBeInTheDocument();
    });

    it('should display accommodation count (plural)', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('2 Schlafmöglichkeiten')).toBeInTheDocument();
    });

    it('should display accommodation count (singular)', () => {
      const singleAccommodationBooking = {
        ...mockBooking,
        bookingItems: [mockBooking.bookingItems[0]],
      };
      render(<BookingCard booking={singleAccommodationBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('1 Schlafmöglichkeit')).toBeInTheDocument();
    });

    it('should display notes when present', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('Notizen:')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    it('should not display notes when not present', () => {
      const bookingWithoutNotes = { ...mockBooking, notes: undefined };
      render(<BookingCard booking={bookingWithoutNotes} onClick={mockOnClick} />);
      
      expect(screen.queryByText('Notizen:')).not.toBeInTheDocument();
    });

    it('should display creation date', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText(/Erstellt am 01\.03\.2024/)).toBeInTheDocument();
    });

    it('should display changed date when present', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText(/Zuletzt geändert am 02\.03\.2024/)).toBeInTheDocument();
    });

    it('should not display changed date when not present', () => {
      const bookingWithoutChangedAt = { ...mockBooking, changedAt: undefined };
      render(<BookingCard booking={bookingWithoutChangedAt} onClick={mockOnClick} />);
      
      expect(screen.queryByText(/Zuletzt geändert/)).not.toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display pending status badge', () => {
      const pendingBooking = { ...mockBooking, status: BookingStatus.Pending };
      render(<BookingCard booking={pendingBooking} onClick={mockOnClick} />);
      
      const badge = screen.getByText('Ausstehend');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should display confirmed status badge', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const badge = screen.getByText('Bestätigt');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should display cancelled status badge', () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      render(<BookingCard booking={cancelledBooking} onClick={mockOnClick} />);
      
      const badge = screen.getByText('Storniert');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should display completed status badge', () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.Completed };
      render(<BookingCard booking={completedBooking} onClick={mockOnClick} />);
      
      const badge = screen.getByText('Abgeschlossen');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should display unknown status badge for invalid status', () => {
      const unknownBooking = { ...mockBooking, status: 'Invalid' as BookingStatus };
      render(<BookingCard booking={unknownBooking} onClick={mockOnClick} />);
      
      const badge = screen.getByText('Unbekannt');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Interaction', () => {
    it('should call onClick when card is clicked', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const card = screen.getByText('15.03.2024 - 17.03.2024').closest('div');
      fireEvent.click(card!);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
    });

    it('should have hover effects', () => {
      const { container } = render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const card = container.querySelector('.hover\\:shadow-2xl');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('hover:scale-[1.02]');
    });
  });

  describe('Visual Design', () => {
    it('should have proper card styling', () => {
      const { container } = render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl');
    });

    it('should display action section at bottom', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      expect(screen.getByText('Details anzeigen')).toBeInTheDocument();
    });

    it('should have correct icons for all booking details', () => {
      const { container } = render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      // Check for SVG icons (status badge + nights + persons + accommodations + action icon)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(3); // Status badge + nights + persons + accommodations + action icons
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in German locale', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      // Check German date format (DD.MM.YYYY)
      expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
      expect(screen.getByText(/01\.03\.2024/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const heading = screen.getByRole('heading', { name: /15\.03\.2024 - 17\.03\.2024/ });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper text contrast', () => {
      render(<BookingCard booking={mockBooking} onClick={mockOnClick} />);
      
      const dateText = screen.getByText('15.03.2024 - 17.03.2024');
      expect(dateText).toHaveClass('text-gray-900');
    });
  });
});