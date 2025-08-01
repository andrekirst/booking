import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import BookingDetailPage from '../page';
import { ApiContext } from '../../../../contexts/ApiContext';
import { ApiClient } from '../../../../lib/api/client';
import { Booking, BookingHistoryEntry, BookingHistoryEventType, BookingStatus, SleepingAccommodation } from '../../../../lib/types/api';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock API client
const mockApiClient: jest.Mocked<ApiClient> = {
  getBookingById: jest.fn(),
  getSleepingAccommodations: jest.fn(),
  getBookingHistory: jest.fn(),
  acceptBooking: jest.fn(),
  rejectBooking: jest.fn(),
  // Add other methods as needed
} as any;

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockBooking: Booking = {
  id: 'booking-123',
  userId: 1,
  userName: 'Max Mustermann',
  userEmail: 'max@example.com',
  startDate: '2025-08-01',
  endDate: '2025-08-03',
  status: BookingStatus.Confirmed,
  notes: 'Test booking notes',
  bookingItems: [
    {
      sleepingAccommodationId: 'room-1',
      sleepingAccommodationName: 'Hauptzimmer',
      personCount: 2
    }
  ],
  totalPersons: 2,
  numberOfNights: 2,
  createdAt: '2025-07-01T10:00:00Z',
  changedAt: '2025-07-01T11:00:00Z'
};

const mockAccommodations: SleepingAccommodation[] = [
  {
    id: 'room-1',
    name: 'Hauptzimmer',
    type: 0,
    maxCapacity: 4,
    isActive: true,
    createdAt: '2025-07-01T09:00:00Z'
  }
];

const mockHistoryEntries: BookingHistoryEntry[] = [
  {
    id: 'history-1',
    eventType: BookingHistoryEventType.Created,
    timestamp: '2025-07-01T10:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Buchung wurde erstellt',
    details: {
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      totalPersons: 2,
      accommodations: ['Hauptzimmer']
    }
  },
  {
    id: 'history-2',
    eventType: BookingHistoryEventType.StatusChanged,
    timestamp: '2025-07-01T11:00:00Z',
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    description: 'Status wurde geändert',
    details: {
      reason: 'Buchung wurde vom Administrator bestätigt'
    },
    previousValue: BookingStatus.Pending,
    newValue: BookingStatus.Confirmed
  },
  {
    id: 'history-3',
    eventType: BookingHistoryEventType.NotesUpdated,
    timestamp: '2025-07-01T12:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Notizen wurden aktualisiert',
    details: {
      notes: 'Zusätzliche Informationen hinzugefügt'
    }
  }
];

const renderWithApiContext = (component: React.ReactElement) => {
  return render(
    <ApiContext.Provider value={{ apiClient: mockApiClient }}>
      {component}
    </ApiContext.Provider>
  );
};

describe('BookingDetailPage - History Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: 'booking-123' });
    
    // Setup default API responses
    mockApiClient.getBookingById.mockResolvedValue(mockBooking);
    mockApiClient.getSleepingAccommodations.mockResolvedValue(mockAccommodations);
    mockApiClient.getBookingHistory.mockResolvedValue(mockHistoryEntries);
  });

  describe('Tab Integration', () => {
    test('should render Details tab as default active tab', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      // Wait for booking to load
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Details tab should be active
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      expect(detailsTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(detailsTab).toHaveAttribute('aria-current', 'page');
      
      // Historie tab should be inactive
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      expect(historyTab).toHaveClass('border-transparent', 'text-gray-500');
      expect(historyTab).not.toHaveAttribute('aria-current');
    });

    test('should show Details content initially', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });
      
      // Should show booking overview content
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
      expect(screen.getByText('Hauptzimmer')).toBeInTheDocument();
      
      // Should NOT show history content initially
      expect(screen.queryByText('Änderungsverlauf')).not.toBeInTheDocument();
    });

    test('should not call getBookingHistory on initial load', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(mockApiClient.getBookingById).toHaveBeenCalledWith('booking-123');
      });
      
      // History API should not be called initially
      expect(mockApiClient.getBookingHistory).not.toHaveBeenCalled();
    });

    test('should call getBookingHistory when Historie tab is clicked (lazy loading)', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      fireEvent.click(historyTab);
      
      // Should call history API
      await waitFor(() => {
        expect(mockApiClient.getBookingHistory).toHaveBeenCalledWith('booking-123');
      });
    });

    test('should show loading state when Historie tab is first activated', async () => {
      // Mock delayed API response
      mockApiClient.getBookingHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockHistoryEntries), 100))
      );
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      // Should show loading state
      expect(screen.getByRole('status', { name: /historie wird geladen/i })).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /historie wird geladen/i })).not.toBeInTheDocument();
      });
      
      // Should show history content
      expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
    });

    test('should display history content after loading', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      // Should show all history entries
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      expect(screen.getByText('Status wurde geändert')).toBeInTheDocument();
      expect(screen.getByText('Notizen wurden aktualisiert')).toBeInTheDocument();
      
      // Should show user names
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    test('should not reload history when switching back to Historie tab', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab first time
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(mockApiClient.getBookingHistory).toHaveBeenCalledTimes(1);
      });
      
      // Switch back to Details
      fireEvent.click(screen.getByRole('button', { name: 'Details' }));
      
      // Switch back to Historie
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      // Should NOT call API again (already loaded)
      expect(mockApiClient.getBookingHistory).toHaveBeenCalledTimes(1);
      
      // Should still show history content
      expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle history API error gracefully', async () => {
      const historyError = new Error('Failed to load booking history');
      mockApiClient.getBookingHistory.mockRejectedValue(historyError);
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Should show error message
      expect(screen.getByText('Fehler beim Laden der Historie')).toBeInTheDocument();
      expect(screen.getByText(/failed to load booking history/i)).toBeInTheDocument();
      
      // Should show reload button
      expect(screen.getByRole('button', { name: /historie neu laden/i })).toBeInTheDocument();
    });

    test('should handle 401 error by redirecting to login', async () => {
      const unauthorizedError = { status: 401, message: 'Unauthorized' };
      mockApiClient.getBookingHistory.mockRejectedValue(unauthorizedError);
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    test('should allow retry after error', async () => {
      // First call fails, second succeeds
      mockApiClient.getBookingHistory
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockHistoryEntries);
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Laden der Historie')).toBeInTheDocument();
      });
      
      // Click reload button
      const reloadButton = screen.getByRole('button', { name: /historie neu laden/i });
      fireEvent.click(reloadButton);
      
      // Should retry and succeed
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      expect(mockApiClient.getBookingHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States', () => {
    test('should show skeleton during initial booking load', () => {
      // Mock delayed booking response
      mockApiClient.getBookingById.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockBooking), 100))
      );
      
      renderWithApiContext(<BookingDetailPage />);
      
      // Should show loading skeletons
      expect(screen.getByText('', { selector: '.animate-pulse' })).toBeInTheDocument();
      
      // Tabs should not be visible during loading
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Historie')).not.toBeInTheDocument();
    });

    test('should show tabs after booking loads', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Historie')).toBeInTheDocument();
      });
      
      // Skeleton should be gone
      expect(screen.queryByText('', { selector: '.animate-pulse' })).not.toBeInTheDocument();
    });

    test('should maintain tab state during history loading', async () => {
      // Mock delayed history response
      mockApiClient.getBookingHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockHistoryEntries), 100))
      );
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Click Historie tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      // Tab should immediately become active
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      expect(historyTab).toHaveClass('border-blue-500', 'text-blue-600');
      
      // Should show loading state
      expect(screen.getByRole('status', { name: /historie wird geladen/i })).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      // Tab should still be active
      expect(historyTab).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations with history loaded', async () => {
      const { container } = renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Load history
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes for tabs', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      const tabNavigation = screen.getByLabelText('Tabs');
      expect(tabNavigation).toBeInTheDocument();
      
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      expect(detailsTab).toHaveAttribute('aria-current', 'page');
      expect(historyTab).not.toHaveAttribute('aria-current');
      
      // Click history tab
      fireEvent.click(historyTab);
      
      expect(detailsTab).not.toHaveAttribute('aria-current');
      expect(historyTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Performance Considerations', () => {
    test('should not call booking API multiple times', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Switch between tabs
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      fireEvent.click(screen.getByRole('button', { name: 'Details' }));
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      // Booking API should only be called once
      expect(mockApiClient.getBookingById).toHaveBeenCalledTimes(1);
    });

    test('should cache history data after first load', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Load history multiple times
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Details' }));
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      // History API should only be called once (cached)
      expect(mockApiClient.getBookingHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Booking Actions', () => {
    test('should refresh history after booking status change', async () => {
      mockApiClient.acceptBooking.mockResolvedValueOnce(undefined);
      
      // Mock updated booking with new status
      const updatedBooking = { ...mockBooking, status: BookingStatus.Accepted };
      mockApiClient.getBookingById
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(updatedBooking);
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Load history first
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      // Accept booking (this should trigger refresh)
      const acceptButton = screen.getByRole('button', { name: /annehmen/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockApiClient.acceptBooking).toHaveBeenCalledWith('booking-123');
      });
      
      // Should refresh booking data
      expect(mockApiClient.getBookingById).toHaveBeenCalledTimes(2);
    });
  });
});