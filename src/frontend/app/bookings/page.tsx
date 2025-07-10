'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Booking, BookingStatus } from '../../lib/types/api';
import { apiClient } from '../../lib/api/client';
import CreateBookingButton from '../components/CreateBookingButton';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ausstehend
          </span>
        );
      case BookingStatus.Confirmed:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bestätigt
          </span>
        );
      case BookingStatus.Cancelled:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Storniert
          </span>
        );
      case BookingStatus.Completed:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abgeschlossen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unbekannt
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Booking Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </h3>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-sm text-gray-600">
              Buchungs-ID: {booking.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>{booking.numberOfNights} {booking.numberOfNights === 1 ? 'Nacht' : 'Nächte'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{booking.totalPersons} {booking.totalPersons === 1 ? 'Person' : 'Personen'}</span>
          </div>
        </div>

        {/* Accommodations */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Schlafmöglichkeiten:</p>
          <div className="space-y-1">
            {booking.bookingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-900">{item.sleepingAccommodationName}</span>
                <span className="text-gray-600">{item.personCount} {item.personCount === 1 ? 'Person' : 'Personen'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Notizen:</span> {booking.notes}
            </p>
          </div>
        )}

        {/* Creation Date */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Erstellt am {formatDate(booking.createdAt)}
            {booking.changedAt && ` • Zuletzt geändert am ${formatDate(booking.changedAt)}`}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Details anzeigen</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Buchungen:', err);
      setError(err.message || 'Fehler beim Laden der Buchungen');
      
      // Handle authentication errors
      if (err.status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    checkUserRole();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUserRole = () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
          setUserRole(role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleReload = () => {
    fetchBookings();
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleCreateBooking = () => {
    router.push('/bookings/new');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Buchungen werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Meine Buchungen
              </h1>
              <p className="text-lg text-gray-600">
                Verwalten Sie Ihre Garten-Buchungen
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <CreateBookingButton
                variant="large"
                onClick={handleCreateBooking}
              />
              {userRole === 'Administrator' && (
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Abmelden
              </button>
            </div>
          </div>
          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="ml-auto inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Neu laden
              </button>
            </div>
          )}

          {/* Bookings Grid */}
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Noch keine Buchungen
              </h3>
              <p className="text-gray-600 mb-6">
                Sie haben noch keine Buchungen erstellt. Starten Sie mit Ihrer ersten Buchung!
              </p>
              <CreateBookingButton
                variant="large"
                onClick={handleCreateBooking}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}