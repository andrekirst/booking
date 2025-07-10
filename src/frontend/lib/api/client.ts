import { 
  LoginRequest, 
  LoginResponse, 
  BookingsResponse,
  Booking,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingAvailability,
  SleepingAccommodation,
  ErrorResponse 
} from '../types/api';
import { ApiError } from './errors';

export interface ApiClient {
  // Auth endpoints
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  
  // Booking endpoints
  getBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking>;
  createBooking(booking: CreateBookingRequest): Promise<Booking>;
  updateBooking(id: string, booking: UpdateBookingRequest): Promise<Booking>;
  cancelBooking(id: string): Promise<void>;
  confirmBooking(id: string): Promise<void>;
  checkAvailability(startDate: string, endDate: string, excludeBookingId?: string): Promise<BookingAvailability>;
  
  // Sleeping Accommodations endpoints
  getSleepingAccommodations(): Promise<SleepingAccommodation[]>;
  
  // Health check
  healthCheck(): Promise<{ status: string }>;
}

export class HttpApiClient implements ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    
    // Try to get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers if present
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      
      throw new ApiError(
        errorData.message || errorData.error || 'An error occurred',
        response.status,
        errorData
      );
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token for future requests
    this.token = response.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async getBookings(): Promise<Booking[]> {
    return this.request<Booking[]>('/api/bookings');
  }

  async getBookingById(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/bookings/${id}`);
  }

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    return this.request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: string, booking: UpdateBookingRequest): Promise<Booking> {
    return this.request<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(booking),
    });
  }

  async cancelBooking(id: string): Promise<void> {
    await this.request<void>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }

  async confirmBooking(id: string): Promise<void> {
    await this.request<void>(`/api/bookings/${id}/confirm`, {
      method: 'POST',
    });
  }

  async checkAvailability(startDate: string, endDate: string, excludeBookingId?: string): Promise<BookingAvailability> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    
    if (excludeBookingId) {
      params.append('excludeBookingId', excludeBookingId);
    }
    
    return this.request<BookingAvailability>(`/api/bookings/availability?${params.toString()}`);
  }

  async getSleepingAccommodations(): Promise<SleepingAccommodation[]> {
    return this.request<SleepingAccommodation[]>('/api/sleeping-accommodations');
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Utility methods
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Default client instance
export const apiClient = new HttpApiClient();