// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  changedAt?: string;
  lastLoginAt?: string;
}

export enum UserRole {
  Member = 0,
  Administrator = 1
}

// Booking Types
export interface Booking {
  id: string;
  createdAt: string;
  changedAt?: string;
  // TODO: Add booking-specific fields (dates, rooms, etc.)
}

export interface BookingsResponse {
  bookings: Booking[];
  count: number;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  validationErrors?: ValidationError[];
}