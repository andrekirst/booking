import Link from 'next/link';
import DocumentationLayout from '@/components/docs/DocumentationLayout';

export default function HelpIndexPage() {
  return (
    <DocumentationLayout 
      title="Benutzerhandbuch"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Willkommen zum Benutzerhandbuch
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Umfassende Anleitung für das Garten-Buchungssystem für Familienmitglieder und Administratoren.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Schnellstart</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/help/erste-schritte#anmeldung" 
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-blue-900 mb-2">Anmeldung & Registrierung</h4>
              <p className="text-sm text-blue-700">Erste Schritte zur Nutzung der Plattform</p>
            </Link>
            
            <Link 
              href="/help/buchungen#erstellen" 
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-blue-900 mb-2">Erste Buchung</h4>
              <p className="text-sm text-blue-700">Schritt-für-Schritt Anleitung zur Buchung</p>
            </Link>
            
            <Link 
              href="/help/faq" 
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-blue-900 mb-2">Häufige Fragen</h4>
              <p className="text-sm text-blue-700">Antworten auf häufig gestellte Fragen</p>
            </Link>
          </div>
        </div>

        {/* Main Chapters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Inhaltsverzeichnis</h3>
          </div>
          <div className="divide-y divide-gray-200">
            
            {/* Chapter 1 */}
            <Link 
              href="/help/einleitung" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">1. Einleitung</h4>
                <p className="text-gray-600 text-sm">
                  Willkommen zur Buchungsplattform, Zielgruppe, Funktionsübersicht, Systemvoraussetzungen
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Chapter 2 */}
            <Link 
              href="/help/erste-schritte" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">2. Erste Schritte</h4>
                <p className="text-gray-600 text-sm">
                  Anmeldung und Registrierung, Benutzeroberfläche, erste Buchung erstellen
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Chapter 3 */}
            <Link 
              href="/help/buchungen" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">3. Buchungen verwalten</h4>
                <p className="text-gray-600 text-sm">
                  Neue Buchung erstellen, Buchungsübersicht, bearbeiten, stornieren, Details anzeigen
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Chapter 4 */}
            <Link 
              href="/help/raeume" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">4. Räume und Schlafplätze</h4>
                <p className="text-gray-600 text-sm">
                  Übersicht verfügbarer Räume, Raumdetails, Verfügbarkeit prüfen, Raumkombinationen
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Chapter 5 */}
            <Link 
              href="/help/administration" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">5. Administration</h4>
                <p className="text-gray-600 text-sm">
                  Nur für Administratoren: Benutzerverwaltung, Buchungsmanagement, Systemeinstellungen
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Chapter 6 */}
            <Link 
              href="/help/faq" 
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700">6. Fehlerbehebung und FAQ</h4>
                <p className="text-gray-600 text-sm">
                  Häufige Probleme und Lösungen, Browser-Kompatibilität, Performance-Probleme
                </p>
              </div>
              <svg className="ml-4 w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hilfe benötigt?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sofortige Hilfe</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Kontexthilfe: ?-Symbole in der Anwendung
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  FAQ: <Link href="/help/faq" className="text-blue-600 hover:text-blue-700 underline">Häufige Fragen</Link>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Fehlerbehebung: Probleme lösen
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Support kontaktieren</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  E-Mail: support@buchungsplattform.local
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Administrator: Für Freischaltungen
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Telefon: Bei kritischen Problemen
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}