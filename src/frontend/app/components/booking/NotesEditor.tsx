'use client';

import { useState, useEffect } from 'react';
import { Booking } from '../../../lib/types/api';
import { useAlert } from '../../../hooks/useAlert';

interface NotesEditorProps {
  booking: Booking;
  onSave: (notes?: string, reason?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  booking,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { showError } = useAlert();
  
  const [notes, setNotes] = useState(booking.notes || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if notes have changed
  useEffect(() => {
    setHasUnsavedChanges(notes !== (booking.notes || ''));
  }, [notes, booking.notes]);

  const handleSave = async () => {
    try {
      const trimmedNotes = notes.trim();
      await onSave(trimmedNotes || undefined, reason.trim() || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Speichern der Änderungen';
      setError(errorMessage);
      showError(errorMessage, 'Speichern fehlgeschlagen');
    }
  };

  const getCharacterCount = () => notes.length;
  const getWordCount = () => notes.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notizen bearbeiten
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aktuelle Notizen</h4>
            <div className="text-sm text-gray-600">
              {booking.notes ? (
                <div className="max-h-20 overflow-y-auto p-2 bg-white rounded border text-xs whitespace-pre-wrap">
                  {booking.notes}
                </div>
              ) : (
                <div className="text-gray-500 italic">Keine Notizen</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Neue Notizen</h4>
            <div className="text-sm text-gray-900">
              {notes ? (
                <div className="max-h-20 overflow-y-auto p-2 bg-white rounded border text-xs whitespace-pre-wrap">
                  {notes}
                </div>
              ) : (
                <div className="text-gray-500 italic">Keine Notizen</div>
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

      {/* Notes editor */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notizen
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setError('');
          }}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
          placeholder="Besondere Wünsche, Anmerkungen oder wichtige Informationen zur Buchung..."
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {getWordCount()} {getWordCount() === 1 ? 'Wort' : 'Wörter'}
          </div>
          <div className="text-xs text-gray-500">
            {getCharacterCount()}/1000 Zeichen
          </div>
        </div>
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
          placeholder="Grund für die Änderung der Notizen..."
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
          disabled={isLoading || !hasUnsavedChanges}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Notizen speichern
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

export default NotesEditor;