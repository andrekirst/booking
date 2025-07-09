import { ApiClient } from './client';
import { ApiError } from './errors';
import { 
  User, 
  UserRole, 
  Booking,
  LoginRequest, 
  LoginResponse, 
  BookingsResponse 
} from '../types/api';

export class MockApiClient implements ApiClient {
  private authenticated = false;
  private currentUser: User | null = null;

  // Mock data
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@booking.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.Administrator,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      changedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'member@booking.com',
      firstName: 'Familie',
      lastName: 'Mitglied',
      role: UserRole.Member,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      changedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '3',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.Member,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      changedAt: '2025-01-01T00:00:00Z',
    },
  ];

  private mockBookings: Booking[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: '2025-01-09T10:00:00Z',
      changedAt: '2025-01-09T10:00:00Z',
    },
    {
      id: '987fcdeb-51d2-43a1-b321-654987321098',
      createdAt: '2025-01-08T15:30:00Z',
      changedAt: '2025-01-08T15:30:00Z',
    },
  ];

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Simulate network delay
    await this.delay(500);

    // Mock authentication logic
    const user = this.mockUsers.find(u => u.email === credentials.email);
    
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Simple password check (in real app, this would be hashed)
    const validPasswords: Record<string, string> = {
      'admin@booking.com': 'admin123',
      'member@booking.com': 'member123',
      'test@example.com': 'test123',
    };

    if (validPasswords[credentials.email] !== credentials.password) {
      throw new ApiError('Invalid credentials', 401);
    }

    this.authenticated = true;
    this.currentUser = user;

    return {
      token: `mock-jwt-token-${user.id}`,
      user,
    };
  }

  async logout(): Promise<void> {
    await this.delay(200);
    this.authenticated = false;
    this.currentUser = null;
  }

  async getBookings(): Promise<BookingsResponse> {
    await this.delay(300);

    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    return {
      bookings: this.mockBookings,
      count: this.mockBookings.length,
    };
  }

  async healthCheck(): Promise<{ status: string }> {
    await this.delay(100);
    return { status: 'healthy' };
  }

  // Utility methods for testing
  setAuthenticated(authenticated: boolean): void {
    this.authenticated = authenticated;
    if (authenticated && !this.currentUser) {
      this.currentUser = this.mockUsers[0]; // Default to admin
    }
  }

  addMockBooking(booking: Booking): void {
    this.mockBookings.push(booking);
  }

  clearMockBookings(): void {
    this.mockBookings = [];
  }

  simulateError(shouldError: boolean = true): void {
    if (shouldError) {
      this.getBookings = async () => {
        throw new ApiError('Simulated server error', 500);
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockApiClient = new MockApiClient();