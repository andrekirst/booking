'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SleepingAccommodation, UpdateSleepingAccommodationDto, CreateSleepingAccommodationDto } from '@/lib/types/sleeping-accommodation';
import SleepingAccommodationForm from '@/app/components/admin/SleepingAccommodationForm';

export default function EditSleepingAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
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
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sleeping-accommodations/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        router.push('/admin/sleeping-accommodations');
        return;
      }

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Schlafmöglichkeit');
      }

      const data = await response.json();
      setAccommodation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateSleepingAccommodationDto | CreateSleepingAccommodationDto) => {
    if (!accommodationId) {
      throw new Error('Schlafmöglichkeit ID nicht gefunden');
    }

    const token = localStorage.getItem('token');
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sleeping-accommodations/${accommodationId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Fehler beim Aktualisieren der Schlafmöglichkeit');
    }
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

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Schlafmöglichkeit bearbeiten</h2>
      
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