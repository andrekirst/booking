'use client';

import { Booking, BookingStatus } from '../../lib/types/api';

interface CompactBookingListProps {
  bookings: Booking[];
  onSelectBooking: (bookingId: string) => void;
  selectedBookingId?: string | null;
}

export default function CompactBookingList({ 
  bookings, 
  onSelectBooking, 
  selectedBookingId 
}: CompactBookingListProps) {
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case BookingStatus.Confirmed:
      case BookingStatus.Accepted:
        return <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>;
      case BookingStatus.Cancelled:
      case BookingStatus.Rejected:
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case BookingStatus.Completed:
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  // Sort bookings by start date
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-fit max-h-[600px] xl:max-h-[600px] lg:max-h-[400px]">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Buchungen ({bookings.length})
        </h3>
      </div>
      
      <div className="overflow-y-auto flex-1 max-h-[calc(600px-60px)] xl:max-h-[calc(600px-60px)] lg:max-h-[calc(400px-60px)]">
        {sortedBookings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
            </svg>
            <p className="text-sm">Keine Buchungen vorhanden</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => onSelectBooking(booking.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedBookingId === booking.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusBadge(booking.status)}
                      <span className="text-xs font-medium text-gray-600">
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </p>
                    
                    <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {booking.totalPersons}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        {booking.numberOfNights}N
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v6H3zM3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l2.5-6M20.5 3L18 9" />
                          <circle cx="7.5" cy="13.5" r="1.5" fill="currentColor" />
                          <circle cx="16.5" cy="13.5" r="1.5" fill="currentColor" />
                        </svg>
                        {booking.bookingItems.length}
                      </span>
                    </div>
                  </div>
                  
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}