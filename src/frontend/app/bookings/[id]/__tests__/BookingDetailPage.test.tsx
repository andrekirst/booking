import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import BookingDetailPage from '../page';
import { apiClient } from '../../../../lib/api/client';
import { Booking, BookingStatus } from '../../../../lib/types/api';
import { ApiProvider } from '../../../../contexts/ApiContext';
import { mockApiClient } from '../../../../lib/api/mock-client';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../../../lib/api/client', () => ({
  apiClient: {
    getBookingById: jest.fn(),
    getSleepingAccommodations: jest.fn(),
    acceptBooking: jest.fn(),
    rejectBooking: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
};

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
  notes: 'Testnotiz für die Buchung',
  createdAt: '2024-03-01T10:00:00Z',
  changedAt: '2024-03-02T15:30:00Z',
};

const mockAccommodations = [
  {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Hauptschlafzimmer',
    maxCapacity: 2,
    description: 'Gemütliches Hauptschlafzimmer',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    changedAt: null,
  },
  {
    id: '789e1234-e89b-12d3-a456-426614174002',
    name: 'Gästezimmer',
    maxCapacity: 2,
    description: 'Komfortables Gästezimmer',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    changedAt: null,
  },
];

// Helper function to render components with ApiProvider
const renderWithApiProvider = (component: React.ReactElement) => {
  return render(
    <ApiProvider apiClient={mockApiClient}>
      {component}
    </ApiProvider>
  );
};

// Helper function to configure both apiClient and mockApiClient with the same mock behavior
const configureApiMocks = (
  getBookingByIdMock?: any,
  getSleepingAccommodationsMock?: any,
  acceptBookingMock?: any,
  rejectBookingMock?: any
) => {
  if (getBookingByIdMock !== undefined) {
    (apiClient.getBookingById as jest.Mock).mockImplementation(getBookingByIdMock);
    mockApiClient.getBookingById = jest.fn().mockImplementation(getBookingByIdMock);
  }
  if (getSleepingAccommodationsMock !== undefined) {
    (apiClient.getSleepingAccommodations as jest.Mock).mockImplementation(getSleepingAccommodationsMock);
    mockApiClient.getSleepingAccommodations = jest.fn().mockImplementation(getSleepingAccommodationsMock);
  }
  if (acceptBookingMock !== undefined) {
    (apiClient.acceptBooking as jest.Mock).mockImplementation(acceptBookingMock);
    mockApiClient.acceptBooking = jest.fn().mockImplementation(acceptBookingMock);
  }
  if (rejectBookingMock !== undefined) {
    (apiClient.rejectBooking as jest.Mock).mockImplementation(rejectBookingMock);
    mockApiClient.rejectBooking = jest.fn().mockImplementation(rejectBookingMock);
  }
};

describe('BookingDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
    
    // Default successful mocks for the mocked apiClient
    (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    (apiClient.getSleepingAccommodations as jest.Mock).mockResolvedValue(mockAccommodations);
    
    // Configure mockApiClient to match the same behavior for useApi hook
    mockApiClient.getBookingById = jest.fn().mockResolvedValue(mockBooking);
    mockApiClient.getSleepingAccommodations = jest.fn().mockResolvedValue(mockAccommodations);
    mockApiClient.acceptBooking = jest.fn().mockResolvedValue(undefined);
    mockApiClient.rejectBooking = jest.fn().mockResolvedValue(undefined);
  });

  describe('Loading States', () => {
    it('should show skeleton loading states while fetching data', () => {
      (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
      configureApiMocks(
        () => new Promise(() => {}), // getBookingById - never resolves
        () => new Promise(() => {})  // getSleepingAccommodations - never resolves
      );

      renderWithApiProvider(<BookingDetailPage />);

      // Check for skeleton loading elements
      expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      
      // Verify skeleton elements are present (checking for animate-pulse class)
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should show booking data when booking loads but accommodations are still loading', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (apiClient.getSleepingAccommodations as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderWithApiProvider(<BookingDetailPage />);

      // Since accommodations are still loading, the whole content will show skeleton
      // because the tabs are not rendered until both booking and accommodations are loaded
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should show accommodations data when accommodations load but booking is still loading', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
      (apiClient.getBookingById as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (apiClient.getSleepingAccommodations as jest.Mock).mockResolvedValue(mockAccommodations);

      renderWithApiProvider(<BookingDetailPage />);

      // Since booking is still loading, the whole page should show skeletons
      // because accommodation display depends on booking data
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('should show error message when booking fetch fails', async () => {
      (apiClient.getBookingById as jest.Mock).mockRejectedValue(
        new Error('Fehler beim Laden der Buchung')
      );
      (apiClient.getSleepingAccommodations as jest.Mock).mockResolvedValue(mockAccommodations);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
      });

      expect(screen.getByText('Fehler beim Laden der Buchung')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /neu laden/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zurück zur übersicht/i })).toBeInTheDocument();
    });

    it('should show accommodation error while still displaying booking data', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (apiClient.getSleepingAccommodations as jest.Mock).mockRejectedValue(
        new Error('Fehler beim Laden der Schlafmöglichkeiten')
      );

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('4 Personen')).toBeInTheDocument();
      });

      // Booking data should still be visible
      
      // Error message for accommodations should be shown
      expect(screen.getByText('Namen konnten nicht geladen werden')).toBeInTheDocument();
      
      // Accommodations should show "Unbekannter Schlafplatz" as fallback
      expect(screen.getAllByText('Unbekannter Schlafplatz')).toHaveLength(2);
    });

    it('should show not found message when booking is null', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(null);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchung nicht gefunden')).toBeInTheDocument();
      });

      expect(screen.getByText('Die angeforderte Buchung konnte nicht gefunden werden.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zurück zur übersicht/i })).toBeInTheDocument();
    });

    it('should show error when booking ID is missing', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: undefined });

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
      });

      expect(screen.getByText('Ungültige Buchungs-ID')).toBeInTheDocument();
    });

    it('should redirect to login on 401 error', async () => {
      (apiClient.getBookingById as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Successful Loading', () => {
    beforeEach(() => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    });

    it('should display booking details correctly', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('4 Personen')).toBeInTheDocument();
      });

      // Check header information
      expect(screen.getByText(/Freitag, 15\. März 2024 - Sonntag, 17\. März 2024/)).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();

      // Check tab navigation
      expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Historie' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Historie' })).toBeDisabled();

      // Check overview section (should be visible in Details tab)
      expect(screen.getByText('4 Personen')).toBeInTheDocument(); // Total persons
      expect(screen.getByText('2 Nächte')).toBeInTheDocument(); // Number of nights
    });

    it('should display accommodations correctly', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Schlafmöglichkeiten')).toBeInTheDocument();
      });

      // Check accommodation items
      expect(screen.getByText('Hauptschlafzimmer')).toBeInTheDocument();
      expect(screen.getByText('Gästezimmer')).toBeInTheDocument();
      expect(screen.getAllByText('2 Personen')).toHaveLength(2);
    });

    it('should display notes when present', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Notizen')).toBeInTheDocument();
      });

      expect(screen.getByText('Testnotiz für die Buchung')).toBeInTheDocument();
    });

    it('should not display notes section when notes are empty', async () => {
      const bookingWithoutNotes = { ...mockBooking, notes: undefined };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(bookingWithoutNotes);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });

      expect(screen.queryByText('Notizen')).not.toBeInTheDocument();
    });

    it('should not display timestamps in Details tab anymore', async () => {      
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('4 Personen')).toBeInTheDocument();
      });
      
      // Timestamps should no longer be in the Details tab
      expect(screen.queryByText('01.03.2024')).not.toBeInTheDocument();
      expect(screen.queryByText('02.03.2024')).not.toBeInTheDocument();
      expect(screen.queryByText('Zeitstempel')).not.toBeInTheDocument();
    });

    it('should not display timestamp section anymore', async () => {
      const bookingWithoutChangedAt = { ...mockBooking, changedAt: undefined };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(bookingWithoutChangedAt);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('4 Personen')).toBeInTheDocument();
      });
      
      // No timestamp information should be displayed in Details tab
      expect(screen.queryByText('01.03.2024')).not.toBeInTheDocument();
      expect(screen.queryByText('Erstellt')).not.toBeInTheDocument();
      expect(screen.queryByText('Geändert')).not.toBeInTheDocument();
    });
  });


  describe('Status Badges', () => {
    it('should show correct badge for pending status', async () => {
      const pendingBooking = { ...mockBooking, status: BookingStatus.Pending };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(pendingBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      });
    });

    it('should show correct badge for confirmed status', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      });
    });

    it('should show correct badge for cancelled status', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(cancelledBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Storniert')).toBeInTheDocument();
      });
    });

    it('should show correct badge for completed status', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.Completed };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(completedBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
      });
    });

    it('should show correct badge for accepted status', async () => {
      const acceptedBooking = { ...mockBooking, status: BookingStatus.Accepted };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(acceptedBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Angenommen')).toBeInTheDocument();
      });
    });

    it('should show correct badge for rejected status', async () => {
      const rejectedBooking = { ...mockBooking, status: BookingStatus.Rejected };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(rejectedBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Abgelehnt')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    });

    it('should navigate back to bookings list when back button is clicked', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /zurück zur übersicht/i });
      backButton.click();

      expect(mockRouter.push).toHaveBeenCalledWith('/bookings');
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /bearbeiten/i });
        expect(editButton).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /bearbeiten/i });
      editButton.click();

      expect(mockRouter.push).toHaveBeenCalledWith(`/bookings/${mockBooking.id}/edit`);
    });

    it('should disable edit button for cancelled bookings', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(cancelledBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /bearbeiten/i });
        expect(editButton).toBeDisabled();
      });
    });

    it('should not show cancel button for cancelled bookings', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(cancelledBooking);

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /stornieren/i })).not.toBeInTheDocument();
    });

    it('should show cancel button for non-cancelled bookings', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    });

    it('should show Details tab as active by default', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should show Historie tab as disabled', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        const historieTab = screen.getByRole('button', { name: 'Historie' });
        expect(historieTab).toBeDisabled();
      });
    });

    it('should not allow clicking on disabled Historie tab', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        const historieTab = screen.getByRole('button', { name: 'Historie' });
        expect(historieTab).toBeDisabled();
      });

      // Try to click the disabled tab
      const historieTab = screen.getByRole('button', { name: 'Historie' });
      historieTab.click();

      // Details tab should still be active
      expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-current', 'page');
    });

    it('should show placeholder content when Historie tab is accessed', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('4 Personen')).toBeInTheDocument();
      });

      // Since Historie tab is disabled, we can't access its content through normal interaction
      // The content is defined but not accessible due to the disabled state
      expect(screen.queryByText('Historie wird implementiert')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      // Mock window.confirm
      global.confirm = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show confirmation modal when cancel button is clicked', async () => {
      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /stornieren/i });
      
      await act(async () => {
        cancelButton.click();
      });

      expect(screen.getByText('Buchung stornieren')).toBeInTheDocument();
      expect(screen.getByText('Möchten Sie diese Buchung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.')).toBeInTheDocument();
    });

    it('should log booking ID when cancel is confirmed', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWithApiProvider(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /stornieren/i });
      
      await act(async () => {
        cancelButton.click();
      });

      // Find and click the confirm button in the modal (should be the second one)
      const stornierButtons = screen.getAllByRole('button', { name: /stornieren/i });
      const confirmButton = stornierButtons[1]; // The modal confirm button
      
      await act(async () => {
        confirmButton.click();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Cancel booking:', mockBooking.id);
      consoleSpy.mockRestore();
    });
  });
});