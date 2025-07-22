'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Booking, BookingStatus, SleepingAccommodation } from '../../../lib/types/api';
import { apiClient } from '../../../lib/api/client';
import BookingOverview from '../../components/booking/BookingOverview';
import BookingAccommodations from '../../components/booking/BookingAccommodations';
import BookingNotes from '../../components/booking/BookingNotes';
import BookingHistory from '../../components/booking/BookingHistory';
import BookingActionMenu from '../../components/booking/BookingActionMenu';
import BookingOverviewSkeleton from '../../components/booking/skeletons/BookingOverviewSkeleton';
import BookingAccommodationsSkeleton from '../../components/booking/skeletons/BookingAccommodationsSkeleton';
import BookingHistorySkeleton from '../../components/booking/skeletons/BookingHistorySkeleton';
import BookingActionMenuSkeleton from '../../components/booking/skeletons/BookingActionMenuSkeleton';
import Tabs from '../../components/ui/Tabs';


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
            <BookingActionMenuSkeleton />
          ) : booking && (
            <BookingActionMenu
              booking={booking}
              onCancel={() => {
                // TODO: Implement cancel booking functionality
                console.log('Cancel booking:', booking.id);
              }}
              onEdit={() => router.push(`/bookings/${booking.id}/edit`)}
            />
          )}

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {(bookingLoading || accommodationsLoading) ? (
              <div className="space-y-6">
                <BookingOverviewSkeleton />
                <BookingAccommodationsSkeleton />
                <BookingHistorySkeleton />
              </div>
            ) : booking && (
              <Tabs
                tabs={[
                  {
                    id: 'details',
                    label: 'Details',
                    content: (
                      <div className="space-y-6">
                        <BookingOverview booking={booking} />
                        <BookingAccommodations
                          booking={booking}
                          accommodations={accommodations}
                          accommodationsError={accommodationsError}
                          getAccommodationName={getAccommodationName}
                        />
                        {booking.notes && <BookingNotes notes={booking.notes} />}
                      </div>
                    )
                  },
                  {
                    id: 'historie',
                    label: 'Historie',
                    content: (
                      <div className="py-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Historie wird implementiert</h3>
                        <p className="text-gray-500">
                          Die Verlaufshistorie der Buchung wird in einer zukünftigen Version verfügbar sein.
                        </p>
                      </div>
                    ),
                    disabled: true
                  }
                ]}
                defaultTab="details"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}