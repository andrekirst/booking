'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccommodationType, CreateSleepingAccommodationDto, UpdateSleepingAccommodationDto, SleepingAccommodation } from '@/lib/types/sleeping-accommodation';

interface SleepingAccommodationFormProps {
  accommodation?: SleepingAccommodation;
  onSubmit: (data: CreateSleepingAccommodationDto | UpdateSleepingAccommodationDto) => Promise<void>;
  isEdit?: boolean;
}

export default function SleepingAccommodationForm({ accommodation, onSubmit, isEdit = false }: SleepingAccommodationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: accommodation?.name || '',
    type: accommodation?.type ?? AccommodationType.Room,
    maxCapacity: accommodation?.maxCapacity || 1,
    isActive: accommodation?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = isEdit
        ? { ...formData, isActive: formData.isActive }
        : { name: formData.name, type: formData.type, maxCapacity: formData.maxCapacity };
      
      await onSubmit(data);
      router.push('/admin/sleeping-accommodations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setIsSubmitting(false);
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

      {isEdit && (
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Aktiv</span>
          </label>
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