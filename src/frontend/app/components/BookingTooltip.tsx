'use client';

import { Booking, BookingStatus } from '../../lib/types/api';

interface BookingTooltipProps {
  booking: Booking;
  position: { x: number; y: number };
  visible: boolean;
}

export default function BookingTooltip({ booking, position, visible }: BookingTooltipProps) {
  if (!visible) return null;

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return 'Ausstehend';
      case BookingStatus.Confirmed:
        return 'Bestätigt';
      case BookingStatus.Accepted:
        return 'Angenommen';
      case BookingStatus.Cancelled:
        return 'Storniert';
      case BookingStatus.Rejected:
        return 'Abgelehnt';
      case BookingStatus.Completed:
        return 'Abgeschlossen';
      default:
        return 'Unbekannt';
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.Confirmed:
      case BookingStatus.Accepted:
        return 'bg-emerald-100 text-emerald-800';
      case BookingStatus.Cancelled:
      case BookingStatus.Rejected:
        return 'bg-red-100 text-red-800';
      case BookingStatus.Completed:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
        pointerEvents: 'none',
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 text-sm">Buchungsdetails</h4>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </span>
        </div>

        {/* Date Range */}
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
            </svg>
            <span className="font-medium">Zeitraum</span>
          </div>
          <p className="text-sm text-gray-900 ml-6">
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center text-gray-600 mb-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Personen
            </div>
            <p className="font-medium text-gray-900">{booking.totalPersons}</p>
          </div>

          <div>
            <div className="flex items-center text-gray-600 mb-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Nächte
            </div>
            <p className="font-medium text-gray-900">{booking.numberOfNights}</p>
          </div>

          <div className="col-span-2">
            <div className="flex items-center text-gray-600 mb-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0V9a2 2 0 00-2-2H9a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2z" />
              </svg>
              Schlafmöglichkeiten
            </div>
            <p className="font-medium text-gray-900">
              {booking.bookingItems.length} {booking.bookingItems.length === 1 ? 'Raum' : 'Räume'}
            </p>
          </div>
        </div>

        {/* Click hint */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Klicken für Details
          </p>
        </div>

        {/* Tooltip arrow */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          <div className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 -top-px"></div>
        </div>
      </div>
    </div>
  );
}