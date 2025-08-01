'use client';

import { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../../lib/types/api';
import { useApi } from '../../../contexts/ApiContext';
import { useAlert } from '../../../hooks/useAlert';
import DateRangeEditor from './DateRangeEditor';

interface BookingDateRangeProps {
  booking: Booking;
  onBookingUpdate?: (updatedBooking: Booking) => void;
  allowEditing?: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function BookingDateRange({ 
  booking, 
  onBookingUpdate,
  allowEditing = true 
}: BookingDateRangeProps) {
  const { apiClient } = useApi();
  const { showSuccess, showError, AlertComponent } = useAlert();
  
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticBooking, setOptimisticBooking] = useState<Booking>(booking);
  const [isLoading, setIsLoading] = useState(false);

  // Update optimistic booking when prop changes
  useEffect(() => {
    if (booking.id !== optimisticBooking.id || 
        booking.changedAt !== optimisticBooking.changedAt ||
        booking.startDate !== optimisticBooking.startDate ||
        booking.endDate !== optimisticBooking.endDate) {
      console.log('🔄 DateRange: Updating optimistic booking from prop change');
      console.log('🔄 Old optimistic booking dates:', {start: optimisticBooking.startDate, end: optimisticBooking.endDate});
      console.log('🔄 New booking from props dates:', {start: booking.startDate, end: booking.endDate});
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

  const handleSave = async (startDate: string, endDate: string, reason?: string) => {
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
      
      console.log('🔧 DateRange change result:', result);
      console.log('🔧 Calling onBookingUpdate with:', result);
      
      setOptimisticBooking(result);
      onBookingUpdate?.(result);
      setIsEditing(false);
      showSuccess('Buchungsdaten erfolgreich geändert');
    } catch (error) {
      // Rollback optimistic update
      setOptimisticBooking(booking);
      const message = error instanceof Error ? error.message : 'Fehler beim Ändern der Buchungsdaten';
      showError(message);
      throw error; // Re-throw to show error in component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {AlertComponent}
      
      {isEditing ? (
        <div className="animate-fadeInDown">
          <DateRangeEditor
            booking={optimisticBooking}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Buchungszeitraum</h2>
            {allowEditing && booking.status === BookingStatus.Pending && (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="inline-flex items-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Datum bearbeiten"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-lg text-gray-600">
            {formatDate(optimisticBooking.startDate)} - {formatDate(optimisticBooking.endDate)}
          </p>
        </div>
      )}
    </div>
  );
}