'use client';

import { useState, useEffect } from 'react';
import { CreateBookingRequest, CreateBookingItem, SleepingAccommodation, BookingAvailability } from '../../../lib/types/api';
import { apiClient } from '../../../lib/api/client';
import DateRangePicker from './DateRangePicker';
import AccommodationSelector from './AccommodationSelector';

interface BookingFormProps {
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export default function BookingForm({
  onSuccess,
  onCancel,
  className = ''
}: BookingFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<CreateBookingItem[]>([]);
  const [accommodations, setAccommodations] = useState<SleepingAccommodation[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [errors, setErrors] = useState<{
    dates?: string;
    accommodations?: string;
    general?: string;
  }>({});

  // Load accommodations on component mount
  useEffect(() => {
    const loadAccommodations = async () => {
      try {
        const data = await apiClient.getSleepingAccommodations();
        setAccommodations(data);
      } catch (error) {
        console.error('Fehler beim Laden der Schlafmöglichkeiten:', error);
        setErrors(prev => ({ ...prev, general: 'Fehler beim Laden der Schlafmöglichkeiten' }));
      }
    };

    loadAccommodations();
  }, []);

  // Check availability when dates change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!startDate || !endDate) {
        setAvailability(null);
        return;
      }

      setIsCheckingAvailability(true);
      setErrors(prev => ({ ...prev, dates: undefined }));

      try {
        const availabilityData = await apiClient.checkAvailability(startDate, endDate);
        setAvailability(availabilityData);
      } catch (error) {
        console.error('Fehler beim Prüfen der Verfügbarkeit:', error);
        setErrors(prev => ({ ...prev, dates: 'Fehler beim Prüfen der Verfügbarkeit' }));
        setAvailability(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [startDate, endDate]);

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Clear selected accommodations when dates change
    if (selectedItems.length > 0) {
      setSelectedItems([]);
    }
  };

  const handleAccommodationChange = (items: CreateBookingItem[]) => {
    setSelectedItems(items);
    setErrors(prev => ({ ...prev, accommodations: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!startDate || !endDate) {
      newErrors.dates = 'Bitte wählen Sie An- und Abreisedatum';
    }

    if (selectedItems.length === 0) {
      newErrors.accommodations = 'Bitte wählen Sie mindestens eine Schlafmöglichkeit';
    }

    // Validate that selected accommodations have available capacity
    if (availability && selectedItems.length > 0) {
      for (const item of selectedItems) {
        const availabilityInfo = availability.accommodations.find(a => a.id === item.sleepingAccommodationId);
        if (availabilityInfo && item.personCount > availabilityInfo.availableCapacity) {
          newErrors.accommodations = `Nicht genügend Kapazität für ${availabilityInfo.name}`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, general: undefined }));

    try {
      const bookingRequest: CreateBookingRequest = {
        startDate,
        endDate,
        notes: notes.trim() || undefined,
        bookingItems: selectedItems
      };

      const createdBooking = await apiClient.createBooking(bookingRequest);
      
      if (onSuccess) {
        onSuccess(createdBooking.id);
      }
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Buchung:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || 'Fehler beim Erstellen der Buchung' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setNotes('');
    setSelectedItems([]);
    setAvailability(null);
    setErrors({});
  };

  const getTotalPersons = () => {
    return selectedItems.reduce((total, item) => total + item.personCount, 0);
  };

  const getNights = () => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Neue Buchung erstellen</h2>
        <p className="text-gray-600">Wählen Sie Ihre Reisedaten und Schlafmöglichkeiten</p>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-200">
          <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 font-medium">{errors.general}</span>
        </div>
      )}

      {/* Date Selection */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          error={errors.dates}
        />
      </div>

      {/* Availability Check Status */}
      {isCheckingAvailability && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-xl">
          <svg className="animate-spin w-5 h-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-700 font-medium">Verfügbarkeit wird geprüft...</span>
        </div>
      )}

      {/* Accommodation Selection */}
      {startDate && endDate && !isCheckingAvailability && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <AccommodationSelector
            accommodations={accommodations}
            availability={availability?.accommodations}
            selectedItems={selectedItems}
            onSelectionChange={handleAccommodationChange}
            error={errors.accommodations}
          />
        </div>
      )}

      {/* Notes */}
      {selectedItems.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-3">
            Notizen (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
            placeholder="Besondere Wünsche oder Anmerkungen..."
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Maximale Länge: 500 Zeichen</p>
            <p className="text-xs text-gray-500">{notes.length}/500</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Buchungsübersicht</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
              </svg>
              <span className="text-gray-700">
                <strong>{getNights()}</strong> {getNights() === 1 ? 'Nacht' : 'Nächte'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-700">
                <strong>{getTotalPersons()}</strong> {getTotalPersons() === 1 ? 'Person' : 'Personen'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-gray-700">
                <strong>{selectedItems.length}</strong> {selectedItems.length === 1 ? 'Unterkunft' : 'Unterkünfte'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          type="submit"
          disabled={isLoading || selectedItems.length === 0 || !startDate || !endDate}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Buchung wird erstellt...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Buchung erstellen
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Zurücksetzen
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}