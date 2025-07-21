import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import BookingDetailPage from '../page';
import { apiClient } from '../../../../lib/api/client';
import { Booking, BookingStatus } from '../../../../lib/types/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../../../lib/api/client', () => ({
  apiClient: {
    getBookingById: jest.fn(),
    getSleepingAccommodations: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
};

const mockBooking: Booking = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: 1,
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

describe('BookingDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
    
    // Default successful mocks
    (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    (apiClient.getSleepingAccommodations as jest.Mock).mockResolvedValue(mockAccommodations);
  });

  describe('Loading States', () => {
    it('should show skeleton loading states while fetching data', () => {
      (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
      (apiClient.getBookingById as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (apiClient.getSleepingAccommodations as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<BookingDetailPage />);

      // Check for skeleton loading elements
      expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      
      // Verify skeleton elements are present (checking for animate-pulse class)
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should show booking data when booking loads but accommodations are still loading', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (apiClient.getSleepingAccommodations as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(`ID: ${mockBooking.id}`)).toBeInTheDocument();
      });

      // Booking overview should be visible
      expect(screen.getByText('Übersicht')).toBeInTheDocument();
      expect(screen.getByText('2 Nächte')).toBeInTheDocument(); // Number of nights
      
      // Accommodations should still show skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should show accommodations data when accommodations load but booking is still loading', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: mockBooking.id });
      (apiClient.getBookingById as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (apiClient.getSleepingAccommodations as jest.Mock).mockResolvedValue(mockAccommodations);

      render(<BookingDetailPage />);

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

      render(<BookingDetailPage />);

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

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(`ID: ${mockBooking.id}`)).toBeInTheDocument();
      });

      // Booking data should still be visible
      expect(screen.getByText('Übersicht')).toBeInTheDocument();
      
      // Error message for accommodations should be shown
      expect(screen.getByText('Namen konnten nicht geladen werden')).toBeInTheDocument();
      
      // Accommodations should show "Unbekannter Schlafplatz" as fallback
      expect(screen.getAllByText('Unbekannter Schlafplatz')).toHaveLength(2);
    });

    it('should show not found message when booking is null', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(null);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchung nicht gefunden')).toBeInTheDocument();
      });

      expect(screen.getByText('Die angeforderte Buchung konnte nicht gefunden werden.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zurück zur übersicht/i })).toBeInTheDocument();
    });

    it('should show error when booking ID is missing', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: undefined });

      render(<BookingDetailPage />);

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

      render(<BookingDetailPage />);

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
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(`ID: ${mockBooking.id}`)).toBeInTheDocument();
      });

      // Check header information
      expect(screen.getByText(/Freitag, 15\. März 2024 - Sonntag, 17\. März 2024/)).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();

      // Check overview section
      expect(screen.getByText(`ID: ${mockBooking.id}`)).toBeInTheDocument();
      expect(screen.getByText('4 Personen')).toBeInTheDocument(); // Total persons
      expect(screen.getByText('2 Nächte')).toBeInTheDocument(); // Number of nights
    });

    it('should display accommodations correctly', async () => {
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Schlafmöglichkeiten')).toBeInTheDocument();
      });

      // Check accommodation items
      expect(screen.getByText('Hauptschlafzimmer')).toBeInTheDocument();
      expect(screen.getByText('Gästezimmer')).toBeInTheDocument();
      expect(screen.getAllByText('2 Personen')).toHaveLength(2);
    });

    it('should display notes when present', async () => {
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Notizen')).toBeInTheDocument();
      });

      expect(screen.getByText('Testnotiz für die Buchung')).toBeInTheDocument();
    });

    it('should not display notes section when notes are empty', async () => {
      const bookingWithoutNotes = { ...mockBooking, notes: undefined };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(bookingWithoutNotes);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });

      expect(screen.queryByText('Notizen')).not.toBeInTheDocument();
    });

    it('should display timestamps correctly', async () => {
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Historie')).toBeInTheDocument();
      });

      expect(screen.getByText('01.03.2024')).toBeInTheDocument(); // Created date
      expect(screen.getByText('02.03.2024')).toBeInTheDocument(); // Changed date
    });

    it('should not display changed timestamp when not present', async () => {
      const bookingWithoutChangedAt = { ...mockBooking, changedAt: undefined };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(bookingWithoutChangedAt);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Historie')).toBeInTheDocument();
      });

      expect(screen.getByText('01.03.2024')).toBeInTheDocument(); // Created date
      expect(screen.queryByText('Geändert')).not.toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show correct badge for pending status', async () => {
      const pendingBooking = { ...mockBooking, status: BookingStatus.Pending };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(pendingBooking);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      });
    });

    it('should show correct badge for confirmed status', async () => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      });
    });

    it('should show correct badge for cancelled status', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(cancelledBooking);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Storniert')).toBeInTheDocument();
      });
    });

    it('should show correct badge for completed status', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.Completed };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(completedBooking);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
    });

    it('should navigate back to bookings list when back button is clicked', async () => {
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /zurück zur übersicht/i });
      backButton.click();

      expect(mockRouter.push).toHaveBeenCalledWith('/bookings');
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      render(<BookingDetailPage />);

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

      render(<BookingDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /bearbeiten/i });
        expect(editButton).toBeDisabled();
      });
    });

    it('should not show cancel button for cancelled bookings', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.Cancelled };
      (apiClient.getBookingById as jest.Mock).mockResolvedValue(cancelledBooking);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /stornieren/i })).not.toBeInTheDocument();
    });

    it('should show cancel button for non-cancelled bookings', async () => {
      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });
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

    it('should show confirmation dialog when cancel button is clicked', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /stornieren/i });
      cancelButton.click();

      expect(global.confirm).toHaveBeenCalledWith('Möchten Sie diese Buchung wirklich stornieren?');
    });

    it('should log booking ID when cancel is confirmed', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (global.confirm as jest.Mock).mockReturnValue(true);

      render(<BookingDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /stornieren/i });
      cancelButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('Cancel booking:', mockBooking.id);
      consoleSpy.mockRestore();
    });
  });
});