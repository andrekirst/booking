import { render, screen, waitFor } from '@testing-library/react';
import { BookingActivityList } from '../BookingActivityList';
import { ApiProvider } from '../../../../contexts/ApiContext';
import { MockApiClient } from '../../../../lib/api/mock-client';
import { BookingActivity } from '../../../../lib/types/api';

// Mock the API client
const mockApiClient = new MockApiClient();

const renderWithApiProvider = (component: React.ReactElement) => {
  return render(
    <ApiProvider apiClient={mockApiClient}>
      {component}
    </ApiProvider>
  );
};

describe('BookingActivityList', () => {
  const mockBookingId = 'test-booking-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);
    
    expect(screen.getByText('Aktivitätenverlauf')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render activities when loaded successfully', async () => {
    const mockActivities: BookingActivity[] = [
      {
        activityType: 'BookingCreated',
        description: 'Buchung wurde erstellt',
        timestamp: '2025-01-01T10:00:00Z',
        userName: 'Test User',
        metadata: {
          startDate: '2025-02-01',
          endDate: '2025-02-03',
          totalPersons: 2,
          accommodationCount: 1
        }
      },
      {
        activityType: 'BookingAccepted',
        description: 'Buchung wurde angenommen',
        timestamp: '2025-01-01T11:00:00Z',
        userName: 'Administrator',
        metadata: null
      }
    ];

    jest.spyOn(mockApiClient, 'getBookingHistory').mockResolvedValue(mockActivities);

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      expect(screen.getByText('Buchung wurde angenommen')).toBeInTheDocument();
      expect(screen.getByText('von Test User')).toBeInTheDocument();
      expect(screen.getByText('von Administrator')).toBeInTheDocument();
    });
  });

  it('should render error state when API call fails', async () => {
    jest.spyOn(mockApiClient, 'getBookingHistory').mockRejectedValue(new Error('API Error'));

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
      expect(screen.getByText('Fehler beim Laden der Buchungshistorie')).toBeInTheDocument();
      expect(screen.getByText('Erneut versuchen')).toBeInTheDocument();
    });
  });

  it('should render empty state when no activities exist', async () => {
    jest.spyOn(mockApiClient, 'getBookingHistory').mockResolvedValue([]);

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      expect(screen.getByText('Keine Aktivitäten')).toBeInTheDocument();
      expect(screen.getByText('Für diese Buchung sind noch keine Aktivitäten vorhanden.')).toBeInTheDocument();
    });
  });

  it('should render metadata when available', async () => {
    const mockActivities: BookingActivity[] = [
      {
        activityType: 'BookingCreated',
        description: 'Buchung wurde erstellt',
        timestamp: '2025-01-01T10:00:00Z',
        userName: 'Test User',
        metadata: {
          startDate: '2025-02-01',
          endDate: '2025-02-03',
          totalPersons: 2
        }
      }
    ];

    jest.spyOn(mockApiClient, 'getBookingHistory').mockResolvedValue(mockActivities);

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      expect(screen.getByText('startDate:')).toBeInTheDocument();
      expect(screen.getByText('2025-02-01')).toBeInTheDocument();
      expect(screen.getByText('endDate:')).toBeInTheDocument();
      expect(screen.getByText('2025-02-03')).toBeInTheDocument();
      expect(screen.getByText('totalPersons:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should format timestamps correctly', async () => {
    const mockActivities: BookingActivity[] = [
      {
        activityType: 'BookingCreated',
        description: 'Buchung wurde erstellt',
        timestamp: '2025-01-15T14:30:00Z',
        userName: 'Test User',
        metadata: null
      }
    ];

    jest.spyOn(mockApiClient, 'getBookingHistory').mockResolvedValue(mockActivities);

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      // The exact format depends on locale, but should contain date and time
      const timeElement = document.querySelector('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement?.getAttribute('dateTime')).toBe('2025-01-15T14:30:00Z');
    });
  });

  it('should display correct icons for different activity types', async () => {
    const mockActivities: BookingActivity[] = [
      {
        activityType: 'BookingCreated',
        description: 'Buchung wurde erstellt',
        timestamp: '2025-01-01T10:00:00Z',
        userName: 'Test User',
        metadata: null
      },
      {
        activityType: 'BookingAccepted',
        description: 'Buchung wurde angenommen',
        timestamp: '2025-01-01T11:00:00Z',
        userName: 'Administrator',
        metadata: null
      }
    ];

    jest.spyOn(mockApiClient, 'getBookingHistory').mockResolvedValue(mockActivities);

    renderWithApiProvider(<BookingActivityList bookingId={mockBookingId} />);

    await waitFor(() => {
      // Check for different colored icon containers
      expect(document.querySelector('.bg-blue-100')).toBeInTheDocument(); // BookingCreated
      expect(document.querySelector('.bg-green-100')).toBeInTheDocument(); // BookingAccepted
    });
  });
});