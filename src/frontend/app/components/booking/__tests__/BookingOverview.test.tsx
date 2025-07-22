import { render, screen } from '@testing-library/react';
import BookingOverview from '../BookingOverview';
import { Booking, BookingStatus } from '../../../../lib/types/api';

const mockBooking: Booking = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: 1,
  startDate: '2024-03-15T00:00:00Z',
  endDate: '2024-03-17T00:00:00Z',
  numberOfNights: 2,
  totalPersons: 4,
  status: BookingStatus.Confirmed,
  bookingItems: [],
  notes: 'Test notes',
  createdAt: '2024-03-01T10:00:00Z',
  changedAt: '2024-03-02T15:30:00Z',
};

describe('BookingOverview', () => {
  describe('Rendering', () => {
    it('should display total persons correctly', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
    });

    it('should display number of nights correctly for plural', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });

    it('should display number of nights correctly for singular', () => {
      const singleNightBooking = { ...mockBooking, numberOfNights: 1 };
      render(<BookingOverview booking={singleNightBooking} />);
      
      expect(screen.getByText('1 Nacht')).toBeInTheDocument();
    });

    it('should display booking ID', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText(`ID: ${mockBooking.id}`)).toBeInTheDocument();
    });

    it('should display persons and nights with connecting word', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
      expect(screen.getByText('für')).toBeInTheDocument();
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should display persons and nights icons', () => {
      const { container } = render(<BookingOverview booking={mockBooking} />);
      
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBe(2);
    });
  });

  describe('Layout', () => {
    it('should have proper CSS classes for styling', () => {
      const { container } = render(<BookingOverview booking={mockBooking} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-6');
    });

    it('should center align content', () => {
      const { container } = render(<BookingOverview booking={mockBooking} />);
      
      const centerDiv = container.querySelector('.text-center');
      expect(centerDiv).toBeInTheDocument();
    });

    it('should have border separator for booking ID', () => {
      const { container } = render(<BookingOverview booking={mockBooking} />);
      
      const borderDiv = container.querySelector('.border-t');
      expect(borderDiv).toBeInTheDocument();
      expect(borderDiv).toHaveClass('border-gray-100');
    });
  });

  describe('Data variations', () => {
    it('should handle large numbers correctly', () => {
      const largeBooking = { 
        ...mockBooking, 
        totalPersons: 10, 
        numberOfNights: 14 
      };
      render(<BookingOverview booking={largeBooking} />);
      
      expect(screen.getByText('10 Personen')).toBeInTheDocument();
      expect(screen.getByText('14 Nächte')).toBeInTheDocument();
    });

    it('should handle long booking IDs', () => {
      const longIdBooking = { 
        ...mockBooking, 
        id: 'very-long-booking-id-that-might-overflow-the-container-width-123456789'
      };
      render(<BookingOverview booking={longIdBooking} />);
      
      expect(screen.getByText(`ID: ${longIdBooking.id}`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use proper semantic structure', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      // Check that the booking ID text has proper truncate class for overflow
      const bookingIdElement = screen.getByText(`ID: ${mockBooking.id}`);
      expect(bookingIdElement).toHaveClass('truncate');
    });

    it('should have proper font styling for readability', () => {
      render(<BookingOverview booking={mockBooking} />);
      
      const personsText = screen.getByText('4 Personen');
      expect(personsText).toHaveClass('text-2xl', 'font-bold');
      
      const nightsText = screen.getByText('2 Nächte');
      expect(nightsText).toHaveClass('text-2xl', 'font-bold');
    });
  });
});