import { ApiClient } from './client';
import { ApiError } from './errors';
import { 
  User, 
  UserRole, 
  Booking,
  BookingAvailability,
  BookingStatus,
  CreateBookingRequest,
  LoginRequest, 
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  SleepingAccommodation,
  AccommodationType,
  UpdateBookingRequest,
  VerifyEmailRequest,
  VerifyEmailResponse
} from '../types/api';

export class MockApiClient implements ApiClient {
  private authenticated = false;
  private currentUser: User | null = null;
  private token: string | null = null;

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
      userId: 1,
      userName: 'Admin User',
      userEmail: 'admin@booking.com',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      status: BookingStatus.Confirmed,
      notes: 'Weekend retreat',
      bookingItems: [
        {
          sleepingAccommodationId: 'room-1',
          sleepingAccommodationName: 'Main Bedroom',
          personCount: 2,
        }
      ],
      totalPersons: 2,
      numberOfNights: 2,
      createdAt: '2025-01-09T10:00:00Z',
      changedAt: '2025-01-09T10:00:00Z',
    },
    {
      id: '987fcdeb-51d2-43a1-b321-654987321098',
      userId: 2,
      userName: 'Test User',
      userEmail: 'test@example.com',
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      status: BookingStatus.Pending,
      notes: 'Family gathering',
      bookingItems: [
        {
          sleepingAccommodationId: 'room-2',
          sleepingAccommodationName: 'Guest Room',
          personCount: 4,
        }
      ],
      totalPersons: 4,
      numberOfNights: 2,
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

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    // Simulate network delay
    await this.delay(800);

    // Check if user already exists
    const existingUser = this.mockUsers.find(u => u.email === request.email);
    if (existingUser) {
      throw new ApiError('Email already registered', 400);
    }

    // Create new user
    const newUser: User = {
      id: `mock-user-${Date.now()}`,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      role: UserRole.Member,
      isActive: false, // Needs admin approval
      createdAt: new Date().toISOString(),
    };

    // Add to mock users
    this.mockUsers.push(newUser);

    return {
      message: 'Registration successful. Please check your email for verification.',
      userId: newUser.id,
    };
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    // Simulate network delay
    await this.delay(600);

    // Mock token validation (in real app, this would be validated server-side)
    if (!request.token || request.token.length < 20) {
      throw new ApiError('Invalid or expired verification token', 400);
    }

    // Find user by token (simplified mock logic)
    const user = this.mockUsers.find(u => !u.isActive);
    if (!user) {
      throw new ApiError('Verification token not found or already used', 400);
    }

    // Mark user as email verified (in real app, would set EmailVerified = true)
    user.isActive = true;

    return {
      message: 'E-Mail-Adresse erfolgreich bestätigt.',
      requiresApproval: true // In mock, always requires admin approval
    };
  }

  async resendVerification(request: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    // Simulate network delay
    await this.delay(800);

    // Check if user exists
    const user = this.mockUsers.find(u => u.email === request.email);
    if (!user) {
      throw new ApiError('No account found with this email address', 404);
    }

    if (user.isActive) {
      throw new ApiError('This email address is already verified', 400);
    }

    return {
      message: 'Ein neuer Bestätigungslink wurde an Ihre E-Mail-Adresse gesendet.'
    };
  }

  async logout(): Promise<void> {
    await this.delay(200);
    this.authenticated = false;
    this.currentUser = null;
  }

  async getBookings(): Promise<Booking[]> {
    await this.delay(300);

    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    return this.mockBookings;
  }

  async healthCheck(): Promise<{ status: string }> {
    await this.delay(100);
    return { status: 'healthy' };
  }

  // Booking CRUD operations
  async getBookingById(id: string): Promise<Booking> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const booking = this.mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    return booking;
  }

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    await this.delay(400);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const newBooking: Booking = {
      id: `mock-booking-${Date.now()}`,
      userId: typeof this.currentUser?.id === 'number' ? this.currentUser.id : 1,
      userName: this.currentUser?.firstName + ' ' + this.currentUser?.lastName || 'Unknown',
      userEmail: this.currentUser?.email || 'unknown@example.com',
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: BookingStatus.Pending,
      notes: booking.notes,
      bookingItems: booking.bookingItems.map(item => ({
        sleepingAccommodationId: item.sleepingAccommodationId,
        sleepingAccommodationName: `Mock Room ${item.sleepingAccommodationId}`,
        personCount: item.personCount,
      })),
      totalPersons: booking.bookingItems.reduce((sum, item) => sum + item.personCount, 0),
      numberOfNights: Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      createdAt: new Date().toISOString(),
      changedAt: new Date().toISOString(),
    };

    this.mockBookings.push(newBooking);
    return newBooking;
  }

  async updateBooking(id: string, booking: UpdateBookingRequest): Promise<Booking> {
    await this.delay(300);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const existingBooking = this.mockBookings.find(b => b.id === id);
    if (!existingBooking) {
      throw new ApiError('Booking not found', 404);
    }

    const updatedBooking: Booking = {
      ...existingBooking,
      startDate: booking.startDate,
      endDate: booking.endDate,
      notes: booking.notes,
      bookingItems: booking.bookingItems.map(item => ({
        sleepingAccommodationId: item.sleepingAccommodationId,
        sleepingAccommodationName: `Mock Room ${item.sleepingAccommodationId}`,
        personCount: item.personCount,
      })),
      totalPersons: booking.bookingItems.reduce((sum, item) => sum + item.personCount, 0),
      numberOfNights: Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      changedAt: new Date().toISOString(),
    };

    const index = this.mockBookings.findIndex(b => b.id === id);
    this.mockBookings[index] = updatedBooking;
    return updatedBooking;
  }

  async cancelBooking(id: string): Promise<void> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const booking = this.mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    booking.status = BookingStatus.Cancelled;
    booking.changedAt = new Date().toISOString();
  }

  async confirmBooking(id: string): Promise<void> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const booking = this.mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    booking.status = BookingStatus.Confirmed;
    booking.changedAt = new Date().toISOString();
  }

  async acceptBooking(id: string): Promise<void> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const booking = this.mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    booking.status = BookingStatus.Accepted;
    booking.changedAt = new Date().toISOString();
  }

  async rejectBooking(id: string): Promise<void> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const booking = this.mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    booking.status = BookingStatus.Rejected;
    booking.changedAt = new Date().toISOString();
  }

  async checkAvailability(startDate: string, endDate: string, excludeBookingId?: string): Promise<BookingAvailability> {
    await this.delay(300);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    // Note: excludeBookingId parameter is not used in mock implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = excludeBookingId;

    // Mock availability data
    return {
      startDate,
      endDate,
      accommodations: [
        {
          id: 'room-1',
          name: 'Main Bedroom',
          maxCapacity: 4,
          isAvailable: true,
          availableCapacity: 2,
          conflictingBookings: [],
        },
        {
          id: 'room-2', 
          name: 'Guest Room',
          maxCapacity: 4,
          isAvailable: true,
          availableCapacity: 4,
          conflictingBookings: [],
        }
      ]
    };
  }

  // Sleeping Accommodations CRUD operations
  async getSleepingAccommodations(includeInactive?: boolean): Promise<SleepingAccommodation[]> {
    await this.delay(250);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const mockAccommodations: SleepingAccommodation[] = [
      {
        id: 'room-1',
        name: 'Main Bedroom',
        type: AccommodationType.Room,
        maxCapacity: 4,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        changedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'room-2',
        name: 'Guest Room', 
        type: AccommodationType.Room,
        maxCapacity: 4,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        changedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'room-3',
        name: 'Inactive Room',
        type: AccommodationType.Room,
        maxCapacity: 2,
        isActive: false,
        createdAt: '2025-01-01T00:00:00Z',
        changedAt: '2025-01-01T00:00:00Z',
      }
    ];

    return includeInactive ? mockAccommodations : mockAccommodations.filter(acc => acc.isActive);
  }

  async getSleepingAccommodationById(id: string): Promise<SleepingAccommodation> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const accommodations = await this.getSleepingAccommodations(true);
    const accommodation = accommodations.find(acc => acc.id === id);
    if (!accommodation) {
      throw new ApiError('Sleeping accommodation not found', 404);
    }
    return accommodation;
  }

  async createSleepingAccommodation(accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation> {
    await this.delay(400);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    return {
      id: `accommodation-${Date.now()}`,
      name: accommodation.name || 'New Room',
      type: accommodation.type || AccommodationType.Room,
      maxCapacity: accommodation.maxCapacity || 2,
      isActive: accommodation.isActive ?? true,
      createdAt: new Date().toISOString(),
      changedAt: new Date().toISOString(),
    };
  }

  async updateSleepingAccommodation(id: string, accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation> {
    await this.delay(300);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    const existing = await this.getSleepingAccommodationById(id);
    return {
      ...existing,
      ...accommodation,
      id, // Ensure ID doesn't change
      changedAt: new Date().toISOString(),
    };
  }

  async deleteSleepingAccommodation(id: string): Promise<void> {
    await this.delay(200);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    // In a real implementation, this would delete the accommodation
    // For mock, we just check if it exists
    await this.getSleepingAccommodationById(id);
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

  // Token management
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Admin debug methods  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async debugBookingEvents(): Promise<any> {
    await this.delay(500);
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    // Mock debug information
    return {
      totalEvents: 42,
      readModels: 15,
      recentEvents: [
        {
          eventType: 'BookingCreated',
          version: 1,
          aggregateId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: '2025-01-15T10:00:00Z',
        },
        {
          eventType: 'BookingConfirmed',
          version: 2,
          aggregateId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: '2025-01-15T11:00:00Z',
        }
      ],
      bookingEvents: [
        {
          eventType: 'BookingCreated',
          version: 1,
          aggregateId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: '2025-01-15T10:00:00Z',
        }
      ]
    };
  }

  async rebuildBookingProjections(): Promise<{ message: string; rebuiltCount: number }> {
    await this.delay(2000); // Simulate longer operation
    if (!this.authenticated) {
      throw new ApiError('Unauthorized', 401);
    }

    return {
      message: 'Projections successfully rebuilt',
      rebuiltCount: 15
    };
  }
}

export const mockApiClient = new MockApiClient();