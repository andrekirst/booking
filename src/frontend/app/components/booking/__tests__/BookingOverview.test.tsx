import { render, screen } from '@testing-library/react';
import BookingOverview from '../BookingOverview';
import { Booking, BookingStatus } from '../../../../lib/types/api';
import { ApiProvider } from '../../../../contexts/ApiContext';
import { mockApiClient } from '../../../../lib/api/mock-client';

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
  bookingItems: [],
  notes: 'Test notes',
  createdAt: '2024-03-01T10:00:00Z',
  changedAt: '2024-03-02T15:30:00Z',
};

// Helper function to render components with ApiProvider
const renderWithApiProvider = (component: React.ReactElement) => {
  return render(
    <ApiProvider apiClient={mockApiClient}>
      {component}
    </ApiProvider>
  );
};

describe('BookingOverview', () => {
  describe('Rendering', () => {
    it('should display total persons correctly', () => {
      renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
    });

    it('should display number of nights correctly for plural', () => {
      renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });

    it('should display number of nights correctly for singular', () => {
      const singleNightBooking = { ...mockBooking, numberOfNights: 1 };
      renderWithApiProvider(<BookingOverview booking={singleNightBooking} />);
      
      expect(screen.getByText('1 Nacht')).toBeInTheDocument();
    });


    it('should display persons and nights with connecting word', () => {
      renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
      expect(screen.getByText('für')).toBeInTheDocument();
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should display persons and nights icons', () => {
      const { container } = renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBe(2);
    });
  });

  describe('Layout', () => {
    it('should have proper CSS classes for styling', () => {
      const { container } = renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('mb-8');
    });

    it('should center align content', () => {
      const { container } = renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      const centerDiv = container.querySelector('.text-center');
      expect(centerDiv).toBeInTheDocument();
    });

  });

  describe('Data variations', () => {
    it('should handle large numbers correctly', () => {
      const largeBooking = { 
        ...mockBooking, 
        totalPersons: 10, 
        numberOfNights: 14 
      };
      renderWithApiProvider(<BookingOverview booking={largeBooking} />);
      
      expect(screen.getByText('10 Personen')).toBeInTheDocument();
      expect(screen.getByText('14 Nächte')).toBeInTheDocument();
    });

  });

  describe('Accessibility', () => {
    it('should use proper semantic structure', () => {
      renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('4 Personen')).toBeInTheDocument();
      expect(screen.getByText('2 Nächte')).toBeInTheDocument();
    });

    it('should have proper font styling for readability', () => {
      renderWithApiProvider(<BookingOverview booking={mockBooking} />);
      
      const personsText = screen.getByText('4 Personen');
      expect(personsText).toHaveClass('text-2xl', 'font-bold');
      
      const nightsText = screen.getByText('2 Nächte');
      expect(nightsText).toHaveClass('text-2xl', 'font-bold');
    });
  });
});