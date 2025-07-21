'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Booking, BookingStatus, SleepingAccommodation } from '../../../lib/types/api';
import { apiClient } from '../../../lib/api/client';

// Skeleton components
const BookingOverviewSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-xl p-6">
    <div className="h-6 bg-gray-200 rounded w-24 mb-6 animate-pulse"></div>
    
    {/* Hauptinformation Skeleton */}
    <div className="text-center mb-6">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <div className="w-6 h-6 bg-purple-200 rounded mr-2 animate-pulse"></div>
        <div className="h-8 bg-gray-300 rounded w-32 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-8 mx-2 animate-pulse"></div>
        <div className="w-6 h-6 bg-green-200 rounded mr-2 animate-pulse"></div>
        <div className="h-8 bg-gray-300 rounded w-24 animate-pulse"></div>
      </div>
    </div>
    
    {/* Buchungs-ID Skeleton */}
    <div className="text-center pt-4 border-t border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
    </div>
  </div>
);

const AccommodationsSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-xl p-6">
    <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
    <div className="grid gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="ml-4">
                <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-indigo-200">
                <div className="w-4 h-4 bg-indigo-200 rounded mr-2 animate-pulse"></div>
                <div className="h-4 bg-indigo-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HistorySkeleton = () => (
  <div className="bg-white rounded-2xl shadow-xl p-6">
    <div className="h-6 bg-gray-200 rounded w-16 mb-4 animate-pulse"></div>
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MenuBandSkeleton = () => (
  <div className="mb-6">
    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
      <div className="h-10 bg-red-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
      <div className="h-10 bg-blue-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
    </div>
  </div>
);

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [accommodations, setAccommodations] = useState<SleepingAccommodation[]>([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [accommodationsError, setAccommodationsError] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!bookingId) {
      setBookingError('Ungültige Buchungs-ID');
      setBookingLoading(false);
      return;
    }

    // Reset loading states
    setBookingLoading(true);
    setAccommodationsLoading(true);
    setBookingError(null);
    setAccommodationsError(null);

    // Independent API call for booking
    try {
      const bookingData = await apiClient.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Buchung:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message: string }).message) 
        : 'Fehler beim Laden der Buchung';
      setBookingError(errorMessage);
      
      // Handle authentication errors
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        router.push('/login');
      }
    } finally {
      setBookingLoading(false);
    }

    // Independent API call for accommodations
    try {
      const accommodationsData = await apiClient.getSleepingAccommodations();
      setAccommodations(accommodationsData);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Schlafmöglichkeiten:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message: string }).message) 
        : 'Fehler beim Laden der Schlafmöglichkeiten';
      setAccommodationsError(errorMessage);
    } finally {
      setAccommodationsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getAccommodationName = (accommodationId: string): string => {
    const accommodation = accommodations.find(acc => acc.id === accommodationId);
    return accommodation?.name || 'Unbekannter Schlafplatz';
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ausstehend
          </span>
        );
      case BookingStatus.Confirmed:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bestätigt
          </span>
        );
      case BookingStatus.Cancelled:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Storniert
          </span>
        );
      case BookingStatus.Completed:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abgeschlossen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Unbekannt
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Show critical error state (booking error that prevents showing anything)
  if (bookingError && !bookingLoading && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler beim Laden</h2>
            <p className="text-gray-600 mb-6">{bookingError}</p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Neu laden
              </button>
              <button
                onClick={() => router.push('/bookings')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Zurück zur Übersicht
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show "not found" only if booking loading is complete and still no booking
  if (!booking && !bookingLoading && !bookingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Buchung nicht gefunden</h2>
            <p className="text-gray-600 mb-6">Die angeforderte Buchung konnte nicht gefunden werden.</p>
            <button
              onClick={() => router.push('/bookings')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.push('/bookings')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück zur Übersicht
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Buchungsdetails
                </h1>
                {bookingLoading ? (
                  <div className="h-7 bg-gray-200 rounded w-96 animate-pulse"></div>
                ) : booking && (
                  <p className="text-lg text-gray-600">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </p>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                {bookingLoading ? (
                  <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                ) : booking && (
                  getStatusBadge(booking.status)
                )}
              </div>
            </div>
          </div>

          {/* Menüband für Aktionen */}
          {bookingLoading ? (
            <MenuBandSkeleton />
          ) : booking && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                {booking.status !== BookingStatus.Cancelled && (
                  <button
                    onClick={() => {
                      if (confirm('Möchten Sie diese Buchung wirklich stornieren?')) {
                        // TODO: Implement cancel booking functionality
                        console.log('Cancel booking:', booking.id);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Stornieren
                  </button>
                )}
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/edit`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-md"
                  disabled={booking.status === BookingStatus.Cancelled}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Bearbeiten
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Overview */}
              {bookingLoading ? (
                <BookingOverviewSkeleton />
              ) : booking && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  {/* Hauptinformation */}
                  <div className="text-center mb-6">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-2xl font-bold text-gray-900">{booking.totalPersons} Personen</span>
                      <span className="text-lg text-gray-500 mx-2">für</span>
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-2xl font-bold text-gray-900">{booking.numberOfNights} {booking.numberOfNights === 1 ? 'Nacht' : 'Nächte'}</span>
                    </div>
                  </div>
                  
                  {/* Buchungs-ID */}
                  <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 font-mono truncate">
                      ID: {booking.id}
                    </p>
                  </div>
                </div>
              )}

              {/* Accommodations */}
              {accommodationsLoading ? (
                <AccommodationsSkeleton />
              ) : booking && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Schlafmöglichkeiten</h2>
                    {accommodationsError && (
                      <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200">
                        Namen konnten nicht geladen werden
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4">
                    {booking.bookingItems.map((item, index) => (
                      <div key={index} className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                {getAccommodationName(item.sleepingAccommodationId)}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-indigo-200">
                              <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm font-semibold text-indigo-700">
                                {item.personCount} {item.personCount === 1 ? 'Person' : 'Personen'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking && booking.notes && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Notizen</h2>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-900">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              {/* Timestamps */}
              {bookingLoading ? (
                <HistorySkeleton />
              ) : booking && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Historie</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Erstellt</label>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-gray-900 text-sm">{formatDateShort(booking.createdAt)}</span>
                      </div>
                    </div>
                    {booking.changedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Geändert</label>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-gray-900 text-sm">{formatDateShort(booking.changedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}