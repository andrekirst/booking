'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api/client';

interface DebugEvent {
  eventType: string;
  version: number;
  aggregateId: string;
  timestamp: string;
}

interface DebugInfo {
  totalEvents?: number;
  readModels?: number;
  recentEvents?: DebugEvent[];
  bookingEvents?: DebugEvent[];
  error?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const handleDebugEvents = async () => {
    setIsLoadingDebug(true);
    try {
      const result = await apiClient.debugBookingEvents();
      setDebugInfo(result as unknown as DebugInfo);
    } catch (error) {
      console.error('Failed to load debug info:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unbekannter Fehler' });
    } finally {
      setIsLoadingDebug(false);
    }
  };

  const handleRebuildProjections = async () => {
    setIsRebuilding(true);
    setRebuildMessage(null);
    
    try {
      const result = await apiClient.rebuildBookingProjections();
      setRebuildMessage(`✅ ${result.message}`);
      // Refresh debug info after rebuild
      if (debugInfo) {
        await handleDebugEvents();
      }
    } catch (error) {
      console.error('Failed to rebuild projections:', error);
      setRebuildMessage(`❌ Fehler beim Neu-Aufbau der Projections: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>
      
      {/* Debug/Admin Actions */}
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Debug Actions</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleDebugEvents}
              disabled={isLoadingDebug}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoadingDebug ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Lade Debug-Info...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Event Store Debug
                </>
              )}
            </button>

            <button
              onClick={handleRebuildProjections}
              disabled={isRebuilding}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isRebuilding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Projections werden neu aufgebaut...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Projections neu aufbauen
                </>
              )}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Debug:</strong> Zeigt Event Store Status an</p>
            <p><strong>Rebuild:</strong> Baut alle Booking Read-Models neu auf</p>
          </div>
          
          {rebuildMessage && (
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-sm font-mono">{rebuildMessage}</p>
            </div>
          )}
          
          {debugInfo && (
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-2">📊 Event Store Status:</h4>
              {debugInfo.error ? (
                <p className="text-red-600 font-mono text-sm">❌ {debugInfo.error}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="font-medium text-blue-800">Total Events</div>
                      <div className="text-2xl font-bold text-blue-900">{debugInfo.totalEvents}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="font-medium text-green-800">Booking Events</div>
                      <div className="text-2xl font-bold text-green-900">{debugInfo.bookingEvents?.length || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="font-medium text-purple-800">Read Models</div>
                      <div className="text-2xl font-bold text-purple-900">{debugInfo.readModels}</div>
                    </div>
                  </div>
                  
                  {debugInfo.recentEvents && debugInfo.recentEvents.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Recent Events:</h5>
                      <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                        {debugInfo.recentEvents.map((event, index) => (
                          <div key={index} className="mb-1">
                            {event.eventType} (v{event.version}) - {event.aggregateId} - {new Date(event.timestamp).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

        {/* User Management Card */}
        <div
          onClick={() => router.push('/admin/users')}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Benutzer-Freigabe</h3>
          <p className="text-gray-600">Neue Benutzer für Buchungen freigeben.</p>
        </div>
      </div>
    </div>
  );
}