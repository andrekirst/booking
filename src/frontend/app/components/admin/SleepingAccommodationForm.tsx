'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccommodationType, CreateSleepingAccommodationDto, UpdateSleepingAccommodationDto, SleepingAccommodation } from '@/lib/types/sleeping-accommodation';

interface SleepingAccommodationFormProps {
  accommodation?: SleepingAccommodation;
  onSubmit: (data: CreateSleepingAccommodationDto | UpdateSleepingAccommodationDto) => Promise<void>;
  onToggleActive?: (id: string, isActive: boolean) => Promise<void>;
  isEdit?: boolean;
}

export default function SleepingAccommodationForm({ accommodation, onSubmit, onToggleActive, isEdit = false }: SleepingAccommodationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: accommodation?.name || '',
    type: accommodation?.type ?? AccommodationType.Room,
    maxCapacity: accommodation?.maxCapacity || 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = isEdit
        ? { ...formData, isActive: accommodation?.isActive ?? true }
        : { name: formData.name, type: formData.type, maxCapacity: formData.maxCapacity };
      
      await onSubmit(data);
      router.push('/admin/sleeping-accommodations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!accommodation?.id || !onToggleActive) return;

    try {
      await onToggleActive(accommodation.id, !accommodation.isActive);
      // The parent component will handle the state update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Ändern des Status');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          minLength={1}
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="z.B. Hauptschlafzimmer"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Typ
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        >
          <option value={AccommodationType.Room}>Raum</option>
          <option value={AccommodationType.Tent}>Zelt</option>
        </select>
      </div>

      <div>
        <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-2">
          Maximale Kapazität
        </label>
        <input
          type="number"
          id="maxCapacity"
          value={formData.maxCapacity}
          onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
          required
          min={1}
          max={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="Anzahl Personen"
        />
      </div>

      {isEdit && accommodation && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                accommodation.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {accommodation.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
            <button
              type="button"
              onClick={handleToggleActive}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                accommodation.isActive
                  ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:text-red-800 focus:ring-red-500'
                  : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-800 focus:ring-green-500'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {accommodation.isActive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6a2 2 0 012 2v4a2 2 0 01-2 2h-6a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                )}
              </svg>
              {accommodation.isActive ? 'Deaktivieren' : 'Aktivieren'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/admin/sleeping-accommodations')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}