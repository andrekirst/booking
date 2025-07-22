import { render, screen } from '@testing-library/react';
import BookingAccommodations from '../BookingAccommodations';
import { Booking, BookingStatus, SleepingAccommodation } from '../../../../lib/types/api';

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

const mockAccommodations: SleepingAccommodation[] = [
  {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Hauptschlafzimmer',
    maxCapacity: 2,
    description: 'Gemütliches Hauptschlafzimmer',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    changedAt: undefined,
  },
  {
    id: '789e1234-e89b-12d3-a456-426614174002',
    name: 'Gästezimmer',
    maxCapacity: 2,
    description: 'Komfortables Gästezimmer',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    changedAt: undefined,
  },
];

const mockGetAccommodationName = (accommodationId: string): string => {
  const accommodation = mockAccommodations.find(acc => acc.id === accommodationId);
  return accommodation?.name || 'Unbekannter Schlafplatz';
};

describe('BookingAccommodations', () => {
  const defaultProps = {
    booking: mockBooking,
    accommodations: mockAccommodations,
    accommodationsError: null,
    getAccommodationName: mockGetAccommodationName,
  };

  describe('Rendering', () => {
    it('should display the section title', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      expect(screen.getByText('Schlafmöglichkeiten')).toBeInTheDocument();
    });

    it('should display all accommodation items', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      expect(screen.getByText('Hauptschlafzimmer')).toBeInTheDocument();
      expect(screen.getByText('Gästezimmer')).toBeInTheDocument();
    });

    it('should display person count for each accommodation', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      expect(screen.getAllByText('2 Personen')).toHaveLength(2);
    });

    it('should display singular person count correctly', () => {
      const singlePersonBooking = {
        ...mockBooking,
        bookingItems: [{
          sleepingAccommodationId: '456e7890-e89b-12d3-a456-426614174001',
          sleepingAccommodationName: 'Einzelzimmer',
          personCount: 1,
        }],
      };
      
      render(<BookingAccommodations {...defaultProps} booking={singlePersonBooking} />);
      
      expect(screen.getByText('1 Person')).toBeInTheDocument();
    });

    it('should not display error message when accommodationsError is null', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      expect(screen.queryByText('Namen konnten nicht geladen werden')).not.toBeInTheDocument();
    });

    it('should display error message when accommodationsError is present', () => {
      render(<BookingAccommodations {...defaultProps} accommodationsError="API Error" />);
      
      expect(screen.getByText('Namen konnten nicht geladen werden')).toBeInTheDocument();
    });
  });

  describe('Accommodation Name Resolution', () => {
    it('should use getAccommodationName function to resolve names', () => {
      const mockGetName = jest.fn().mockImplementation(mockGetAccommodationName);
      
      // Remove accommodations prop to force fallback to getAccommodationName
      render(<BookingAccommodations {...defaultProps} accommodations={[]} getAccommodationName={mockGetName} />);
      
      expect(mockGetName).toHaveBeenCalledWith('456e7890-e89b-12d3-a456-426614174001');
      expect(mockGetName).toHaveBeenCalledWith('789e1234-e89b-12d3-a456-426614174002');
      expect(mockGetName).toHaveBeenCalledTimes(2);
    });

    it('should display fallback name for unknown accommodations', () => {
      const unknownBooking = {
        ...mockBooking,
        bookingItems: [{
          sleepingAccommodationId: 'unknown-id',
          sleepingAccommodationName: 'Unknown',
          personCount: 1,
        }],
      };
      
      render(<BookingAccommodations {...defaultProps} booking={unknownBooking} />);
      
      expect(screen.getByText('Unbekannter Schlafplatz')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper main container classes', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('mb-8');
    });

    it('should use grid layout for accommodation items', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      const gridDiv = container.querySelector('.grid');
      expect(gridDiv).toBeInTheDocument();
      expect(gridDiv).toHaveClass('gap-4');
    });

    it('should have green background for accommodation cards', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      const cards = container.querySelectorAll('.border-green-200.bg-green-50');
      expect(cards.length).toBe(2);
      
      cards.forEach(card => {
        expect(card).toHaveClass('border-green-200', 'bg-green-50');
      });
    });

    it('should have rounded corners for accommodation cards', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      const cards = container.querySelectorAll('.rounded-xl');
      expect(cards.length).toBeGreaterThan(0);
      
      cards.forEach(card => {
        expect(card).toHaveClass('rounded-xl');
      });
    });
  });

  describe('Icons and Visual Elements', () => {
    it('should display accommodation icons', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      const iconContainers = container.querySelectorAll('.bg-green-100.text-green-600');
      expect(iconContainers.length).toBe(2);
    });

    it('should display person count icons', () => {
      const { container } = render(<BookingAccommodations {...defaultProps} />);
      
      // Check for SVG icons (accommodation icons and person icons)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBe(4); // 2 accommodation icons + 2 person icons
      
      // Check that person icons are in the person count badges
      const personCountBadges = container.querySelectorAll('.bg-white.rounded-full');
      expect(personCountBadges.length).toBe(2);
      personCountBadges.forEach(badge => {
        const svg = badge.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message with proper styling', () => {
      render(<BookingAccommodations {...defaultProps} accommodationsError="API Error" />);
      
      const errorDiv = screen.getByText('Namen konnten nicht geladen werden');
      expect(errorDiv).toHaveClass('text-sm', 'text-red-600', 'bg-red-50');
    });

    it('should still display accommodations when error is present', () => {
      render(<BookingAccommodations {...defaultProps} accommodationsError="API Error" />);
      
      expect(screen.getByText('Hauptschlafzimmer')).toBeInTheDocument();
      expect(screen.getByText('Gästezimmer')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle booking with no items gracefully', () => {
      const emptyBooking = { ...mockBooking, bookingItems: [] };
      
      render(<BookingAccommodations {...defaultProps} booking={emptyBooking} />);
      
      expect(screen.getByText('Schlafmöglichkeiten')).toBeInTheDocument();
      expect(screen.queryByText('Hauptschlafzimmer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for section title', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Schlafmöglichkeiten' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should have proper text contrast and readability', () => {
      render(<BookingAccommodations {...defaultProps} />);
      
      const accommodationNames = screen.getAllByText(/schlafzimmer/i);
      accommodationNames.forEach(name => {
        expect(name).toHaveClass('font-medium', 'text-gray-900');
      });
    });
  });
});