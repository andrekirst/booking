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
  userId: number;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  notes?: string;
  bookingItems: BookingItem[];
  totalPersons: number;
  numberOfNights: number;
  createdAt: string;
  changedAt?: string;
}

export interface BookingItem {
  sleepingAccommodationId: string;
  sleepingAccommodationName: string;
  personCount: number;
}

export interface CreateBookingRequest {
  startDate: string;
  endDate: string;
  notes?: string;
  bookingItems: CreateBookingItem[];
}

export interface CreateBookingItem {
  sleepingAccommodationId: string;
  personCount: number;
}

export interface UpdateBookingRequest {
  startDate: string;
  endDate: string;
  notes?: string;
  bookingItems: CreateBookingItem[];
}

export interface BookingAvailability {
  startDate: string;
  endDate: string;
  accommodations: SleepingAccommodationAvailability[];
}

export interface SleepingAccommodationAvailability {
  id: string;
  name: string;
  maxCapacity: number;
  isAvailable: boolean;
  availableCapacity: number;
  conflictingBookings: ConflictingBooking[];
}

export interface ConflictingBooking {
  bookingId: string;
  startDate: string;
  endDate: string;
  personCount: number;
  userName: string;
}

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3
}

export interface BookingsResponse {
  bookings: Booking[];
  count: number;
}

// Sleeping Accommodation Types
export interface SleepingAccommodation {
  id: string;
  name: string;
  type: AccommodationType;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  changedAt?: string;
}

export enum AccommodationType {
  Room = 0,
  Tent = 1,
  Camper = 2,
  Other = 3
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