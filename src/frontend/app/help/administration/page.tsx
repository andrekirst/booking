'use client';

import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function AdministrationPage() {
  return (
    <DocumentationLayout
      title="⚙️ Administration"
      breadcrumbs={[{ title: 'Administration' }]}
      prevPage={{ title: 'Räume und Schlafplätze', href: '/help/raeume' }}
      nextPage={{ title: 'FAQ', href: '/help/faq' }}
    >
      <div className="space-y-8">
        {/* Warning */}
        <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-400">
          <h2 className="text-xl font-semibold text-red-900 mb-2 flex items-center">
            ⚠️ Nur für Administratoren
          </h2>
          <p className="text-red-800">
            Normale Benutzer haben keinen Zugang zu diesen Funktionen. Diese Dokumentation richtet sich ausschließlich an Administratoren der Buchungsplattform.
          </p>
        </div>

        {/* Admin-Bereich */}
        <section id="dashboard">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🛠️ Administrator-Bereich
          </h2>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">🔐 Zugang zum Admin-Panel</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Administrator-Rolle:</strong> Erforderlich für Zugang</li>
              <li>• <strong>Vollständig verifiziertes Konto:</strong> E-Mail bestätigt</li>
              <li>• <strong>Aktive Session:</strong> Angemeldet sein</li>
              <li>• <strong>Admin-Button:</strong> In der Navigation verfügbar</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                📊 Allgemein
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• System-Übersicht</li>
                <li>• Statistiken</li>
                <li>• Dashboard-Ansicht</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                📋 Verwaltung
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Benutzerverwaltung</li>
                <li>• Buchungsmanagement</li>
                <li>• Raumverwaltung</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                ⚙️ System
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• E-Mail-Konfiguration</li>
                <li>• Backup-Verwaltung</li>
                <li>• Erweiterte Optionen</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benutzerverwaltung */}
        <section id="benutzerverwaltung">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            👥 Benutzerverwaltung
          </h2>

          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">📋 Benutzerübersicht</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">👤 Name</th>
                    <th className="px-4 py-2 text-left">📧 E-Mail</th>
                    <th className="px-4 py-2 text-left">🏷️ Rolle</th>
                    <th className="px-4 py-2 text-left">📊 Status</th>
                    <th className="px-4 py-2 text-left">⚡ Aktionen</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-t">
                    <td className="px-4 py-2">Max Mustermann</td>
                    <td className="px-4 py-2">max@example.com ✅</td>
                    <td className="px-4 py-2">Member</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Aktiv</span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs">Bearbeiten</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Benutzer freischalten */}
          <div id="freischaltung" className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-semibold text-orange-900 mb-4">🆕 Neue Benutzer freischalten</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-orange-900 mb-3">📋 Genehmigungsprozess:</h4>
                <ol className="text-orange-800 text-sm space-y-2">
                  <li>1. <strong>🔔 Benachrichtigung:</strong> Badge zeigt ausstehende Genehmigungen</li>
                  <li>2. <strong>👀 Prüfung:</strong> E-Mail-Verifizierung und Daten prüfen</li>
                  <li>3. <strong>✅ Genehmigung:</strong> Benutzer wird aktiviert</li>
                  <li>4. <strong>📧 Benachrichtigung:</strong> Automatische E-Mail an Benutzer</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-orange-900 mb-3">❌ Ablehnung:</h4>
                <ul className="text-orange-800 text-sm space-y-1">
                  <li>• Optional: Begründung eingeben</li>
                  <li>• Benutzer erhält Ablehnungs-E-Mail</li>
                  <li>• Konto wird deaktiviert</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* E-Mail-Konfiguration */}
        <section id="email-konfiguration">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📧 E-Mail-Konfiguration
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">⚙️ SMTP-Einstellungen</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP-Server:</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" placeholder="smtp.example.com" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port:</label>
                  <input type="number" className="w-full border rounded px-3 py-2 text-sm" placeholder="587" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername:</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" placeholder="user@example.com" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verschlüsselung:</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" disabled>
                    <option>TLS</option>
                    <option>SSL</option>
                  </select>
                </div>
              </div>
            </div>

            <div id="smtp-konfiguration" className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📋 E-Mail-Templates</h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li>• <strong>Registrierungsbestätigung:</strong> Nach E-Mail-Verifizierung</li>
                <li>• <strong>Konto-Freischaltung:</strong> Bei Administrator-Genehmigung</li>
                <li>• <strong>Buchungsbestätigung:</strong> Nach erfolgreicher Buchung</li>
                <li>• <strong>Buchungsänderung:</strong> Bei Anpassungen</li>
                <li>• <strong>Stornierung:</strong> Bei Buchungsabsage</li>
              </ul>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-blue-800 text-xs">
                  <strong>💡 Tipp:</strong> E-Mail-Templates können angepasst werden, um den Familiencharakter zu reflektieren.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Buchungsmanagement */}
        <section id="buchungsmanagement">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📊 Buchungsmanagement
          </h2>

          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">📋 Alle Buchungen verwalten</h3>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-yellow-800">Ausstehend</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-green-800">Bestätigt</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">2</div>
                <div className="text-sm text-gray-800">Storniert</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">1</div>
                <div className="text-sm text-red-800">Abgelehnt</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">✅ Buchungen genehmigen</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li>• <strong>Verfügbarkeit prüfen:</strong> Raum-Kollisionen vermeiden</li>
                <li>• <strong>Plausibilität:</strong> Personenanzahl und Kapazität</li>
                <li>• <strong>Familienkontext:</strong> Anlass und Angemessenheit</li>
                <li>• <strong>Genehmigung:</strong> Bestätigung mit automatischer E-Mail</li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-4">❌ Buchungen ablehnen</h3>
              <ul className="text-red-800 text-sm space-y-2">
                <li>• <strong>Begründung:</strong> Ablehnungsgrund angeben</li>
                <li>• <strong>Alternative vorschlagen:</strong> Andere Termine</li>
                <li>• <strong>Kommunikation:</strong> Persönliche Nachricht möglich</li>
                <li>• <strong>Dokumentation:</strong> Grund wird gespeichert</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Systemeinstellungen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ⚙️ System-Einstellungen
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🔧 Allgemeine Einstellungen</h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li>• <strong>Buchungsfenster:</strong> Wie weit im Voraus buchbar</li>
                <li>• <strong>Mindestaufenthalt:</strong> Minimum Anzahl Nächte</li>
                <li>• <strong>Maximaler Aufenthalt:</strong> Maximum Anzahl Nächte</li>
                <li>• <strong>Stornierungsfrist:</strong> Bis wann stornierbar</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🛡️ Sicherheitseinstellungen</h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li>• <strong>Passwort-Policy:</strong> Mindestanforderungen</li>
                <li>• <strong>Session-Timeout:</strong> Automatische Abmeldung</li>
                <li>• <strong>Login-Versuche:</strong> Sperren nach X Versuchen</li>
                <li>• <strong>2FA:</strong> Zwei-Faktor-Authentifizierung</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400 mt-6">
            <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Wichtige Hinweise</h3>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• <strong>Backup:</strong> Regelmäßige Datensicherung einrichten</li>
              <li>• <strong>Updates:</strong> System regelmäßig aktualisieren</li>
              <li>• <strong>Monitoring:</strong> Systemleistung überwachen</li>
              <li>• <strong>Support:</strong> Bei Problemen technischen Support kontaktieren</li>
            </ul>
          </div>
        </section>

        {/* Admin Support */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🆘 Administrator-Support</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📞 Technischer Support</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>E-Mail:</strong> admin-support@buchungsplattform.local</li>
                <li>• <strong>Dokumentation:</strong> Vollständige Admin-Dokumentation verfügbar</li>
                <li>• <strong>Updates:</strong> Benachrichtigung bei neuen Versionen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📚 Weiterführende Ressourcen</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>API-Dokumentation:</strong> Für erweiterte Integration</li>
                <li>• <strong>Backup-Strategien:</strong> Best Practices für Sicherung</li>
                <li>• <strong>Troubleshooting:</strong> Häufige Probleme und Lösungen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}