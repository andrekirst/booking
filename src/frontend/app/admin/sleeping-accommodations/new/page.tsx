'use client';

import { CreateSleepingAccommodationDto } from '@/lib/types/sleeping-accommodation';
import SleepingAccommodationForm from '@/app/components/admin/SleepingAccommodationForm';

export default function NewSleepingAccommodationPage() {
  const handleSubmit = async (data: CreateSleepingAccommodationDto) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sleeping-accommodations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Fehler beim Erstellen der Schlafmöglichkeit');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Neue Schlafmöglichkeit</h2>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-2xl">
        <SleepingAccommodationForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}