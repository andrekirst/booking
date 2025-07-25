import Link from 'next/link';
import DocumentationLayout from '@/components/docs/DocumentationLayout';

export default function HelpIndexPage() {
  return (
    <DocumentationLayout 
      title="Benutzerhandbuch"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <div className="border-l-4 border-gray-300 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Willkommen zum Benutzerhandbuch
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Umfassende Anleitung für das Garten-Buchungssystem für Familienmitglieder und Administratoren.
          </p>
        </div>

        {/* Quick Start */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Schnellstart</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              href="/help/erste-schritte#anmeldung" 
              className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-2">Anmeldung & Registrierung</h4>
              <p className="text-sm text-gray-600">Erste Schritte zur Nutzung der Plattform</p>
            </Link>
            
            <Link 
              href="/help/buchungen#erstellen" 
              className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-2">Erste Buchung</h4>
              <p className="text-sm text-gray-600">Schritt-für-Schritt Anleitung zur Buchung</p>
            </Link>
            
            <Link 
              href="/help/faq" 
              className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-2">Häufige Fragen</h4>
              <p className="text-sm text-gray-600">Antworten auf häufig gestellte Fragen</p>
            </Link>
          </div>
        </div>

        {/* Main Chapters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Inhaltsverzeichnis</h3>
          <div className="space-y-4">
            
            {/* Chapter 1 */}
            <Link 
              href="/help/einleitung" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">1. Einleitung</h4>
                <p className="text-gray-600 text-sm">
                  Willkommen zur Buchungsplattform, Zielgruppe, Funktionsübersicht, Systemvoraussetzungen
                </p>
              </div>
            </Link>

            {/* Chapter 2 */}
            <Link 
              href="/help/erste-schritte" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">2. Erste Schritte</h4>
                <p className="text-gray-600 text-sm">
                  Anmeldung und Registrierung, Benutzeroberfläche, erste Buchung erstellen
                </p>
              </div>
            </Link>

            {/* Chapter 3 */}
            <Link 
              href="/help/buchungen" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">3. Buchungen verwalten</h4>
                <p className="text-gray-600 text-sm">
                  Neue Buchung erstellen, Buchungsübersicht, bearbeiten, stornieren, Details anzeigen
                </p>
              </div>
            </Link>

            {/* Chapter 4 */}
            <Link 
              href="/help/raeume" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">4. Räume und Schlafplätze</h4>
                <p className="text-gray-600 text-sm">
                  Übersicht verfügbarer Räume, Raumdetails, Verfügbarkeit prüfen, Raumkombinationen
                </p>
              </div>
            </Link>

            {/* Chapter 5 */}
            <Link 
              href="/help/administration" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">5. Administration</h4>
                <p className="text-gray-600 text-sm">
                  Nur für Administratoren: Benutzerverwaltung, Buchungsmanagement, Systemeinstellungen
                </p>
              </div>
            </Link>

            {/* Chapter 6 */}
            <Link 
              href="/help/faq" 
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">6. Fehlerbehebung und FAQ</h4>
                <p className="text-gray-600 text-sm">
                  Häufige Probleme und Lösungen, Browser-Kompatibilität, Performance-Probleme
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hilfe benötigt?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sofortige Hilfe</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Kontexthilfe: ?-Symbole in der Anwendung</li>
                <li>FAQ: <Link href="/help/faq" className="underline hover:text-gray-900">Häufige Fragen</Link></li>
                <li>Fehlerbehebung: Probleme lösen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Support kontaktieren</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>E-Mail: support@buchungsplattform.local</li>
                <li>Administrator: Für Freischaltungen</li>
                <li>Telefon: Bei kritischen Problemen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}