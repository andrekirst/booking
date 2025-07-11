import { HttpApiClient } from '../client';
import { ApiError } from '../errors';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

describe('HttpApiClient', () => {
  let client: HttpApiClient;
  const baseUrl = 'https://localhost:7000/api';

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new HttpApiClient(baseUrl);
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    // Spy on console to prevent logs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided base URL', () => {
      expect(client).toBeDefined();
    });

    it('should use default URL if not provided', () => {
      const defaultClient = new HttpApiClient();
      expect(defaultClient).toBeDefined();
    });

    it('should load token from localStorage on initialization', () => {
      localStorage.setItem('auth_token', 'test-token');
      const newClient = new HttpApiClient(baseUrl);
      expect(newClient.getToken()).toBe('test-token');
    });
  });

  describe('request method', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client['request']('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token in headers when available', async () => {
      client.setToken('test-token');
      fetchMock.mockResponseOnce(JSON.stringify({}));

      await client['request']('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle 401 unauthorized error', async () => {
      client.setToken('invalid-token');
      fetchMock.mockResponseOnce(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );

      await expect(client['request']('/test')).rejects.toThrow(ApiError);
      expect(client.getToken()).toBeNull();
      
      // After 401, token should be cleared
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle 404 not found error', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ message: 'Not found' }),
        { status: 404 }
      );

      await expect(client['request']('/test')).rejects.toThrow(
        expect.objectContaining({
          message: 'Not found',
          statusCode: 404,
        })
      );
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      await expect(client['request']('/test')).rejects.toThrow(
        expect.objectContaining({
          message: 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung.',
          statusCode: 0,
        })
      );
    });

    it('should handle empty response (204 No Content)', async () => {
      fetchMock.mockResponseOnce('', { status: 204 });

      const result = await client['request']('/test');
      expect(result).toEqual({});
    });

    it('should handle non-JSON error responses', async () => {
      fetchMock.mockResponseOnce('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });

      await expect(client['request']('/test')).rejects.toThrow(
        expect.objectContaining({
          message: 'HTTP 500: Internal Server Error',
          statusCode: 500,
        })
      );
    });
  });

  describe('authentication methods', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        token: 'new-token',
        user: { id: '1', email: 'test@example.com' },
      };
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual(mockResponse);
      expect(client.getToken()).toBe('new-token');
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('should logout and clear token', async () => {
      client.setToken('test-token');
      localStorage.setItem('auth_token', 'test-token');

      await client.logout();

      expect(client.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('booking methods', () => {
    beforeEach(() => {
      client.setToken('test-token');
    });

    it('should get bookings', async () => {
      const mockBookings = [{ id: '1', userId: 1 }];
      fetchMock.mockResponseOnce(JSON.stringify(mockBookings));

      const result = await client.getBookings();

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings`,
        expect.any(Object)
      );
      expect(result).toEqual(mockBookings);
    });

    it('should get booking by ID', async () => {
      const mockBooking = { id: '1', userId: 1 };
      fetchMock.mockResponseOnce(JSON.stringify(mockBooking));

      const result = await client.getBookingById('1');

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings/1`,
        expect.any(Object)
      );
      expect(result).toEqual(mockBooking);
    });

    it('should create booking', async () => {
      const newBooking = {
        startDate: '2025-01-20',
        endDate: '2025-01-22',
        bookingItems: [],
      };
      const mockResponse = { id: '1', ...newBooking };
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

    it('should check availability', async () => {
      const mockAvailability = {
        startDate: '2025-01-20',
        endDate: '2025-01-22',
        accommodations: [],
      };
      fetchMock.mockResponseOnce(JSON.stringify(mockAvailability));

      const result = await client.checkAvailability(
        '2025-01-20',
        '2025-01-22',
        'booking-123'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/bookings/availability?startDate=2025-01-20&endDate=2025-01-22&excludeBookingId=booking-123`,
        expect.any(Object)
      );
      expect(result).toEqual(mockAvailability);
    });
  });

  describe('sleeping accommodation methods', () => {
    beforeEach(() => {
      client.setToken('test-token');
    });

    it('should get sleeping accommodations', async () => {
      const mockAccommodations = [{ id: '1', name: 'Room 1' }];
      fetchMock.mockResponseOnce(JSON.stringify(mockAccommodations));

      const result = await client.getSleepingAccommodations(true);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/sleeping-accommodations?includeInactive=true`,
        expect.any(Object)
      );
      expect(result).toEqual(mockAccommodations);
    });

    it('should create sleeping accommodation', async () => {
      const newAccommodation = { name: 'New Room', maxCapacity: 4 };
      const mockResponse = { id: '1', ...newAccommodation };
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.createSleepingAccommodation(newAccommodation);

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/sleeping-accommodations`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newAccommodation),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete sleeping accommodation', async () => {
      fetchMock.mockResponseOnce('', { status: 204 });

      await client.deleteSleepingAccommodation('1');

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/sleeping-accommodations/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('token management', () => {
    it('should set and get token', () => {
      client.setToken('test-token');
      expect(client.getToken()).toBe('test-token');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('should check authentication status', () => {
      const newClient = new HttpApiClient(baseUrl);
      expect(newClient.isAuthenticated()).toBe(false);
      
      newClient.setToken('test-token');
      expect(newClient.isAuthenticated()).toBe(true);
    });

    it('should refresh token from localStorage before each request', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));
      
      // Create a new client without token
      const newClient = new HttpApiClient(baseUrl);
      
      // Set token in localStorage after client creation
      localStorage.setItem('auth_token', 'refreshed-token');
      
      await newClient['request']('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer refreshed-token',
          }),
        })
      );
    });
  });

  describe('health check', () => {
    it('should perform health check', async () => {
      const mockResponse = { status: 'healthy' };
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.healthCheck();

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});