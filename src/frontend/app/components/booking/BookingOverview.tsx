'use client';

import { useState } from 'react';
import { Booking, BookingEditState, CreateBookingItem } from '../../../lib/types/api';
import { useApi } from '../../../contexts/ApiContext';
import { useAlert } from '../../../hooks/useAlert';
import DateRangeEditor from './DateRangeEditor';
import AccommodationEditor from './AccommodationEditor';
import NotesEditor from './NotesEditor';

interface BookingOverviewProps {
  booking: Booking;
  onBookingUpdate?: (updatedBooking: Booking) => void;
  allowEditing?: boolean;
}

export default function BookingOverview({ 
  booking, 
  onBookingUpdate,
  allowEditing = true 
}: BookingOverviewProps) {
  const { apiClient } = useApi();
  const { showSuccess, showError, AlertComponent } = useAlert();
  
  const [editState, setEditState] = useState<BookingEditState>({
    isEditingDateRange: false,
    isEditingAccommodations: false,
    isEditingNotes: false,
    hasUnsavedChanges: false
  });
  
  const [optimisticBooking, setOptimisticBooking] = useState<Booking>(booking);
  const [isLoading, setIsLoading] = useState(false);

  // Update optimistic booking when prop changes
  if (booking.id !== optimisticBooking.id || booking.changedAt !== optimisticBooking.changedAt) {
    setOptimisticBooking(booking);
  }

  const handleDateRangeEdit = () => {
    setEditState(prev => ({
      ...prev,
      isEditingDateRange: true,
      isEditingAccommodations: false,
      isEditingNotes: false
    }));
  };

  const handleAccommodationEdit = () => {
    setEditState(prev => ({
      ...prev,
      isEditingDateRange: false,
      isEditingAccommodations: true,
      isEditingNotes: false
    }));
  };

  const handleNotesEdit = () => {
    setEditState(prev => ({
      ...prev,
      isEditingDateRange: false,
      isEditingAccommodations: false,
      isEditingNotes: true
    }));
  };

  const handleCancelEdit = () => {
    setEditState({
      isEditingDateRange: false,
      isEditingAccommodations: false,
      isEditingNotes: false,
      hasUnsavedChanges: false
    });
    // Restore original booking data
    setOptimisticBooking(booking);
  };

  const handleDateRangeSave = async (startDate: string, endDate: string, reason?: string) => {
    setIsLoading(true);
    
    // Optimistic update
    const updatedBooking = {
      ...optimisticBooking,
      startDate: `${startDate}T00:00:00Z`,
      endDate: `${endDate}T23:59:59Z`,
      numberOfNights: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    };
    setOptimisticBooking(updatedBooking);

    try {
      const result = await apiClient.changeDateRange(booking.id, {
        startDate,
        endDate,
        reason
      });
      
      setOptimisticBooking(result);
      onBookingUpdate?.(result);
      setEditState({ ...editState, isEditingDateRange: false });
      showSuccess('Reisedaten erfolgreich geändert');
    } catch (error) {
      // Rollback optimistic update
      setOptimisticBooking(booking);
      const message = error instanceof Error ? error.message : 'Fehler beim Ändern der Reisedaten';
      showError(message);
      throw error; // Re-throw to show error in component
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccommodationsSave = async (bookingItems: CreateBookingItem[], reason?: string) => {
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
        bookingItems,
        reason
      });
      
      setOptimisticBooking(result);
      onBookingUpdate?.(result);
      setEditState({ ...editState, isEditingAccommodations: false });
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

  const handleNotesSave = async (notes?: string, reason?: string) => {
    setIsLoading(true);

    // Optimistic update
    const updatedBooking = {
      ...optimisticBooking,
      notes: notes || undefined
    };
    setOptimisticBooking(updatedBooking);

    try {
      const result = await apiClient.changeNotes(booking.id, {
        notes,
        reason
      });
      
      setOptimisticBooking(result);
      onBookingUpdate?.(result);
      setEditState({ ...editState, isEditingNotes: false });
      showSuccess('Notizen erfolgreich geändert');
    } catch (error) {
      // Rollback optimistic update
      setOptimisticBooking(booking);
      const message = error instanceof Error ? error.message : 'Fehler beim Ändern der Notizen';
      showError(message);
      throw error; // Re-throw to show error in component
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = editState.isEditingDateRange || editState.isEditingAccommodations || editState.isEditingNotes;

  return (
    <div className="mb-8" data-testid="booking-overview">
      {AlertComponent}
      
      {/* Edit Mode Components */}
      {editState.isEditingDateRange && (
        <div className="mb-6">
          <DateRangeEditor
            booking={optimisticBooking}
            onSave={handleDateRangeSave}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
          />
        </div>
      )}

      {editState.isEditingAccommodations && (
        <div className="mb-6">
          <AccommodationEditor
            booking={optimisticBooking}
            onSave={handleAccommodationsSave}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
          />
        </div>
      )}

      {editState.isEditingNotes && (
        <div className="mb-6">
          <NotesEditor
            booking={optimisticBooking}
            onSave={handleNotesSave}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Overview Display */}
      {!isEditing && (
        <>
          {/* Hauptinformation */}
          <div className="text-center mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">{optimisticBooking.totalPersons} Personen</span>
              <span className="text-lg text-gray-500 mx-2">für</span>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">{optimisticBooking.numberOfNights} {optimisticBooking.numberOfNights === 1 ? 'Nacht' : 'Nächte'}</span>
            </div>
          </div>

          {/* Quick Edit Buttons */}
          {allowEditing && booking.status === 'Pending' && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <button
                onClick={handleDateRangeEdit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Datum ändern
              </button>
              <button
                onClick={handleAccommodationEdit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Schlafplätze ändern
              </button>
              <button
                onClick={handleNotesEdit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notizen bearbeiten
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}