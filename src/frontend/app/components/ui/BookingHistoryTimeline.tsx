'use client';

import { BookingHistoryEntry, BookingHistoryEventType, BookingStatus } from '../../../lib/types/api';

interface BookingHistoryTimelineProps {
  history: BookingHistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
}

export default function BookingHistoryTimeline({ 
  history, 
  isLoading = false, 
  error = null 
}: BookingHistoryTimelineProps) {
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Historie wird geladen">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-8 bg-gray-50 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 text-center"
        role="alert"
        aria-live="polite"
      >
        <svg 
          className="w-12 h-12 text-red-400 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fehler beim Laden der Historie</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          aria-label="Historie neu laden"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Neu laden
        </button>
      </div>
    );
  }

  // Empty state
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg 
          className="w-12 h-12 text-gray-400 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Historie verfügbar</h3>
        <p className="text-gray-600">
          Für diese Buchung wurden noch keine Änderungen aufgezeichnet.
        </p>
      </div>
    );
  }

  const getEventIcon = (eventType: BookingHistoryEventType) => {
    switch (eventType) {
      case BookingHistoryEventType.Created:
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case BookingHistoryEventType.StatusChanged:
      case BookingHistoryEventType.Confirmed:
      case BookingHistoryEventType.Accepted:
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case BookingHistoryEventType.Cancelled:
      case BookingHistoryEventType.Rejected:
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case BookingHistoryEventType.Updated:
      case BookingHistoryEventType.NotesUpdated:
      case BookingHistoryEventType.AccommodationsChanged:
      case BookingHistoryEventType.DatesChanged:
        return (
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusDisplayName = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending: return 'Ausstehend';
      case BookingStatus.Confirmed: return 'Bestätigt';
      case BookingStatus.Cancelled: return 'Storniert';
      case BookingStatus.Completed: return 'Abgeschlossen';
      case BookingStatus.Accepted: return 'Angenommen';
      case BookingStatus.Rejected: return 'Abgelehnt';
      default: return 'Unbekannt';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Gerade eben' : `vor ${diffMinutes} Minute${diffMinutes === 1 ? '' : 'n'}`;
    } else if (diffHours < 24) {
      return `vor ${diffHours} Stunde${diffHours === 1 ? '' : 'n'}`;
    } else if (diffDays < 7) {
      return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderEventDetails = (entry: BookingHistoryEntry) => {
    if (!entry.details) return null;

    // Status change details
    if (entry.eventType === BookingHistoryEventType.StatusChanged && entry.previousValue !== undefined && entry.newValue !== undefined) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Von:</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                {getStatusDisplayName(entry.previousValue as BookingStatus)}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Zu:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {getStatusDisplayName(entry.newValue as BookingStatus)}
              </span>
            </div>
          </div>
          {typeof entry.details.reason === 'string' && entry.details.reason && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Grund:</span> {entry.details.reason}
            </div>
          )}
        </div>
      );
    }

    // Creation details
    if (entry.eventType === BookingHistoryEventType.Created) {
      return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {typeof entry.details.startDate === 'string' && typeof entry.details.endDate === 'string' && (
              <div>
                <span className="font-medium text-blue-900">Zeitraum:</span>
                <div className="text-blue-700">
                  {new Date(entry.details.startDate).toLocaleDateString('de-DE')} - {new Date(entry.details.endDate).toLocaleDateString('de-DE')}
                </div>
              </div>
            )}
            {typeof entry.details.totalPersons === 'number' && (
              <div>
                <span className="font-medium text-blue-900">Personen:</span>
                <div className="text-blue-700">{entry.details.totalPersons}</div>
              </div>
            )}
            {Array.isArray(entry.details.accommodations) && (
              <div className="sm:col-span-2">
                <span className="font-medium text-blue-900">Schlafplätze:</span>
                <div className="text-blue-700">{entry.details.accommodations.join(', ')}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Notes update details
    if (entry.eventType === BookingHistoryEventType.NotesUpdated) {
      return (
        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <span className="font-medium text-orange-900">Neue Notiz:</span>
          {typeof entry.details.notes === 'string' && entry.details.notes && (
            <div className="mt-1 text-orange-700 italic">"{entry.details.notes}"</div>
          )}
        </div>
      );
    }

    // Generic details for other events
    if (typeof entry.details.reason === 'string' && entry.details.reason) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="font-medium text-gray-900">Details:</span>
          <div className="mt-1 text-gray-700">{entry.details.reason}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className="space-y-8"
      role="feed" 
      aria-label="Buchungshistorie"
      aria-live="polite"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Änderungsverlauf</h2>
        <p className="text-gray-600 text-sm">
          Chronologische Auflistung aller Änderungen an dieser Buchung.
        </p>
      </div>

      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {history.map((entry, entryIdx) => (
            <li key={entry.id}>
              <div className="relative pb-8">
                {entryIdx !== history.length - 1 ? (
                  <span 
                    className="absolute top-10 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true" 
                  />
                ) : null}
                
                <div className="relative flex items-start space-x-4">
                  {/* Event Icon */}
                  <div 
                    className="flex-shrink-0"
                    role="img"
                    aria-label={`${entry.eventType} Event`}
                  >
                    {getEventIcon(entry.eventType)}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 mb-1">
                          {entry.description}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-500 text-xs">
                          <div className="flex items-center space-x-2">
                            <span>{entry.user.name}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-gray-400">{entry.user.email}</span>
                          </div>
                          <div 
                            className="mt-1 sm:mt-0"
                            title={new Date(entry.timestamp).toLocaleString('de-DE')}
                          >
                            {formatTimestamp(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    {renderEventDetails(entry)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}