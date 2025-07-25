'use client';

import { CreateSleepingAccommodationDto } from '@/lib/types/sleeping-accommodation';
import SleepingAccommodationForm from '@/app/components/admin/SleepingAccommodationForm';
import { useApi } from '@/contexts/ApiContext';

export default function NewSleepingAccommodationPage() {
  const { apiClient } = useApi();
  
  const handleSubmit = async (data: CreateSleepingAccommodationDto) => {
    await apiClient.createSleepingAccommodation(data);
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