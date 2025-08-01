'use client';

import { useState, useEffect } from 'react';
import { Booking, SleepingAccommodation, AccommodationType, BookingStatus, CreateBookingItem } from '../../../lib/types/api';
import { useApi } from '../../../contexts/ApiContext';
import { useAlert } from '../../../hooks/useAlert';
import AccommodationEditor from './AccommodationEditor';

interface BookingAccommodationsProps {
  booking: Booking;
  accommodations: SleepingAccommodation[];
  accommodationsError: string | null;
  getAccommodationName: (accommodationId: string) => string;
  onBookingUpdate?: (updatedBooking: Booking) => void;
  allowEditing?: boolean;
}

export default function BookingAccommodations({ 
  booking, 
  accommodations,
  accommodationsError, 
  getAccommodationName,
  onBookingUpdate,
  allowEditing = true
}: BookingAccommodationsProps) {
  const { apiClient } = useApi();
  const { showSuccess, showError, AlertComponent } = useAlert();
  
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticBooking, setOptimisticBooking] = useState<Booking>(booking);
  const [isLoading, setIsLoading] = useState(false);

  // Update optimistic booking when prop changes
  useEffect(() => {
    if (booking.id !== optimisticBooking.id || 
        booking.changedAt !== optimisticBooking.changedAt ||
        JSON.stringify(booking.bookingItems) !== JSON.stringify(optimisticBooking.bookingItems)) {
      console.log('🔄 Accommodations: Updating optimistic booking from prop change');
      console.log('🔄 Old optimistic booking:', optimisticBooking.bookingItems);
      console.log('🔄 New booking from props:', booking.bookingItems);
      setOptimisticBooking(booking);
    }
  }, [booking, optimisticBooking]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restore original booking data
    setOptimisticBooking(booking);
  };

  const handleSave = async (bookingItems: CreateBookingItem[], reason?: string) => {
    setIsLoading(true);

    // Optimistic update - calculate new totals
    const newTotalPersons = bookingItems.reduce((total, item) => total + item.personCount, 0);
    const updatedBooking = {
      ...optimisticBooking,
      bookingItems: bookingItems.map(item => ({
        sleepingAccommodationId: item.sleepingAccommodationId,
        sleepingAccommodationName: 'Loading...', // Will be updated from API response
        personCount: item.personCount
      })),
      totalPersons: newTotalPersons
    };
    setOptimisticBooking(updatedBooking);

    try {
      const result = await apiClient.changeAccommodations(booking.id, {
        bookingItems
      });
      
      console.log('🔧 Accommodation change result:', result);
      console.log('🔧 Calling onBookingUpdate with:', result);
      
      setOptimisticBooking(result);
      onBookingUpdate?.(result);
      setIsEditing(false);
      showSuccess('Schlafplätze erfolgreich geändert');
    } catch (error) {
      // Rollback optimistic update
      setOptimisticBooking(booking);
      const message = error instanceof Error ? error.message : 'Fehler beim Ändern der Schlafplätze';
      showError(message);
      throw error; // Re-throw to show error in component
    } finally {
      setIsLoading(false);
    }
  };
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
      {AlertComponent}
      
      {isEditing ? (
        <div className="animate-fadeInDown">
          <AccommodationEditor
            booking={optimisticBooking}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Schlafmöglichkeiten</h2>
              {allowEditing && booking.status === BookingStatus.Pending && (
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="inline-flex items-center p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="Schlafplätze bearbeiten"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            {accommodationsError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200">
                Namen konnten nicht geladen werden
              </div>
            )}
          </div>
      
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {optimisticBooking.bookingItems.map((item, index) => {
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
      )}
    </div>
  );
}