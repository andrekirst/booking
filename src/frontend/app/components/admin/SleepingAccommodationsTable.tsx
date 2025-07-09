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
                <button
                  type="button"
                  onClick={() => onEdit(accommodation.id)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Bearbeiten
                </button>
                {accommodation.isActive && (
                  <button
                    type="button"
                    onClick={() => onDelete(accommodation.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Deaktivieren
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}