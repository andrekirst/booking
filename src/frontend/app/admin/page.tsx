'use client';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Schlafmöglichkeiten Card */}
        <div
          onClick={() => router.push('/admin/sleeping-accommodations')}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Schlafmöglichkeiten</h3>
          <p className="text-gray-600">Verwalten Sie Räume und Zelte für Übernachtungen.</p>
        </div>

        {/* Benutzer Card (placeholder for future) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Benutzer</h3>
          <p className="text-gray-600">Verwalten Sie Familienmitglieder und deren Berechtigungen.</p>
          <p className="text-sm text-gray-400 mt-2">Demnächst verfügbar</p>
        </div>

        {/* Buchungen Card (placeholder for future) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Buchungen</h3>
          <p className="text-gray-600">Überblick über alle Buchungen und Statistiken.</p>
          <p className="text-sm text-gray-400 mt-2">Demnächst verfügbar</p>
        </div>
      </div>
    </div>
  );
}