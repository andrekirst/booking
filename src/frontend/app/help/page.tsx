'use client';

import Link from 'next/link';
import DocumentationLayout from '@/components/docs/DocumentationLayout';

export default function HelpIndexPage() {
  return (
    <DocumentationLayout 
      title="Benutzerhandbuch - Buchungsplattform"
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            🚀 Willkommen zum Benutzerhandbuch
          </h2>
          <p className="text-blue-800">
            Umfassende Anleitung für das Garten-Buchungssystem für Familienmitglieder und Administratoren.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">🚀 Schnellstart</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/help/erste-schritte#anmeldung" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-200"
            >
              <div className="text-green-600 text-xl mb-2">🔐</div>
              <h4 className="font-medium text-green-900">Anmeldung & Registrierung</h4>
              <p className="text-sm text-green-700 mt-1">Erste Schritte zur Nutzung</p>
            </Link>
            
            <Link 
              href="/help/buchungen#erstellen" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-200"
            >
              <div className="text-green-600 text-xl mb-2">📅</div>
              <h4 className="font-medium text-green-900">Erste Buchung</h4>
              <p className="text-sm text-green-700 mt-1">Schritt-für-Schritt Anleitung</p>
            </Link>
            
            <Link 
              href="/help/faq" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-200"
            >
              <div className="text-green-600 text-xl mb-2">❓</div>
              <h4 className="font-medium text-green-900">Häufige Fragen</h4>
              <p className="text-sm text-green-700 mt-1">Antworten auf FAQ</p>
            </Link>
          </div>
        </div>

        {/* Main Chapters */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📋 Inhaltsverzeichnis</h3>
          <div className="grid gap-4">
            
            {/* Chapter 1 */}
            <Link 
              href="/help/einleitung" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">🏠</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">1. Einleitung</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Willkommen zur Buchungsplattform, Zielgruppe, Funktionsübersicht, Systemvoraussetzungen
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Übersicht</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Erste Schritte</span>
                </div>
              </div>
            </Link>

            {/* Chapter 2 */}
            <Link 
              href="/help/erste-schritte" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">🚀</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">2. Erste Schritte</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Anmeldung und Registrierung, Benutzeroberfläche, erste Buchung erstellen
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Registrierung</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Anmeldung</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">UI-Übersicht</span>
                </div>
              </div>
            </Link>

            {/* Chapter 3 */}
            <Link 
              href="/help/buchungen" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">📅</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">3. Buchungen verwalten</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Neue Buchung erstellen, Buchungsübersicht, bearbeiten, stornieren, Details anzeigen
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Kalender</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Buchung erstellen</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Verwaltung</span>
                </div>
              </div>
            </Link>

            {/* Chapter 4 */}
            <Link 
              href="/help/raeume" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">🏨</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">4. Räume und Schlafplätze</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Übersicht verfügbarer Räume, Raumdetails, Verfügbarkeit prüfen, Raumkombinationen
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Räume</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Verfügbarkeit</span>
                </div>
              </div>
            </Link>

            {/* Chapter 5 */}
            <Link 
              href="/help/administration" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">⚙️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">5. Administration</h4>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="text-red-600 font-medium">Nur für Administratoren:</span> Benutzerverwaltung, Buchungsmanagement, Systemeinstellungen
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Benutzer</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">System</span>
                </div>
              </div>
            </Link>

            {/* Chapter 6 */}
            <Link 
              href="/help/faq" 
              className="flex items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="text-2xl mr-4">🆘</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">6. Fehlerbehebung und FAQ</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Häufige Probleme und Lösungen, Browser-Kompatibilität, Performance-Probleme
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Hilfe</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Probleme</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">FAQ</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Usage */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Mobile Nutzung</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-sm font-medium">Smartphone-freundlich</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-sm font-medium">Tablet-optimiert</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-sm font-medium">Touch-Navigation</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-sm font-medium">Offline-Cache</span>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📞 Hilfe benötigt?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">🆘 Sofortige Hilfe</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <strong>Kontexthilfe:</strong> ?-Symbole in der Anwendung</li>
                <li>• <strong>FAQ:</strong> <Link href="/help/faq" className="underline">Häufige Fragen</Link></li>
                <li>• <strong>Fehlerbehebung:</strong> Probleme lösen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📧 Support kontaktieren</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <strong>E-Mail:</strong> support@buchungsplattform.local</li>
                <li>• <strong>Administrator:</strong> Für Freischaltungen</li>
                <li>• <strong>Telefon:</strong> Bei kritischen Problemen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}