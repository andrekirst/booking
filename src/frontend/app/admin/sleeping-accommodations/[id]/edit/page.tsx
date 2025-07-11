'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SleepingAccommodation, UpdateSleepingAccommodationDto, CreateSleepingAccommodationDto } from '@/lib/types/sleeping-accommodation';
import SleepingAccommodationForm from '@/app/components/admin/SleepingAccommodationForm';
import { useApi } from '@/contexts/ApiContext';

export default function EditSleepingAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const api = useApi();
  const [accommodation, setAccommodation] = useState<SleepingAccommodation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accommodationId, setAccommodationId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setAccommodationId(id);
      fetchAccommodation(id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccommodation = async (id: string) => {
    try {
      const data = await api.getSleepingAccommodationById(id);
      setAccommodation(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
        router.push('/admin/sleeping-accommodations');
        return;
      }
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Ein unerwarteter Fehler ist aufgetreten';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateSleepingAccommodationDto | CreateSleepingAccommodationDto) => {
    if (!accommodationId) {
      throw new Error('Schlafmöglichkeit ID nicht gefunden');
    }

    await api.updateSleepingAccommodation(accommodationId, data);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!accommodation) return;
    
    await api.updateSleepingAccommodation(id, {
      name: accommodation.name,
      type: accommodation.type,
      maxCapacity: accommodation.maxCapacity,
      isActive: isActive,
    });

    // Update local state
    setAccommodation(prev => prev ? { ...prev, isActive } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Lade Schlafmöglichkeit...</span>
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-700">{error || 'Schlafmöglichkeit nicht gefunden'}</p>
      </div>
    );
  }

  const handleToggleActiveWrapper = async () => {
    if (!accommodation?.id) return;

    try {
      await handleToggleActive(accommodation.id, !accommodation.isActive);
    } catch {
      // Error handling is done in handleToggleActive
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Schlafmöglichkeit bearbeiten</h2>
        
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            accommodation.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {accommodation.isActive ? 'Aktiv' : 'Inaktiv'}
        </span>
      </div>

      {/* Menüband für Aktionen */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleToggleActiveWrapper}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
            accommodation.isActive
              ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-md'
              : 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-md'
          }`}
          aria-label={`${accommodation.name} ${accommodation.isActive ? 'deaktivieren' : 'aktivieren'}`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {accommodation.isActive ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6a2 2 0 012 2v4a2 2 0 01-2 2h-6a2 2 0 01-2-2v-4a2 2 0 012-2z" />
            )}
          </svg>
          {accommodation.isActive ? 'Deaktivieren' : 'Aktivieren'}
        </button>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-2xl">
        <SleepingAccommodationForm 
          accommodation={accommodation} 
          onSubmit={handleSubmit} 
          isEdit={true} 
        />
      </div>
    </div>
  );
}