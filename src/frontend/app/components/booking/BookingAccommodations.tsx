'use client';

import { Booking, SleepingAccommodation } from '../../../lib/types/api';

interface BookingAccommodationsProps {
  booking: Booking;
  accommodations: SleepingAccommodation[];
  accommodationsError: string | null;
  getAccommodationName: (accommodationId: string) => string;
}

export default function BookingAccommodations({ 
  booking, 
  accommodationsError, 
  getAccommodationName 
}: BookingAccommodationsProps) {
  return (
    <div className="mb-8">
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
  );
}