'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingForm from '../../components/booking/BookingForm';

export default function NewBookingPage() {
  const router = useRouter();
  const [isCreated, setIsCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const handleSuccess = (bookingId: string) => {
    setCreatedBookingId(bookingId);
    setIsCreated(true);
    
    // Redirect to booking details after a short delay
    setTimeout(() => {
      router.push(`/bookings/${bookingId}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/bookings');
  };

  if (isCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Buchung erfolgreich erstellt!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Ihre Buchung wurde erfolgreich erstellt und ist nun bestätigt.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Buchungs-ID:</p>
            <p className="font-mono text-sm text-gray-900 break-all">{createdBookingId}</p>
          </div>
          
          <p className="text-sm text-blue-600">
            Sie werden automatisch zu den Buchungsdetails weitergeleitet...
          </p>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push(`/bookings/${createdBookingId}`)}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-colors"
            >
              Zu den Buchungsdetails
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
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Garten Buchung
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Planen Sie Ihren perfekten Aufenthalt in unserem Garten. 
              Wählen Sie Ihre Reisedaten und die gewünschten Schlafmöglichkeiten.
            </p>
          </div>

          {/* Navigation Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
            <button
              onClick={() => router.push('/bookings')}
              className="hover:text-blue-600 transition-colors"
            >
              Buchungen
            </button>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Neue Buchung</span>
          </nav>

          {/* Booking Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <BookingForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Hilfe & Tipps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Verfügbarkeit:</strong> Schlafmöglichkeiten werden automatisch auf Verfügbarkeit geprüft
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
                </svg>
                <div>
                  <strong>Buchungsänderungen:</strong> Sie können Ihre Buchung später noch anpassen
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <strong>Kapazitäten:</strong> Beachten Sie die maximale Personenzahl je Schlafmöglichkeit
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Anreise:</strong> Check-in ist ab 15:00 Uhr möglich, Check-out bis 11:00 Uhr
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}