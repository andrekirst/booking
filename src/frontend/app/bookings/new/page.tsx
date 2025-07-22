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
          
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <button
              onClick={() => router.push(`/bookings/${createdBookingId}`)}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-colors"
            >
              Zu den Buchungsdetails
            </button>
            <button
              onClick={() => router.push('/bookings')}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 transition-colors"
            >
              Zur Buchungsübersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <BookingForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}