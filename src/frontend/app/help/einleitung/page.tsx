'use client';

import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function EinleitungPage() {
  return (
    <DocumentationLayout
      title="🏠 Einleitung"
      breadcrumbs={[{ title: 'Einleitung' }]}
      nextPage={{ title: 'Erste Schritte', href: '/help/erste-schritte' }}
    >
      <div className="space-y-8">
        {/* Willkommen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🎉 Willkommen zur Buchungsplattform
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400 mb-6">
            <p className="text-blue-800 text-lg leading-relaxed">
              Die Buchungsplattform ermöglicht es Familienmitgliedern, Übernachtungen im gemeinsamen Garten zu buchen. 
              Das System funktioniert wie ein Hotel-Buchungssystem für ein einzelnes Haus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-3xl mb-3">🏨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Wie ein Hotel</h3>
              <p className="text-gray-600 text-sm">Professionelle Buchungsverwaltung für den Familiengarten</p>
            </div>
            
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-3xl mb-3">👨‍👩‍👧‍👦</div>
              <h3 className="font-semibold text-gray-900 mb-2">Für Familien</h3>
              <p className="text-gray-600 text-sm">Speziell entwickelt für Familienmitglieder und deren Bedürfnisse</p>
            </div>
            
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">Sicher & Privat</h3>
              <p className="text-gray-600 text-sm">Geschlossener Kreis mit Administrator-Freigabe</p>
            </div>
          </div>
        </section>

        {/* Zielgruppe */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            👥 Zielgruppe
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                👑 Administrator
              </h3>
              <ul className="text-green-800 space-y-2 text-sm">
                <li>• <strong>Berechtigt Familienmitglieder</strong> zum Buchen</li>
                <li>• <strong>Verwaltet Räume</strong> und Schlafplätze</li>
                <li>• <strong>Konfiguriert Schlafmöglichkeiten</strong> (Zelt, etc.)</li>
                <li>• <strong>Genehmigt Buchungen</strong> und überwacht System</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                👨‍👩‍👧‍👦 Familienmitglied
              </h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• <strong>Kann eine oder mehrere Nächte</strong> buchen</li>
                <li>• <strong>Wählt Räume und Personenanzahl</strong> aus</li>
                <li>• <strong>Passt bestehende Buchungen an</strong></li>
                <li>• <strong>Storniert Buchungen</strong> bei Bedarf</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Funktionsübersicht */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ⚡ Funktionsübersicht
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buchungsfunktionen */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                📅 Buchungsfunktionen
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Buchung von ein oder mehreren Nächten</li>
                <li>• Datumsbereich-Auswahl</li>
                <li>• Raum- und Personenauswahl</li>
                <li>• Buchungsanpassung</li>
                <li>• Stornierungsmöglichkeit</li>
              </ul>
            </div>

            {/* Benutzerregistrierung */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                🔐 Benutzerregistrierung
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• E-Mail oder Google-Account</li>
                <li>• E-Mail-Verifizierung</li>
                <li>• Administrator-Freigabe</li>
                <li>• Sichere Anmeldung</li>
                <li>• Passwort-Zurücksetzen</li>
              </ul>
            </div>

            {/* Verwaltung */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                ⚙️ Verwaltung
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Raumkonfiguration</li>
                <li>• Kapazitätsverwaltung</li>
                <li>• Benutzerverwaltung</li>
                <li>• Buchungsübersicht</li>
                <li>• System-Einstellungen</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Systemvoraussetzungen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            💻 Systemvoraussetzungen
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🖥️ Desktop/Laptop</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Unterstützte Browser:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Chrome (ab Version 90)</li>
                    <li>• Firefox (ab Version 88)</li>
                    <li>• Safari (ab Version 14)</li>
                    <li>• Edge (ab Version 90)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Empfohlene Auflösung:</h4>
                  <p className="text-gray-700 text-sm">1024x768 oder höher</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📱 Mobile Geräte</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Unterstützte Browser:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• iOS Safari (ab iOS 14)</li>
                    <li>• Android Chrome (ab Android 8.0)</li>
                    <li>• Samsung Internet</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Features:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Touch-optimierte Bedienung</li>
                    <li>• Responsive Design</li>
                    <li>• Offline-Funktionen</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400 mt-6">
            <p className="text-red-800 text-sm">
              <strong>⚠️ Nicht unterstützt:</strong> Internet Explorer wird nicht unterstützt. 
              Bitte verwenden Sie einen modernen Browser für die beste Erfahrung.
            </p>
          </div>
        </section>

        {/* Sicherheit und Datenschutz */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🔒 Sicherheit und Datenschutz
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-blue-800 mb-4">
              Die Buchungsplattform wurde mit höchsten Sicherheitsstandards entwickelt, 
              da sie auf einem Raspberry Pi hinter einer Fritzbox betrieben wird.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                🛡️ Sicherheitsfeatures
              </h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Verschlüsselte Verbindungen:</strong> HTTPS für alle Datenübertragungen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Sichere Passwörter:</strong> Starke Passwort-Anforderungen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>E-Mail-Verifizierung:</strong> Bestätigung der E-Mail-Adresse</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Administrator-Kontrolle:</strong> Manuelle Freigabe neuer Benutzer</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                🔐 Datenschutz
              </h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">📊</span>
                  <span><strong>Minimale Datensammlung:</strong> Nur notwendige Informationen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🏠</span>
                  <span><strong>Lokale Speicherung:</strong> Alle Daten bleiben im Familiennetzwerk</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">👨‍👩‍👧‍👦</span>
                  <span><strong>Geschlossener Kreis:</strong> Nur Familienmitglieder haben Zugang</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🗑️</span>
                  <span><strong>Datenlöschung:</strong> Benutzer können ihre Daten löschen lassen</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-green-900 mb-3">🚀 Bereit loszulegen?</h3>
          <p className="text-green-800 mb-4">
            Jetzt da Sie wissen, was die Buchungsplattform kann, können Sie mit den ersten Schritten beginnen.
          </p>
          <Link 
            href="/help/erste-schritte" 
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <span className="mr-2">🚀</span>
            Erste Schritte starten
          </Link>
        </div>
      </div>
    </DocumentationLayout>
  );
}