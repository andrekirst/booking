'use client';

import { Booking, BookingStatus } from '../../../lib/types/api';

interface BookingActionMenuProps {
  booking: Booking;
  onCancel: () => void;
  onEdit: () => void;
}

export default function BookingActionMenu({ booking, onCancel, onEdit }: BookingActionMenuProps) {
  const handleCancelClick = () => {
    if (confirm('Möchten Sie diese Buchung wirklich stornieren?')) {
      onCancel();
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
        {booking.status !== BookingStatus.Cancelled && (
          <button
            onClick={handleCancelClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stornieren
          </button>
        )}
        <button
          onClick={onEdit}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-md"
          disabled={booking.status === BookingStatus.Cancelled}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Bearbeiten
        </button>
      </div>
    </div>
  );
}