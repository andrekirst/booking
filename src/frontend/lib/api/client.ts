import {
  ApproveUserResponse,
  Booking,
  BookingAvailability,
  BookingStatus,
  CreateBookingRequest,
  EmailSettings,
  EmailSettingsResponse,
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  PendingUser,
  RegisterRequest,
  RegisterResponse,
  RejectUserRequest,
  RejectUserResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  SleepingAccommodation,
  TestEmailRequest,
  TestEmailResponse,
  TimeRange,
  UpdateBookingRequest,
  UpdateEmailSettingsRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "../types/api";
import { ApiError } from "./errors";

export interface ApiClient {
  // Auth endpoints
  login(credentials: LoginRequest): Promise<LoginResponse>;
  register(request: RegisterRequest): Promise<RegisterResponse>;
  verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse>;
  resendVerification(request: ResendVerificationRequest): Promise<ResendVerificationResponse>;
  logout(): Promise<void>;

  // Booking endpoints
  getBookings(timeRange?: TimeRange, status?: BookingStatus): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking>;
  createBooking(booking: CreateBookingRequest): Promise<Booking>;
  updateBooking(id: string, booking: UpdateBookingRequest): Promise<Booking>;
  cancelBooking(id: string): Promise<void>;
  confirmBooking(id: string): Promise<void>;
  acceptBooking(id: string): Promise<void>;
  rejectBooking(id: string): Promise<void>;
  checkAvailability(
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<BookingAvailability>;

  // Sleeping Accommodations endpoints
  getSleepingAccommodations(includeInactive?: boolean): Promise<SleepingAccommodation[]>;
  getSleepingAccommodationById(id: string): Promise<SleepingAccommodation>;
  createSleepingAccommodation(accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation>;
  updateSleepingAccommodation(id: string, accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation>;
  deleteSleepingAccommodation(id: string): Promise<void>;

  // Health check
  healthCheck(): Promise<{ status: string }>;

  // Admin functions
  debugBookingEvents(): Promise<{ totalEvents: number; bookingEvents: number; readModels: number; recentEvents: Array<{ eventType: string; version: number; aggregateId: string; timestamp: string }> }>;
  rebuildBookingProjections(): Promise<{ message: string }>;

  // Admin endpoints
  getPendingUsers(): Promise<PendingUser[]>;
  approveUser(userId: number): Promise<ApproveUserResponse>;
  rejectUser(userId: number, reason?: string): Promise<RejectUserResponse>;

  // Email Settings endpoints
  getEmailSettings(): Promise<EmailSettings>;
  updateEmailSettings(settings: UpdateEmailSettingsRequest): Promise<EmailSettingsResponse>;
  testEmailSettings(request: TestEmailRequest): Promise<TestEmailResponse>;

  // Token management
  setToken(token: string): void;
  getToken(): string | null;
}

export class HttpApiClient implements ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
  ) {
    this.baseUrl = baseUrl;

    // Try to get token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  // Method to refresh token from localStorage
  private refreshToken(): void {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Refresh token from localStorage before each request
    this.refreshToken();

    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add existing headers if present
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers[key] = value;
        }
      });
    }

    // Add auth token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: ErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: "Unknown error",
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        console.error(`[API] Error ${response.status}:`, errorData);

        // Handle specific error codes
        if (response.status === 401) {
          // Token expired or invalid
          this.logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        throw new ApiError(
          errorData.message || errorData.error || "An error occurred",
          response.status,
          errorData
        );
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      console.log(`[API] Response:`, data);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error(`[API] Network error:`, error);
      throw new ApiError(
        "Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung.",
        0,
        { error: error instanceof Error ? error.message : "Unknown error" }
      );
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Store token for future requests
    this.token = response.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", response.token);
    }

    return response;
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response;
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await this.request<VerifyEmailResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response;
  }

  async resendVerification(request: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    const response = await this.request<ResendVerificationResponse>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  async getBookings(timeRange?: TimeRange, status?: BookingStatus): Promise<Booking[]> {
    console.log('🌐 API Client getBookings called');
    console.log('🌐 timeRange:', timeRange);
    console.log('🌐 status:', status);
    
    const params = new URLSearchParams();
    if (timeRange !== undefined) {
      params.append("timeRange", timeRange.toString());
    }
    if (status !== undefined) {
      params.append("status", status.toString());
    }
    const queryString = params.toString();
    const finalUrl = `/bookings${queryString ? `?${queryString}` : ""}`;
    
    console.log('🌐 Final URL:', finalUrl);
    console.log('🌐 Query string:', queryString);
    
    return this.request<Booking[]>(finalUrl);
  }

  async getBookingById(id: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    return this.request<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(
    id: string,
    booking: UpdateBookingRequest
  ): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(booking),
    });
  }

  async cancelBooking(id: string): Promise<void> {
    await this.request<void>(`/bookings/${id}/cancel`, {
      method: "POST",
    });
  }

  async confirmBooking(id: string): Promise<void> {
    await this.request<void>(`/bookings/${id}/confirm`, {
      method: "POST",
    });
  }

  async acceptBooking(id: string): Promise<void> {
    await this.request<void>(`/bookings/${id}/accept`, {
      method: "POST",
    });
  }

  async rejectBooking(id: string): Promise<void> {
    await this.request<void>(`/bookings/${id}/reject`, {
      method: "POST",
    });
  }

  async checkAvailability(
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<BookingAvailability> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (excludeBookingId) {
      params.append("excludeBookingId", excludeBookingId);
    }

    return this.request<BookingAvailability>(
      `/bookings/availability?${params.toString()}`
    );
  }

  async getSleepingAccommodations(includeInactive: boolean = false): Promise<SleepingAccommodation[]> {
    return this.request<SleepingAccommodation[]>(
      `/sleeping-accommodations?includeInactive=${includeInactive}`
    );
  }

  async getSleepingAccommodationById(id: string): Promise<SleepingAccommodation> {
    return this.request<SleepingAccommodation>(`/sleeping-accommodations/${id}`);
  }

  async createSleepingAccommodation(accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation> {
    return this.request<SleepingAccommodation>("/sleeping-accommodations", {
      method: "POST",
      body: JSON.stringify(accommodation),
    });
  }

  async updateSleepingAccommodation(id: string, accommodation: Partial<SleepingAccommodation>): Promise<SleepingAccommodation> {
    return this.request<SleepingAccommodation>(`/sleeping-accommodations/${id}`, {
      method: "PUT",
      body: JSON.stringify(accommodation),
    });
  }

  async deleteSleepingAccommodation(id: string): Promise<void> {
    await this.request<void>(`/sleeping-accommodations/${id}`, {
      method: "DELETE",
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }

  async debugBookingEvents(): Promise<{ totalEvents: number; bookingEvents: number; readModels: number; recentEvents: Array<{ eventType: string; version: number; aggregateId: string; timestamp: string }> }> {
    return this.request<{ totalEvents: number; bookingEvents: number; readModels: number; recentEvents: Array<{ eventType: string; version: number; aggregateId: string; timestamp: string }> }>("/bookings/debug/events");
  }

  async rebuildBookingProjections(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/bookings/projections/rebuild", {
      method: "POST",
    });
  }

  // Admin user management
  async getPendingUsers(): Promise<PendingUser[]> {
    return this.request<PendingUser[]>("/admin/users/pending");
  }

  async approveUser(userId: number): Promise<ApproveUserResponse> {
    return this.request<ApproveUserResponse>(`/admin/users/${userId}/approve`, {
      method: "POST",
    });
  }

  async rejectUser(userId: number, reason?: string): Promise<RejectUserResponse> {
    const request: RejectUserRequest = { reason };
    return this.request<RejectUserResponse>(`/admin/users/${userId}/reject`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Email Settings
  async getEmailSettings(): Promise<EmailSettings> {
    return this.request<EmailSettings>("/admin/email-settings");
  }

  async updateEmailSettings(settings: UpdateEmailSettingsRequest): Promise<EmailSettingsResponse> {
    return this.request<EmailSettingsResponse>("/admin/email-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async testEmailSettings(request: TestEmailRequest): Promise<TestEmailResponse> {
    return this.request<TestEmailResponse>("/admin/email-settings/test", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Utility methods
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
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
