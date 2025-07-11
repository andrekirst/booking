import { HttpApiClient } from '../client';
import { ApiError } from '../errors';
import fetchMock from 'jest-fetch-mock';
import { 
  Booking, 
  BookingStatus, 
  AccommodationType,
  UserRole 
} from '../../types/api';

// Enable fetch mocks
fetchMock.enableMocks();

describe('API Integration Tests', () => {
  let client: HttpApiClient;
  const baseUrl = 'https://localhost:7000/api';

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new HttpApiClient(baseUrl);
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Full Authentication Flow', () => {
    it('should handle complete login flow', async () => {
      const mockLoginResponse = {
        token: 'jwt-token-123',
        user: {
          id: '1',
          email: 'admin@booking.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.Administrator,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockLoginResponse));

      const result = await client.login({
        email: 'admin@booking.com',
        password: 'admin123',
      });

      expect(result).toEqual(mockLoginResponse);
      expect(client.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');

      // Verify subsequent requests include auth token
      fetchMock.mockResponseOnce(JSON.stringify([]));
      await client.getBookings();

      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer jwt-token-123',
          }),
        })
      );
    });

    it('should handle logout correctly', async () => {
      // Setup authenticated state
      client.setToken('test-token');
      expect(client.isAuthenticated()).toBe(true);

      // Logout
      await client.logout();

      expect(client.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Booking CRUD Operations', () => {
    beforeEach(() => {
      client.setToken('test-token');
    });

    it('should create a new booking', async () => {
      const newBooking = {
        startDate: '2025-02-01',
        endDate: '2025-02-03',
        notes: 'Family vacation',
        bookingItems: [
          {
            sleepingAccommodationId: 'room-1',
            personCount: 2,
          },
        ],
      };

      const mockResponse: Booking = {
        id: 'booking-123',
        userId: 1,
        userName: 'Test User',
        userEmail: 'test@example.com',
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        status: BookingStatus.Pending,
        notes: newBooking.notes,
        bookingItems: [
          {
            sleepingAccommodationId: 'room-1',
            sleepingAccommodationName: 'Master Bedroom',
            personCount: 2,
          },
        ],
        totalPersons: 2,
        numberOfNights: 2,
        createdAt: '2025-01-11T10:00:00Z',
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.createBooking(newBooking);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newBooking),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update an existing booking', async () => {
      const bookingId = 'booking-123';
      const updateRequest = {
        startDate: '2025-02-05',
        endDate: '2025-02-07',
        notes: 'Date changed',
        bookingItems: [
          {
            sleepingAccommodationId: 'room-2',
            personCount: 3,
          },
        ],
      };

      const mockResponse = {
        id: bookingId,
        ...updateRequest,
        status: BookingStatus.Confirmed,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.updateBooking(bookingId, updateRequest);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings/${bookingId}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should cancel a booking', async () => {
      const bookingId = 'booking-123';
      fetchMock.mockResponseOnce('', { status: 204 });

      await client.cancelBooking(bookingId);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings/${bookingId}/cancel`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should confirm a booking', async () => {
      const bookingId = 'booking-123';
      fetchMock.mockResponseOnce('', { status: 204 });

      await client.confirmBooking(bookingId);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings/${bookingId}/confirm`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should check availability with conflicts', async () => {
      const mockAvailability = {
        startDate: '2025-02-01',
        endDate: '2025-02-03',
        accommodations: [
          {
            id: 'room-1',
            name: 'Master Bedroom',
            maxCapacity: 4,
            isAvailable: false,
            availableCapacity: 2,
            conflictingBookings: [
              {
                bookingId: 'existing-booking',
                startDate: '2025-01-31',
                endDate: '2025-02-02',
                personCount: 2,
                userName: 'Other User',
              },
            ],
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockAvailability));

      const result = await client.checkAvailability(
        '2025-02-01',
        '2025-02-03'
      );

      expect(result).toEqual(mockAvailability);
      expect(result.accommodations[0].isAvailable).toBe(false);
      expect(result.accommodations[0].conflictingBookings).toHaveLength(1);
    });
  });

  describe('Sleeping Accommodation Operations', () => {
    beforeEach(() => {
      client.setToken('admin-token');
    });

    it('should handle full CRUD cycle for accommodations', async () => {
      // 1. Create
      const newAccommodation = {
        name: 'New Tent Spot',
        type: AccommodationType.Tent,
        maxCapacity: 4,
        isActive: true,
      };

      const createdAccommodation = {
        id: 'acc-123',
        ...newAccommodation,
        createdAt: '2025-01-11T10:00:00Z',
      };

      fetchMock.mockResponseOnce(JSON.stringify(createdAccommodation));
      const createResult = await client.createSleepingAccommodation(newAccommodation);
      expect(createResult.id).toBe('acc-123');

      // 2. Read
      fetchMock.mockResponseOnce(JSON.stringify(createdAccommodation));
      const readResult = await client.getSleepingAccommodationById('acc-123');
      expect(readResult).toEqual(createdAccommodation);

      // 3. Update
      const updateData = {
        ...createdAccommodation,
        maxCapacity: 6,
        changedAt: '2025-01-11T11:00:00Z',
      };
      fetchMock.mockResponseOnce(JSON.stringify(updateData));
      const updateResult = await client.updateSleepingAccommodation('acc-123', {
        maxCapacity: 6,
      });
      expect(updateResult.maxCapacity).toBe(6);

      // 4. Delete (soft delete - sets isActive to false)
      fetchMock.mockResponseOnce('', { status: 204 });
      await client.deleteSleepingAccommodation('acc-123');
      expect(fetchMock).toHaveBeenLastCalledWith(
        `${baseUrl}/sleeping-accommodations/acc-123`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should filter accommodations by active status', async () => {
      const mockAccommodations = [
        {
          id: '1',
          name: 'Active Room',
          isActive: true,
          type: AccommodationType.Room,
          maxCapacity: 2,
          createdAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Inactive Room',
          isActive: false,
          type: AccommodationType.Room,
          maxCapacity: 2,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResponseOnce(JSON.stringify(mockAccommodations));

      const result = await client.getSleepingAccommodations(true);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/sleeping-accommodations?includeInactive=true`,
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle validation errors', async () => {
      const validationError = {
        error: 'Validation failed',
        message: 'Invalid request data',
        validationErrors: [
          { field: 'startDate', message: 'Start date must be in the future' },
          { field: 'personCount', message: 'Person count must be positive' },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(validationError), {
        status: 400,
      });

      await expect(
        client.createBooking({
          startDate: '2020-01-01',
          endDate: '2020-01-02',
          bookingItems: [],
        })
      ).rejects.toThrow(ApiError);
    });

    it('should handle concurrent requests', async () => {
      client.setToken('test-token');

      // Mock multiple responses
      fetchMock
        .mockResponseOnce(JSON.stringify({ bookings: [], count: 0 }))
        .mockResponseOnce(JSON.stringify([]))
        .mockResponseOnce(JSON.stringify({ status: 'healthy' }));

      // Make concurrent requests
      const [bookings, accommodations, health] = await Promise.all([
        client.getBookings(),
        client.getSleepingAccommodations(),
        client.healthCheck(),
      ]);

      expect(bookings).toEqual({ bookings: [], count: 0 });
      expect(accommodations).toEqual([]);
      expect(health).toEqual({ status: 'healthy' });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should retry on network timeout', async () => {
      // Simulate timeout followed by success
      fetchMock
        .mockRejectOnce(new Error('Network timeout'))
        .mockResponseOnce(JSON.stringify({ status: 'healthy' }));

      // First attempt should fail
      await expect(client.healthCheck()).rejects.toThrow('Netzwerkfehler');

      // Second attempt should succeed
      const result = await client.healthCheck();
      expect(result).toEqual({ status: 'healthy' });
    });
  });

  describe('Complex Business Scenarios', () => {
    beforeEach(() => {
      client.setToken('user-token');
    });

    it('should handle booking modification workflow', async () => {
      const bookingId = 'booking-123';
      
      // 1. Get existing booking
      const existingBooking = {
        id: bookingId,
        startDate: '2025-02-01',
        endDate: '2025-02-03',
        bookingItems: [
          {
            sleepingAccommodationId: 'room-1',
            sleepingAccommodationName: 'Room 1',
            personCount: 2,
          },
        ],
        status: BookingStatus.Confirmed,
      };
      
      fetchMock.mockResponseOnce(JSON.stringify(existingBooking));
      const booking = await client.getBookingById(bookingId);

      // 2. Check new date availability
      const newStartDate = '2025-02-05';
      const newEndDate = '2025-02-07';
      
      fetchMock.mockResponseOnce(
        JSON.stringify({
          startDate: newStartDate,
          endDate: newEndDate,
          accommodations: [
            {
              id: 'room-1',
              isAvailable: true,
              availableCapacity: 4,
              conflictingBookings: [],
            },
          ],
        })
      );
      
      const availability = await client.checkAvailability(
        newStartDate,
        newEndDate,
        bookingId
      );
      
      expect(availability.accommodations[0].isAvailable).toBe(true);

      // 3. Update booking with new dates
      const updateRequest = {
        startDate: newStartDate,
        endDate: newEndDate,
        bookingItems: booking.bookingItems.map(item => ({
          sleepingAccommodationId: item.sleepingAccommodationId,
          personCount: item.personCount,
        })),
      };

      fetchMock.mockResponseOnce(
        JSON.stringify({
          ...existingBooking,
          ...updateRequest,
          changedAt: '2025-01-11T12:00:00Z',
        })
      );

      const updatedBooking = await client.updateBooking(bookingId, updateRequest);
      expect(updatedBooking.startDate).toBe(newStartDate);
      expect(updatedBooking.endDate).toBe(newEndDate);
    });

    it('should handle admin accommodation management', async () => {
      // Switch to admin token
      client.setToken('admin-token');

      // 1. Get all accommodations including inactive
      const allAccommodations = [
        { id: '1', name: 'Room 1', isActive: true },
        { id: '2', name: 'Room 2', isActive: false },
        { id: '3', name: 'Tent 1', isActive: true },
      ];

      fetchMock.mockResponseOnce(JSON.stringify(allAccommodations));
      const accommodations = await client.getSleepingAccommodations(true);
      expect(accommodations).toHaveLength(3);

      // 2. Reactivate inactive accommodation
      const inactiveId = '2';
      fetchMock.mockResponseOnce(
        JSON.stringify({
          ...allAccommodations[1],
          isActive: true,
          changedAt: '2025-01-11T13:00:00Z',
        })
      );

      const reactivated = await client.updateSleepingAccommodation(inactiveId, {
        isActive: true,
      });
      expect(reactivated.isActive).toBe(true);

      // 3. Create new accommodation
      const newAccommodation = {
        name: 'Camper Spot 1',
        type: AccommodationType.Camper,
        maxCapacity: 6,
        isActive: true,
      };

      fetchMock.mockResponseOnce(
        JSON.stringify({
          id: '4',
          ...newAccommodation,
          createdAt: '2025-01-11T14:00:00Z',
        })
      );

      const created = await client.createSleepingAccommodation(newAccommodation);
      expect(created.type).toBe(AccommodationType.Camper);
    });
  });
});