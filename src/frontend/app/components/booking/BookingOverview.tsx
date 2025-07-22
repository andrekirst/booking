'use client';

import { Booking } from '../../../lib/types/api';

interface BookingOverviewProps {
  booking: Booking;
}

export default function BookingOverview({ booking }: BookingOverviewProps) {
  return (
    <div className="mb-8">
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
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 font-mono truncate">
          ID: {booking.id}
        </p>
      </div>
    </div>
  );
}