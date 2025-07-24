'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SleepingAccommodation } from '@/lib/types/sleeping-accommodation';
import SleepingAccommodationsTable from '@/app/components/admin/SleepingAccommodationsTable';
import { useApi } from '@/contexts/ApiContext';

export default function SleepingAccommodationsPage() {
  const router = useRouter();
  const { apiClient } = useApi();
  const [accommodations, setAccommodations] = useState<SleepingAccommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    fetchAccommodations();
  }, [includeInactive]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccommodations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSleepingAccommodations(includeInactive);
      setAccommodations(data);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 403) {
        router.push('/bookings');
        return;
      }
      setError(error instanceof Error ? error.message : 'Fehler beim Laden der Schlafplätze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/sleeping-accommodations/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Schlafmöglichkeit wirklich deaktivieren?')) {
      return;
    }

    try {
      await apiClient.deleteSleepingAccommodation(id);
      fetchAccommodations();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Fehler beim Deaktivieren der Schlafmöglichkeit');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Lade Schlafmöglichkeiten...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Schlafmöglichkeiten</h2>
        <button
          type="button"
          onClick={() => router.push('/admin/sleeping-accommodations/new')}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-xl shadow-md shadow-green-500/25 hover:shadow-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Schlafmöglichkeit
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700">Inaktive anzeigen</span>
        </label>
      </div>

      <SleepingAccommodationsTable
        accommodations={accommodations}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}