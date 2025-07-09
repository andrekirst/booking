import { SleepingAccommodation, AccommodationType } from '@/lib/types/sleeping-accommodation';

interface SleepingAccommodationsTableProps {
  accommodations: SleepingAccommodation[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SleepingAccommodationsTable({
  accommodations,
  onEdit,
  onDelete,
}: SleepingAccommodationsTableProps) {
  const getAccommodationTypeText = (type: AccommodationType) => {
    return type === AccommodationType.Room ? 'Raum' : 'Zelt';
  };

  if (accommodations.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/20 border border-white/20 p-12 text-center">
        <p className="text-gray-600">Keine Schlafmöglichkeiten vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Typ
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Max. Kapazität
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {accommodations.map((accommodation) => (
            <tr key={accommodation.id} className={!accommodation.isActive ? 'opacity-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {accommodation.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getAccommodationTypeText(accommodation.type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {accommodation.maxCapacity} Personen
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    accommodation.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {accommodation.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => onEdit(accommodation.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                    aria-label={`${accommodation.name} bearbeiten`}
                    title={`${accommodation.name} bearbeiten`}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Bearbeiten</span>
                  </button>
                  {accommodation.isActive && (
                    <button
                      type="button"
                      onClick={() => onDelete(accommodation.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                      aria-label={`${accommodation.name} deaktivieren`}
                      title={`${accommodation.name} deaktivieren`}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Deaktivieren</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}