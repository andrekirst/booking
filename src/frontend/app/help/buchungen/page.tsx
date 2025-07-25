'use client';

import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function BuchungenPage() {
  return (
    <DocumentationLayout
      title="📅 Buchungen verwalten"
      breadcrumbs={[{ title: 'Buchungen verwalten' }]}
      prevPage={{ title: 'Erste Schritte', href: '/help/erste-schritte' }}
      nextPage={{ title: 'Räume und Schlafplätze', href: '/help/raeume' }}
    >
      <div className="space-y-8">
        {/* Übersicht */}
        <section id="uebersicht">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📊 Buchungsübersicht
          </h2>

          {/* Ansichtsmodi */}
          <div id="ansichtsmodi" className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🔄 Ansichtsmodi</h3>
            <p className="text-gray-700 mb-4">
              Die Buchungsplattform bietet zwei verschiedene Ansichtsmodi für Ihre Buchungen:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div id="listenansicht" className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  📋 Listenansicht
                </h4>
                <ul className="text-blue-800 text-sm space-y-2">
                  <li>• <strong>Traditionelle Kartenansicht:</strong> Detaillierte Informationen</li>
                  <li>• <strong>Übersichtlich:</strong> Ideal bei wenigen Buchungen</li>
                  <li>• <strong>Alle Details:</strong> Zeitraum, Status, Räume, Personen</li>
                  <li>• <strong>Aktionsbuttons:</strong> Direkte Bearbeitung möglich</li>
                </ul>
              </div>

              <div id="kalenderansicht" className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  📅 Kalenderansicht
                </h4>
                <ul className="text-green-800 text-sm space-y-2">
                  <li>• <strong>Visuelle Monatsübersicht:</strong> Zeitliche Übersicht</li>
                  <li>• <strong>Schnelles Erfassen:</strong> Belegungen auf einen Blick</li>
                  <li>• <strong>Farbcodierung:</strong> Status-abhängige Farben</li>
                  <li>• <strong>Kompakte Liste:</strong> Rechts neben dem Kalender</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">🔀 Ansicht wechseln:</h4>
              <ol className="space-y-2 text-gray-700 text-sm">
                <li>1. <strong>🔍 Buttons finden:</strong> Rechts oben in der Buchungsübersicht</li>
                <li>2. <strong>📋 Listen-Symbol:</strong> Klicken für Listenansicht</li>
                <li>3. <strong>📅 Kalender-Symbol:</strong> Klicken für Kalenderansicht</li>
                <li>4. <strong>💾 Gespeichert:</strong> Ihre Präferenz wird automatisch gespeichert</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Neue Buchung erstellen */}
        <section id="erstellen">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ➕ Neue Buchung erstellen
          </h2>

          {/* Buchungsformular öffnen */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📝 Buchungsformular öffnen</h3>
            <div className="bg-blue-50 rounded-lg p-6">
              <ol className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">1</span>
                  <span><strong>🔘 Button finden:</strong> "Neue Buchung" in der Navigation oder auf der Übersichtsseite</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">2</span>
                  <span><strong>📄 Formular lädt:</strong> System prüft Verfügbarkeiten</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">3</span>
                  <span><strong>✅ Bereit:</strong> Formular ist ausfüllbereit</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Datum und Zeitraum */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 Datum und Zeitraum wählen</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-3">📍 Anreisedatum</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• <strong>Heute markiert:</strong> Aktueller Tag hervorgehoben</li>
                  <li>• <strong>🚫 Vergangenheit:</strong> Vergangene Tage nicht wählbar</li>
                  <li>• <strong>🔴 Belegt:</strong> Bereits gebuchte Tage markiert</li>
                  <li>• <strong>✅ Verfügbar:</strong> Freie Tage grün</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-3">📅 Abreisedatum</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• <strong>Nach Anreise:</strong> Nur Tage nach Anreise wählbar</li>
                  <li>• <strong>🌙 Automatisch:</strong> Anzahl Nächte wird berechnet</li>
                  <li>• <strong>📊 Anzeige:</strong> Aufenthaltsdauer sichtbar</li>
                  <li>• <strong>⚠️ Mindestens:</strong> 1 Nacht erforderlich</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <h4 className="font-medium text-green-900 mb-2">✨ Automatische Berechnung</h4>
              <div className="bg-white rounded border p-3 text-sm font-mono">
                🌙 Anzahl Nächte: 2<br/>
                📅 Aufenthalt: Fr 01.06. - So 03.06.
              </div>
            </div>
          </div>

          {/* Räume auswählen */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🏨 Räume und Schlafplätze auswählen</h3>
            <p className="text-gray-700 mb-4">
              Nach der Datumswahl werden verfügbare Räume angezeigt:
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">🏨 Beispiel Raumkarte:</h4>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">🛏️ Schlafzimmer 1</h5>
                    <p className="text-sm text-gray-600">Typ: Doppelzimmer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Max. Kapazität: 2 Personen</p>
                    <p className="text-xs text-gray-500">Ausstattung: Doppelbett, Schrank</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 mr-2" />
                    <span className="text-sm font-medium">Raum auswählen</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Personen:</span>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>0</option>
                      <option>1</option>
                      <option>2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3">📋 Auswahlprozess:</h4>
              <ol className="space-y-2 text-blue-800 text-sm">
                <li>1. <strong>☑️ Checkbox:</strong> Aktivieren für gewünschte Räume</li>
                <li>2. <strong>👥 Personenzahl:</strong> Dropdown oder Eingabefeld</li>
                <li>3. <strong>⚠️ Validierung:</strong> System prüft Kapazitätsgrenzen</li>
                <li>4. <strong>➕ Mehrfachauswahl:</strong> Beliebig viele Räume kombinierbar</li>
              </ol>
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📝 Zusätzliche Informationen</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">📝 Notizen-Feld:</h4>
              <div className="bg-white rounded-lg border p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notizen (optional):</label>
                <textarea 
                  className="w-full h-20 border rounded-lg p-3 text-sm resize-none"
                  placeholder="Hier können Sie besondere Wünsche, Anmerkungen oder wichtige Infos hinterlassen..."
                  disabled
                />
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">💡 Nützliche Notizen-Beispiele:</h5>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>🕐 <strong>Ankunft:</strong> "Ankunft erst gegen 20 Uhr"</li>
                  <li>🍼 <strong>Kinder:</strong> "Mit Baby (6 Monate) - Babybett benötigt"</li>
                  <li>♿ <strong>Barrierefreiheit:</strong> "Rollstuhlfahrer dabei"</li>
                  <li>🎉 <strong>Anlass:</strong> "Überraschungsparty für Oma"</li>
                  <li>🐕 <strong>Haustiere:</strong> "Kleiner Hund dabei - ist das okay?"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buchung bestätigen */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">✅ Buchung bestätigen und absenden</h3>
            
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">📋 Buchungszusammenfassung</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <strong className="text-gray-900">📅 Zeitraum:</strong>
                  <div className="ml-4 text-sm text-gray-700">
                    Anreise: Fr, 01.06.2024<br/>
                    Abreise: So, 03.06.2024<br/>
                    Dauer: 2 Nächte
                  </div>
                </div>
                <div>
                  <strong className="text-gray-900">🏨 Gebuchte Räume:</strong>
                  <div className="ml-4 text-sm text-gray-700">
                    • Schlafzimmer 1 (2 Personen)<br/>
                    • Schlafzimmer 2 (4 Personen)
                  </div>
                </div>
                <div>
                  <strong className="text-gray-900">👥 Gesamtpersonen:</strong>
                  <span className="text-gray-700"> 6</span>
                </div>
                <div>
                  <strong className="text-gray-900">📝 Notizen:</strong>
                  <div className="ml-4 text-sm text-gray-700">Familienfeier - Omas Geburtstag</div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  ❌ Abbrechen
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  ✅ Buchen
                </button>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <h4 className="font-medium text-green-900 mb-3">📧 Nach dem Absenden:</h4>
              <ol className="text-green-800 text-sm space-y-1">
                <li>1. <strong>⏳ Verarbeitung:</strong> Kurze Ladezeit</li>
                <li>2. <strong>✅ Erfolgsmeldung:</strong> "Buchung erfolgreich erstellt!"</li>
                <li>3. <strong>📧 E-Mail:</strong> Bestätigung an Ihre E-Mail-Adresse</li>
                <li>4. <strong>🔄 Weiterleitung:</strong> Zur Buchungsübersicht</li>
                <li>5. <strong>⚠️ Status:</strong> Neue Buchung hat Status "Pending"</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Buchungsstatus */}
        <section id="status">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📊 Buchungsstatus verstehen
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Status-Übersicht</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-yellow-800">Pending</div>
                      <div className="text-sm text-yellow-700">Wartet auf Admin-Bestätigung</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-green-800">Confirmed</div>
                      <div className="text-sm text-green-700">Bestätigt und verbindlich</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-800">Cancelled</div>
                      <div className="text-sm text-gray-700">Vom Nutzer storniert</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-red-800">Rejected</div>
                      <div className="text-sm text-red-700">Vom Admin abgelehnt</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Status-Workflow</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Neue Buchung
                  </div>
                </div>
                <div className="text-center text-gray-400">↓</div>
                <div className="text-center">
                  <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    🟡 Pending
                  </div>
                </div>
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">Admin prüft →</div>
                    <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      🟢 Confirmed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">← Admin lehnt ab</div>
                    <div className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      🔴 Rejected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buchung bearbeiten */}
        <section id="bearbeiten">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ✏️ Buchung bearbeiten
          </h2>

          <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-400 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">🔓 Bearbeitbare Buchungen</h3>
            <p className="text-orange-800 text-sm">
              <strong>Nur Buchungen mit Status "Pending" können bearbeitet werden!</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Änderbare Elemente</h3>
              <div className="space-y-3">
                <div className="flex items-center text-green-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs mr-3">✓</span>
                  <span><strong>Datum:</strong> An- und Abreisedatum</span>
                </div>
                <div className="flex items-center text-green-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs mr-3">✓</span>
                  <span><strong>Räume:</strong> Andere oder zusätzliche Räume</span>
                </div>
                <div className="flex items-center text-green-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs mr-3">✓</span>
                  <span><strong>Personen:</strong> Anzahl pro Raum</span>
                </div>
                <div className="flex items-center text-green-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs mr-3">✓</span>
                  <span><strong>Notizen:</strong> Zusätzliche Informationen</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">❌ Nicht änderbar</h3>
              <div className="space-y-3">
                <div className="flex items-center text-red-700">
                  <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs mr-3">✗</span>
                  <span><strong>Bestätigte Buchungen:</strong> Status "Confirmed"</span>
                </div>
                <div className="flex items-center text-red-700">
                  <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs mr-3">✗</span>
                  <span><strong>Vergangene Buchungen:</strong> Bereits abgelaufen</span>
                </div>
                <div className="flex items-center text-red-700">
                  <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs mr-3">✗</span>
                  <span><strong>Stornierte/Abgelehnte:</strong> Status "Cancelled/Rejected"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buchung stornieren */}
        <section id="stornieren">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ❌ Buchung stornieren
          </h2>

          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-400 mb-6">
            <h3 className="font-semibold text-red-900 mb-3">⚠️ Stornierungsprozess</h3>
            <ol className="space-y-2 text-red-800 text-sm">
              <li>1. <strong>📋 Buchung finden:</strong> In der Übersicht</li>
              <li>2. <strong>❌ Button:</strong> "Stornieren" anklicken</li>
              <li>3. <strong>⚠️ Dialog:</strong> Bestätigungsdialog erscheint</li>
              <li>4. <strong>❌ Bestätigen:</strong> "Stornieren" klicken</li>
              <li>5. <strong>✅ Abschluss:</strong> Status ändert sich zu "Cancelled"</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">✅ Pending-Buchungen</h3>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Jederzeit stornierbar</li>
                <li>• Keine Rücksprache nötig</li>
                <li>• Sofort wirksam</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Bestätigte Buchungen</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Administrator kontaktieren</li>
                <li>• Begründung erforderlich</li>
                <li>• Individuelle Entscheidung</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 Nächste Schritte</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/help/raeume" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600 text-xl mb-2">🏨</div>
              <h4 className="font-medium text-blue-900">Räume entdecken</h4>
              <p className="text-sm text-blue-700 mt-1">Alle Schlafplätze kennenlernen</p>
            </Link>
            
            <Link 
              href="/help/faq" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600 text-xl mb-2">❓</div>
              <h4 className="font-medium text-blue-900">FAQ lesen</h4>
              <p className="text-sm text-blue-700 mt-1">Antworten auf häufige Fragen</p>
            </Link>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}