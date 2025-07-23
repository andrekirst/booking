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

type TabId = 'management' | 'settings' | 'debugging';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'management',
    name: 'Verwaltung',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'settings',
    name: 'Einstellungen',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'debugging',
    name: 'Debugging',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('management');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    
    // Short delay to allow fade-out animation
    setTimeout(() => {
      setActiveTab(newTab);
      setSidebarOpen(false); // Close mobile menu after selection
      
      // Allow fade-in animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

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

  const renderManagementTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Datenverwaltung</h3>
        <p className="text-gray-600 mb-6">Verwalten Sie Benutzer und Schlafmöglichkeiten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schlafmöglichkeiten Card */}
        <div
          onClick={() => router.push('/admin/sleeping-accommodations')}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Schlafmöglichkeiten</h4>
          <p className="text-gray-600 text-sm">Verwalten Sie Räume und Zelte für Übernachtungen.</p>
        </div>

        {/* User Management Card */}
        <div
          onClick={() => router.push('/admin/users')}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Benutzer-Freigabe</h4>
          <p className="text-gray-600 text-sm">Neue Benutzer für Buchungen freigeben.</p>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Systemeinstellungen</h3>
        <p className="text-gray-600 mb-6">Konfigurieren Sie E-Mail-Server und Systemparameter</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Server Settings Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 opacity-60">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">E-Mail-Server</h4>
          <p className="text-gray-600 text-sm mb-3">SMTP-Konfiguration für E-Mail-Versand.</p>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Bald verfügbar
          </span>
        </div>

        {/* System Settings Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 opacity-60">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">System-Einstellungen</h4>
          <p className="text-gray-600 text-sm mb-3">Allgemeine Konfiguration der Anwendung.</p>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Bald verfügbar
          </span>
        </div>
      </div>
    </div>
  );

  const renderDebuggingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Debugging & Wartung</h3>
        <p className="text-gray-600 mb-6">Event Store Diagnose und Projections Management</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
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
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors"
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
          
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p><strong>Event Store Debug:</strong> Zeigt Event Store Status und Statistiken an</p>
              </div>
              <div>
                <p><strong>Projections Rebuild:</strong> Baut alle Booking Read-Models neu auf</p>
              </div>
            </div>
          </div>
          
          {rebuildMessage && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-mono text-blue-800">{rebuildMessage}</p>
              </div>
            </div>
          )}
          
          {debugInfo && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-3 flex items-center text-gray-900">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Event Store Status
              </h4>
              {debugInfo.error ? (
                <p className="text-red-600 font-mono text-sm">❌ {debugInfo.error}</p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-800">Total Events</div>
                      <div className="text-2xl font-bold text-blue-900">{debugInfo.totalEvents}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-green-800">Booking Events</div>
                      <div className="text-2xl font-bold text-green-900">{debugInfo.bookingEvents?.length || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="font-medium text-purple-800">Read Models</div>
                      <div className="text-2xl font-bold text-purple-900">{debugInfo.readModels}</div>
                    </div>
                  </div>
                  
                  {debugInfo.recentEvents && debugInfo.recentEvents.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2 text-gray-700">Recent Events:</h5>
                      <div className="bg-white p-3 rounded-lg border font-mono text-xs max-h-48 overflow-y-auto">
                        {debugInfo.recentEvents.map((event, index) => (
                          <div key={index} className="mb-1 text-gray-800">
                            <span className="text-blue-600 font-semibold">{event.eventType}</span> 
                            <span className="text-gray-500"> (v{event.version})</span> - 
                            <span className="text-purple-600">{event.aggregateId}</span> - 
                            <span className="text-gray-600">{new Date(event.timestamp).toLocaleString()}</span>
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
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return renderManagementTab();
      case 'settings':
        return renderSettingsTab();
      case 'debugging':
        return renderDebuggingTab();
      default:
        return renderManagementTab();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">Systemverwaltung</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <div className={`transition-all duration-300 ease-in-out ${
            isTransitioning 
              ? 'opacity-0 transform translate-x-4' 
              : 'opacity-100 transform translate-x-0'
          }`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}