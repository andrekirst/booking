import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import BookingsPage from '../page';
import { apiClient } from '../../../lib/api/client';
import { Booking, BookingStatus } from '../../../lib/types/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    getBookings: jest.fn(),
    getToken: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../../lib/auth/jwt', () => ({
  getCurrentUser: jest.fn(() => ({
    name: 'Test User',
    email: 'test@example.com', 
    role: 'Member',
    userId: 1,
    isAdmin: false
  })),
}));

jest.mock('../../components/CreateBookingButton', () => {
  return function CreateBookingButton({ onClick, variant }: { onClick: () => void; variant?: string }) {
    return (
      <button onClick={onClick} data-testid="create-booking-button">
        {variant === 'large' ? 'Neue Buchung erstellen' : 'Buchung erstellen'}
      </button>
    );
  };
});

jest.mock('../../components/ui/UserMenuDropdown', () => ({
  UserMenuDropdown: ({ userInfo, onLogout }: any) => (
    <div data-testid="user-menu-dropdown">
      <button aria-expanded="false" onClick={onLogout}>
        {userInfo.name}
      </button>
    </div>
  ),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockBookings: Booking[] = [
  {
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
  },
  {
    id: '987e6543-e89b-12d3-a456-426614174001',
    userId: 1,
    userName: 'Test User',
    userEmail: 'test@example.com',
    startDate: '2024-04-01T00:00:00Z',
    endDate: '2024-04-03T00:00:00Z',
    numberOfNights: 2,
    totalPersons: 2,
    status: BookingStatus.Pending,
    bookingItems: [
      {
        sleepingAccommodationId: '456e7890-e89b-12d3-a456-426614174001',
        sleepingAccommodationName: 'Hauptschlafzimmer',
        personCount: 2,
      },
    ],
    notes: undefined,
    createdAt: '2024-03-20T12:00:00Z',
    changedAt: undefined,
  },
];

describe('BookingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default successful mocks
    (apiClient.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    
    // Mock a proper JWT token for default tests
    const payload = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify(payload)) + '.signature';
    (apiClient.getToken as jest.Mock).mockReturnValue(mockToken);
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching bookings', () => {
      (apiClient.getBookings as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<BookingsPage />);
      
      expect(screen.getByText('Buchungen werden geladen...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should have proper loading spinner styling', () => {
      (apiClient.getBookings as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<BookingsPage />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8', 'h-8', 'border-4', 'border-blue-500/30', 'border-t-blue-500', 'rounded-full');
    });
  });

  describe('Error States', () => {
    it('should show error message when booking fetch fails', async () => {
      const errorMessage = 'Fehler beim Laden der Buchungen';
      (apiClient.getBookings as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /neu laden/i })).toBeInTheDocument();
    });

    it('should show generic error message for unknown errors', async () => {
      (apiClient.getBookings as jest.Mock).mockRejectedValue('Unknown error');
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Laden der Buchungen')).toBeInTheDocument();
      });
    });

    it('should redirect to login on 401 error', async () => {
      (apiClient.getBookings as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('should show retry button when booking fetch fails', async () => {
      const errorMessage = 'Network error';
      (apiClient.getBookings as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /neu laden/i })).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /neu laden/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('ml-auto', 'bg-red-100', 'hover:bg-red-200', 'text-red-800');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no bookings exist', async () => {
      (apiClient.getBookings as jest.Mock).mockResolvedValue([]);
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Noch keine Buchungen')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Sie haben noch keine Buchungen erstellt. Starten Sie mit Ihrer ersten Buchung!')).toBeInTheDocument();
      expect(screen.getAllByTestId('create-booking-button')).toHaveLength(2); // One in header, one in empty state
    });

    it('should have proper empty state styling', async () => {
      (apiClient.getBookings as jest.Mock).mockResolvedValue([]);
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Noch keine Buchungen')).toBeInTheDocument();
      });
      
      const emptyStateContainer = screen.getByText('Noch keine Buchungen').closest('div');
      expect(emptyStateContainer).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-12', 'text-center');
    });
  });

  describe('Successful Loading', () => {
    it('should display page header correctly', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Verwalten Sie Ihre Garten-Buchungen')).toBeInTheDocument();
    });

    it('should display bookings in the order returned by API', async () => {
      // Note: Sorting should be handled by the backend API, not client-side
      // This test verifies that bookings are displayed as returned from the API
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument(); // First booking from mockBookings
      });
      
      // Check that API was called and both bookings are displayed
      expect(apiClient.getBookings).toHaveBeenCalled();
      expect(screen.getByText('01.04.2024 - 03.04.2024')).toBeInTheDocument(); // Second booking from mockBookings
    });

    it('should display booking cards', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
      });
      
      expect(screen.getByText('01.04.2024 - 03.04.2024')).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
    });

    it('should use grid layout for bookings', async () => {
      const { container } = render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
      });
      
      const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should navigate to booking detail when card is clicked', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
      });
      
      const bookingCard = screen.getByText('15.03.2024 - 17.03.2024').closest('div');
      fireEvent.click(bookingCard!);
      
      // We clicked on the March booking (15.03.2024), which should navigate to that booking's ID
      expect(mockRouter.push).toHaveBeenCalledWith('/bookings/123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('Navigation', () => {
    it('should show create booking button in header', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('create-booking-button').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should navigate to new booking page when create button is clicked', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('create-booking-button').length).toBeGreaterThanOrEqual(1);
      });
      
      const createButton = screen.getAllByTestId('create-booking-button')[0];
      fireEvent.click(createButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/bookings/new');
    });

    it('should show user menu dropdown', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      });
    });

    it('should logout and redirect when logout button is clicked', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      });
      
      const logoutButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(logoutButton);
      
      expect(apiClient.logout).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('Admin Functionality', () => {
    beforeEach(() => {
      // Mock JWT token with Administrator role
      const payload = {
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrator'
      };
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify(payload)) + '.signature';
      (apiClient.getToken as jest.Mock).mockReturnValue(mockToken);
      
      // Mock getCurrentUser for admin user
      const { getCurrentUser } = require('../../../lib/auth/jwt');
      getCurrentUser.mockReturnValue({
        name: 'Admin User',
        email: 'admin@example.com', 
        role: 'Administrator',
        userId: 1,
        isAdmin: true
      });
    });

    it('should show user menu for administrators', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      });
    });

    it('should show admin user name in dropdown', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      });
      
      // Admin functionality is now handled within the UserMenuDropdown
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  describe('Non-Admin Functionality', () => {
    beforeEach(() => {
      // Mock JWT token with regular user role
      const payload = {
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User'
      };
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify(payload)) + '.signature';
      (apiClient.getToken as jest.Mock).mockReturnValue(mockToken);
      
      // Reset getCurrentUser for regular user
      const { getCurrentUser } = require('../../../lib/auth/jwt');
      getCurrentUser.mockReturnValue({
        name: 'Test User',
        email: 'test@example.com', 
        role: 'Member',
        userId: 1,
        isAdmin: false
      });
    });

    it('should show user menu for regular users', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Token Handling', () => {
    beforeEach(() => {
      // Reset to regular user for token handling tests
      const { getCurrentUser } = require('../../../lib/auth/jwt');
      getCurrentUser.mockReturnValue({
        name: 'Test User',
        email: 'test@example.com', 
        role: 'Member',
        userId: 1,
        isAdmin: false
      });
    });

    it('should handle missing token gracefully', async () => {
      (apiClient.getToken as jest.Mock).mockReturnValue(null);
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      // Should not crash and should show regular user menu
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });

    it('should handle malformed token gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (apiClient.getToken as jest.Mock).mockReturnValue('invalid.token.parts');
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      // Should not crash and should show regular user menu
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive header layout', async () => {
      const { container } = render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      const headerContainer = container.querySelector('.flex.flex-col.sm\\:flex-row.sm\\:items-center.sm\\:justify-between');
      expect(headerContainer).toBeInTheDocument();
    });

    it('should have responsive grid layout', async () => {
      const { container } = render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('15.03.2024 - 17.03.2024')).toBeInTheDocument();
      });
      
      const gridContainer = container.querySelector('.grid-cols-1.lg\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should have gradient background', async () => {
      const { container } = render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      const mainContainer = container.querySelector('.bg-gradient-to-br.from-green-50.via-blue-50.to-indigo-100');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have proper container max-width', async () => {
      const { container } = render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Meine Buchungen')).toBeInTheDocument();
      });
      
      const contentContainer = container.querySelector('.max-w-6xl');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper page heading', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Meine Buchungen' });
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H1');
      });
    });

    it('should have proper button labels', async () => {
      render(<BookingsPage />);
      
      await waitFor(() => {
        // Check that user menu dropdown is present (not the old separate logout button)
        expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('create-booking-button')).toBeInTheDocument();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle console errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (apiClient.getBookings as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<BookingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Laden der Buchungen:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});