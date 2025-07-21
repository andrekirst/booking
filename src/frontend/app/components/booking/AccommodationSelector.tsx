'use client';

import { useState, useEffect } from 'react';
import { SleepingAccommodation, SleepingAccommodationAvailability, CreateBookingItem, AccommodationType } from '../../../lib/types/api';
import NumberSpinner from '../ui/NumberSpinner';

interface AccommodationSelectorProps {
  accommodations: SleepingAccommodation[];
  availability?: SleepingAccommodationAvailability[];
  selectedItems: CreateBookingItem[];
  onSelectionChange: (items: CreateBookingItem[]) => void;
  className?: string;
  error?: string;
}

export default function AccommodationSelector({
  accommodations,
  availability,
  selectedItems,
  onSelectionChange,
  className = '',
  error
}: AccommodationSelectorProps) {
  const [localSelectedItems, setLocalSelectedItems] = useState<CreateBookingItem[]>(selectedItems);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedItems(selectedItems);
  }, [selectedItems]);

  const getAccommodationTypeIcon = (type: AccommodationType) => {
    switch (type) {
      case AccommodationType.Room:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const getAccommodationTypeName = (type: AccommodationType) => {
    switch (type) {
      case AccommodationType.Room:
        return 'Zimmer';
      case AccommodationType.Tent:
        return 'Zelt';
      case AccommodationType.Camper:
        return 'Wohnmobil';
      default:
        return 'Sonstiges';
    }
  };

  const getAvailabilityInfo = (accommodationId: string) => {
    if (!availability) return null;
    return availability.find(a => a.id === accommodationId);
  };

  const getMaxPersonCount = (accommodationId: string) => {
    const accommodation = accommodations.find(a => a.id === accommodationId);
    const availabilityInfo = getAvailabilityInfo(accommodationId);
    
    if (!accommodation) return 0;
    
    // If availability is checked, use available capacity, otherwise use max capacity
    if (availabilityInfo) {
      return availabilityInfo.availableCapacity;
    }
    
    return accommodation.maxCapacity;
  };

  const handlePersonCountChange = (accommodationId: string, personCount: number) => {
    const newItems = [...localSelectedItems];
    const existingIndex = newItems.findIndex(item => item.sleepingAccommodationId === accommodationId);
    
    if (personCount > 0) {
      if (existingIndex >= 0) {
        newItems[existingIndex] = { sleepingAccommodationId: accommodationId, personCount };
      } else {
        newItems.push({ sleepingAccommodationId: accommodationId, personCount });
      }
    } else {
      if (existingIndex >= 0) {
        newItems.splice(existingIndex, 1);
      }
    }
    
    setLocalSelectedItems(newItems);
    onSelectionChange(newItems);
  };

  const getCurrentPersonCount = (accommodationId: string) => {
    const item = localSelectedItems.find(item => item.sleepingAccommodationId === accommodationId);
    return item?.personCount || 0;
  };

  const getTotalPersons = () => {
    return localSelectedItems.reduce((total, item) => total + item.personCount, 0);
  };

  const activeAccommodations = accommodations.filter(acc => acc.isActive);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Schlafmöglichkeiten auswählen</h3>
        {localSelectedItems.length > 0 && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Gesamt: {getTotalPersons()} {getTotalPersons() === 1 ? 'Person' : 'Personen'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeAccommodations.map((accommodation) => {
          const availabilityInfo = getAvailabilityInfo(accommodation.id);
          const maxPersons = getMaxPersonCount(accommodation.id);
          const currentPersons = getCurrentPersonCount(accommodation.id);
          const isUnavailable = Boolean(availability && availabilityInfo && !availabilityInfo.isAvailable && maxPersons === 0);

          return (
            <div
              key={accommodation.id}
              className={`relative p-4 border rounded-xl transition-all ${
                currentPersons > 0
                  ? 'border-green-300 bg-green-50'
                  : isUnavailable
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Accommodation Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    currentPersons > 0
                      ? 'bg-green-100 text-green-600'
                      : isUnavailable
                      ? 'bg-red-100 text-red-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getAccommodationTypeIcon(accommodation.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{accommodation.name}</h4>
                    <p className="text-sm text-gray-500">
                      {getAccommodationTypeName(accommodation.type)} • max. {accommodation.maxCapacity} {accommodation.maxCapacity === 1 ? 'Person' : 'Personen'}
                    </p>
                  </div>
                </div>

                {/* Availability Status */}
                {availability && availabilityInfo && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    availabilityInfo.isAvailable
                      ? maxPersons === accommodation.maxCapacity
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {availabilityInfo.isAvailable
                      ? maxPersons === accommodation.maxCapacity
                        ? 'Verfügbar'
                        : `${maxPersons} frei`
                      : 'Belegt'
                    }
                  </div>
                )}
              </div>

              {/* Person Count Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Anzahl Personen:</span>
                <NumberSpinner
                  value={currentPersons}
                  onChange={(value) => handlePersonCountChange(accommodation.id, value)}
                  min={0}
                  max={maxPersons}
                  disabled={isUnavailable}
                  className="ml-3"
                />
              </div>

              {/* Conflicting Bookings */}
              {availability && availabilityInfo && availabilityInfo.conflictingBookings.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700 font-medium mb-1">Teilweise belegt:</p>
                  <div className="space-y-1">
                    {availabilityInfo.conflictingBookings.map((conflict, index) => (
                      <p key={index} className="text-xs text-yellow-600">
                        {conflict.userName}: {conflict.personCount} {conflict.personCount === 1 ? 'Person' : 'Personen'} 
                        ({new Date(conflict.startDate).toLocaleDateString('de-DE')} - {new Date(conflict.endDate).toLocaleDateString('de-DE')})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 rounded-xl">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* No Accommodations Available */}
      {activeAccommodations.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">Keine Schlafmöglichkeiten verfügbar</p>
        </div>
      )}
    </div>
  );
}