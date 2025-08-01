'use client';

import { useState, useEffect } from 'react';
import { Booking, CreateBookingItem, SleepingAccommodation, BookingAvailability } from '../../../lib/types/api';
import { useApi } from '../../../contexts/ApiContext';
import { useAlert } from '../../../hooks/useAlert';
import AccommodationSelector from './AccommodationSelector';

interface AccommodationEditorProps {
  booking: Booking;
  onSave: (bookingItems: CreateBookingItem[], reason?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AccommodationEditor: React.FC<AccommodationEditorProps> = ({
  booking,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { apiClient } = useApi();
  const { showError } = useAlert();
  
  const [selectedItems, setSelectedItems] = useState<CreateBookingItem[]>(
    booking.bookingItems.map(item => ({
      sleepingAccommodationId: item.sleepingAccommodationId,
      personCount: item.personCount
    }))
  );
  const [reason, setReason] = useState('');
  const [accommodations, setAccommodations] = useState<SleepingAccommodation[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load accommodations on mount
  useEffect(() => {
    const loadAccommodations = async () => {
      try {
        const data = await apiClient.getSleepingAccommodations();
        setAccommodations(data);
      } catch (error) {
        console.error('Fehler beim Laden der Schlafmöglichkeiten:', error);
        setError('Fehler beim Laden der Schlafmöglichkeiten');
      }
    };

    loadAccommodations();
  }, [apiClient]);

  // Check availability when component mounts
  useEffect(() => {
    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      try {
        const startDate = booking.startDate.split('T')[0];
        const endDate = booking.endDate.split('T')[0];
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
  }, [apiClient, booking.id, booking.startDate, booking.endDate]);

  // Check if accommodations have changed
  useEffect(() => {
    const originalItems = booking.bookingItems.map(item => ({
      sleepingAccommodationId: item.sleepingAccommodationId,
      personCount: item.personCount
    }));

    const hasChanged = JSON.stringify(selectedItems) !== JSON.stringify(originalItems);
    setHasUnsavedChanges(hasChanged);
  }, [selectedItems, booking.bookingItems]);

  const handleAccommodationChange = (items: CreateBookingItem[]) => {
    setSelectedItems(items);
    setError('');
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      setError('Bitte wählen Sie mindestens eine Schlafmöglichkeit aus');
      return;
    }

    // Validate availability
    if (availability) {
      for (const item of selectedItems) {
        const accommodationAvailability = availability.accommodations.find(
          a => a.id === item.sleepingAccommodationId
        );
        
        if (!accommodationAvailability || 
            accommodationAvailability.availableCapacity < item.personCount) {
          const accommodationName = accommodations.find(a => a.id === item.sleepingAccommodationId)?.name || 'Unbekannt';
          setError(`Schlafplatz "${accommodationName}" hat nicht genügend Kapazität verfügbar`);
          return;
        }
      }
    }

    try {
      await onSave(selectedItems, reason.trim() || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Speichern der Änderungen';
      setError(errorMessage);
      showError(errorMessage, 'Speichern fehlgeschlagen');
    }
  };

  const getCurrentTotalPersons = () => {
    return booking.bookingItems.reduce((total, item) => total + item.personCount, 0);
  };

  const getNewTotalPersons = () => {
    return selectedItems.reduce((total, item) => total + item.personCount, 0);
  };

  const getCurrentAccommodationNames = () => {
    return booking.bookingItems.map(item => item.sleepingAccommodationName).join(', ');
  };

  const getNewAccommodationNames = () => {
    return selectedItems
      .map(item => {
        const accommodation = accommodations.find(a => a.id === item.sleepingAccommodationId);
        return accommodation?.name || 'Unbekannt';
      })
      .join(', ');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Schlafplätze bearbeiten
        </h3>
        {hasUnsavedChanges && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Nicht gespeichert
          </span>
        )}
      </div>

      {/* Current vs New comparison */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aktuelle Auswahl</h4>
            <div className="text-sm text-gray-600">
              <div className="font-medium">{getCurrentTotalPersons()} {getCurrentTotalPersons() === 1 ? 'Person' : 'Personen'}</div>
              <div className="text-xs text-gray-500 mt-1 break-words">{getCurrentAccommodationNames()}</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Neue Auswahl</h4>
            <div className="text-sm text-gray-900 font-medium">
              {selectedItems.length > 0 ? (
                <>
                  <div>{getNewTotalPersons()} {getNewTotalPersons() === 1 ? 'Person' : 'Personen'}</div>
                  <div className="text-xs text-gray-600 mt-1 break-words">{getNewAccommodationNames()}</div>
                </>
              ) : (
                <div className="text-gray-500">Keine Auswahl</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
          <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}

      {/* Accommodation Selector */}
      <div className="mb-6">
        {isCheckingAvailability ? (
          <div className="text-center py-8">
            <svg className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Verfügbarkeit wird geprüft...</p>
          </div>
        ) : (
          <AccommodationSelector
            accommodations={accommodations}
            availability={availability?.accommodations}
            selectedItems={selectedItems}
            onSelectionChange={handleAccommodationChange}
          />
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
          placeholder="Grund für die Änderung der Schlafplätze..."
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
          disabled={isLoading || !hasUnsavedChanges || selectedItems.length === 0 || isCheckingAvailability}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Schlafplätze ändern
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

export default AccommodationEditor;