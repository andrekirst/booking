'use client';

import { BookingStatus } from '../../lib/types/api';

interface BookingStatusFilterProps {
  currentStatus: BookingStatus | null;
  onStatusChange: (status: BookingStatus | null) => void;
}

const statusOptions = [
  { value: null, label: 'Alle Buchungen', count: 0 },
  { value: BookingStatus.Pending, label: 'Ausstehend', count: 0 },
  { value: BookingStatus.Accepted, label: 'Angenommen', count: 0 },
  { value: BookingStatus.Rejected, label: 'Abgelehnt', count: 0 },
  { value: BookingStatus.Confirmed, label: 'Bestätigt', count: 0 },
  { value: BookingStatus.Cancelled, label: 'Storniert', count: 0 },
  { value: BookingStatus.Completed, label: 'Abgeschlossen', count: 0 },
];

export default function BookingStatusFilter({ currentStatus, onStatusChange }: BookingStatusFilterProps) {
  const getStatusIcon = (status: BookingStatus | null) => {
    switch (status) {
      case null:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      case BookingStatus.Pending:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case BookingStatus.Accepted:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case BookingStatus.Rejected:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case BookingStatus.Confirmed:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case BookingStatus.Cancelled:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case BookingStatus.Completed:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: BookingStatus | null) => {
    switch (status) {
      case null:
        return 'text-gray-600 bg-gray-100 hover:bg-gray-200';
      case BookingStatus.Pending:
        return 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200';
      case BookingStatus.Accepted:
        return 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200';
      case BookingStatus.Rejected:
        return 'text-rose-700 bg-rose-100 hover:bg-rose-200';
      case BookingStatus.Confirmed:
        return 'text-green-700 bg-green-100 hover:bg-green-200';
      case BookingStatus.Cancelled:
        return 'text-red-700 bg-red-100 hover:bg-red-200';
      case BookingStatus.Completed:
        return 'text-blue-700 bg-blue-100 hover:bg-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 hover:bg-gray-200';
    }
  };

  const isSelected = (status: BookingStatus | null) => {
    return currentStatus === status;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-medium text-gray-900">Nach Status filtern</h3>
        <button
          onClick={() => onStatusChange(null)}
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
            currentStatus !== null 
              ? 'text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900' 
              : 'text-transparent bg-transparent pointer-events-none'
          }`}
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Filter zurücksetzen
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value ?? 'all'}
            onClick={() => onStatusChange(option.value)}
            className={`
              inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${isSelected(option.value) 
                ? `${getStatusColor(option.value)} ring-2 ring-offset-1 ring-current shadow-md` 
                : `${getStatusColor(option.value)} opacity-70 hover:opacity-100`
              }
            `}
          >
            {getStatusIcon(option.value)}
            <span className="ml-2">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}