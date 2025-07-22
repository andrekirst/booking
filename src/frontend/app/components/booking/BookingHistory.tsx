'use client';

interface BookingHistoryProps {
  createdAt: string;
  changedAt?: string;
}

export default function BookingHistory({ createdAt, changedAt }: BookingHistoryProps) {
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Zeitstempel</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Erstellt</label>
          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-gray-900 text-sm font-medium">{formatDateShort(createdAt)}</span>
          </div>
        </div>
        {changedAt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geändert</label>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
              <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-gray-900 text-sm font-medium">{formatDateShort(changedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}