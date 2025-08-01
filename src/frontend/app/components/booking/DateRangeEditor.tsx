'use client';

import { useState, useEffect } from 'react';
import { Booking, BookingAvailability } from '../../../lib/types/api';
import { useApi } from '../../../contexts/ApiContext';
import { useAlert } from '../../../hooks/useAlert';
import DateRangePicker from './DateRangePicker';

interface DateRangeEditorProps {
  booking: Booking;
  onSave: (startDate: string, endDate: string, reason?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DateRangeEditor: React.FC<DateRangeEditorProps> = ({
  booking,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { apiClient } = useApi();
  const { showError } = useAlert();
  
  const [startDate, setStartDate] = useState(booking.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(booking.endDate.split('T')[0]);
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if dates have changed
  useEffect(() => {
    const originalStart = booking.startDate.split('T')[0];
    const originalEnd = booking.endDate.split('T')[0];
    setHasUnsavedChanges(startDate !== originalStart || endDate !== originalEnd);
  }, [startDate, endDate, booking.startDate, booking.endDate]);

  // Check availability when dates change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!startDate || !endDate || !hasUnsavedChanges) {
        setAvailability(null);
        return;
      }

      setIsCheckingAvailability(true);
      setError('');

      try {
        const availabilityData = await apiClient.checkAvailability(
          startDate, 
          endDate, 
          booking.id // Exclude current booking from availability check
        );
        setAvailability(availabilityData);
      } catch (error) {
        console.error('Fehler beim Prüfen der Verfügbarkeit:', error);
        setError('Verfügbarkeitsprüfung fehlgeschlagen');
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [startDate, endDate, hasUnsavedChanges, apiClient, booking.id]);

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setError('');
  };

  const handleSave = async () => {
    if (!startDate || !endDate) {
      setError('Bitte wählen Sie gültige Daten aus');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Das Enddatum muss nach dem Startdatum liegen');
      return;
    }

    // Check if accommodations are still available for new dates
    if (availability) {
      for (const bookingItem of booking.bookingItems) {
        const accommodationAvailability = availability.accommodations.find(
          a => a.id === bookingItem.sleepingAccommodationId
        );
        
        if (!accommodationAvailability || 
            accommodationAvailability.availableCapacity < bookingItem.personCount) {
          setError(
            `Schlafplatz "${bookingItem.sleepingAccommodationName}" ist für die gewählten Daten nicht verfügbar`
          );
          return;
        }
      }
    }

    try {
      await onSave(startDate, endDate, reason.trim() || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Speichern der Änderungen';
      setError(errorMessage);
      showError(errorMessage, 'Speichern fehlgeschlagen');
    }
  };

  const getNights = () => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const originalNights = () => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Reisedaten bearbeiten
        </h3>
        {hasUnsavedChanges && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Nicht gespeichert
          </span>
        )}
      </div>

      {/* Current vs New dates comparison */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aktuelle Daten</h4>
            <div className="text-sm text-gray-600">
              <div>{new Date(booking.startDate).toLocaleDateString('de-DE')} - {new Date(booking.endDate).toLocaleDateString('de-DE')}</div>
              <div className="text-xs text-gray-500 mt-1">{originalNights()} {originalNights() === 1 ? 'Nacht' : 'Nächte'}</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Neue Daten</h4>
            <div className="text-sm text-gray-900 font-medium">
              {startDate && endDate ? (
                <>
                  <div>{new Date(startDate).toLocaleDateString('de-DE')} - {new Date(endDate).toLocaleDateString('de-DE')}</div>
                  <div className="text-xs text-gray-600 mt-1">{getNights()} {getNights() === 1 ? 'Nacht' : 'Nächte'}</div>
                </>
              ) : (
                <div className="text-gray-500">Keine Änderung</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          error={error}
          availability={availability?.accommodations}
        />
        
        {isCheckingAvailability && hasUnsavedChanges && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verfügbarkeit wird geprüft...
          </div>
        )}
      </div>

      {/* Reason field */}
      <div className="mb-6">
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Begründung (optional)
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
          placeholder="Grund für die Änderung der Reisedaten..."
          maxLength={250}
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {reason.length}/250
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={isLoading || !hasUnsavedChanges || isCheckingAvailability}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Speichere...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Daten ändern
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default DateRangeEditor;