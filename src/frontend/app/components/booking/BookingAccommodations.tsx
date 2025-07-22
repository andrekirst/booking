'use client';

import { Booking, SleepingAccommodation, AccommodationType } from '../../../lib/types/api';

interface BookingAccommodationsProps {
  booking: Booking;
  accommodations: SleepingAccommodation[];
  accommodationsError: string | null;
  getAccommodationName: (accommodationId: string) => string;
}

export default function BookingAccommodations({ 
  booking, 
  accommodations,
  accommodationsError, 
  getAccommodationName 
}: BookingAccommodationsProps) {
  const getAccommodationTypeIcon = (type?: AccommodationType) => {
    switch (type) {
      case AccommodationType.Room:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
          </svg>
        );
      case AccommodationType.Tent:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l7-7 7 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v12h14V8" />
          </svg>
        );
      case AccommodationType.Camper:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 9l8 0l-2 -6l-4 0l-2 6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 17l-13 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8" />
          </svg>
        );
    }
  };

  const getAccommodationTypeName = (type?: AccommodationType) => {
    switch (type) {
      case AccommodationType.Room:
        return 'Zimmer';
      case AccommodationType.Tent:
        return 'Zelt';
      case AccommodationType.Camper:
        return 'Wohnmobil';
      default:
        return 'Schlafplatz';
    }
  };

  const getAccommodationDetails = (accommodationId: string) => {
    const accommodation = accommodations.find(acc => acc.id === accommodationId);
    return {
      name: accommodation?.name || getAccommodationName(accommodationId),
      type: accommodation?.type,
      maxCapacity: accommodation?.maxCapacity
    };
  };

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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {booking.bookingItems.map((item, index) => {
          const details = getAccommodationDetails(item.sleepingAccommodationId);
          
          return (
            <div
              key={index}
              className="p-4 border border-green-200 bg-green-50 rounded-xl"
            >
              {/* Accommodation Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    {getAccommodationTypeIcon(details.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{details.name}</h4>
                    <p className="text-sm text-gray-500">
                      {getAccommodationTypeName(details.type)}
                      {details.maxCapacity && ` • max. ${details.maxCapacity} ${details.maxCapacity === 1 ? 'Person' : 'Personen'}`}
                    </p>
                  </div>
                </div>

                {/* Selected Status */}
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Gebucht
                </div>
              </div>

              {/* Person Count Display */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Anzahl Personen:</span>
                <div className="flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-green-200">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-700">
                    {item.personCount} {item.personCount === 1 ? 'Person' : 'Personen'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}