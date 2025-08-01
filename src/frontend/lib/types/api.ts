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

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
  requiresApproval: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

// Admin User Management Types
export interface PendingUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  emailVerifiedAt: string | null;
  emailVerified: boolean;
}

export interface ApproveUserResponse {
  message: string;
}

export interface RejectUserRequest {
  reason?: string;
}

export interface RejectUserResponse {
  message: string;
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

// Booking History Types
export interface BookingHistoryEntry {
  id: string;
  eventType: BookingHistoryEventType;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  details?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
}

export enum BookingHistoryEventType {
  Created = 'Created',
  Updated = 'Updated',
  StatusChanged = 'StatusChanged',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotesUpdated = 'NotesUpdated',
  AccommodationsChanged = 'AccommodationsChanged',
  DatesChanged = 'DatesChanged'
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
  Completed = 3,
  Accepted = 4,
  Rejected = 5
}

export enum TimeRange {
  Future = 0,    // Nur aktuelle und zukünftige Buchungen (Standard)
  All = 1,       // Alle Buchungen (inkl. vergangene)
  Past = 2,      // Nur vergangene Buchungen
  Last30Days = 3, // Letzte 30 Tage
  LastYear = 4    // Letztes Jahr
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

// Email Settings Types
export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
  isConfigured: boolean;
}

export interface UpdateEmailSettingsRequest {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
}

export interface EmailSettingsResponse {
  message: string;
  settings: EmailSettings;
}

export interface TestEmailRequest {
  toEmail: string;
  subject?: string;
  body?: string;
}

export interface TestEmailResponse {
  message: string;
  success: boolean;
}