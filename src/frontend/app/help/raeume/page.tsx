'use client';

import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function RaeumetPage() {
  return (
    <DocumentationLayout
      title="🏨 Räume und Schlafplätze"
      breadcrumbs={[{ title: 'Räume und Schlafplätze' }]}
      prevPage={{ title: 'Buchungen verwalten', href: '/help/buchungen' }}
      nextPage={{ title: 'Administration', href: '/help/administration' }}
    >
      <div className="space-y-8">
        {/* Übersicht */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🏠 Übersicht der verfügbaren Räume
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400 mb-6">
            <p className="text-blue-800">
              Hier finden Sie alle verfügbaren Schlafmöglichkeiten im Garten. Jeder Raum hat eine begrenzte Kapazität 
              und verschiedene Ausstattungsmerkmale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Beispiel-Räume */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🛏️</span>
                <h3 className="font-semibold text-gray-900">Schlafzimmer 1</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Typ:</strong> Doppelzimmer</p>
                <p><strong>Kapazität:</strong> 2 Personen</p>
                <p><strong>Ausstattung:</strong> Doppelbett, Schrank, Nachttisch</p>
                <div className="mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs inline-block">
                  ✅ Verfügbar
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🏠</span>
                <h3 className="font-semibold text-gray-900">Schlafzimmer 2</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Typ:</strong> Familienzimmer</p>
                <p><strong>Kapazität:</strong> 4 Personen</p>
                <p><strong>Ausstattung:</strong> 2x Einzelbett, 1x Doppelbett</p>
                <div className="mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs inline-block">
                  ✅ Verfügbar
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🏕️</span>
                <h3 className="font-semibold text-gray-900">Zeltplatz</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Typ:</strong> Outdoor-Bereich</p>
                <p><strong>Kapazität:</strong> 6 Personen</p>
                <p><strong>Ausstattung:</strong> Stromanschluss, Wasserzugang</p>
                <div className="mt-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs inline-block">
                  ⚠️ Wetterabhängig
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Raumauswahl */}
        <section id="auswahl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🔍 Raumdetails anzeigen
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Bei der Buchungserstellung können Sie detaillierte Informationen zu jedem Raum einsehen:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Verfügbare Informationen</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>Raumtyp:</strong> Schlafzimmer, Zelt, etc.</li>
                  <li>• <strong>Maximale Kapazität:</strong> Anzahl Personen</li>
                  <li>• <strong>Ausstattung:</strong> Betten, Möbel, Extras</li>
                  <li>• <strong>Besonderheiten:</strong> Barrierefreiheit, etc.</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Auswahlhilfen</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>Verfügbarkeitsstatus:</strong> Farbliche Kennzeichnung</li>
                  <li>• <strong>Empfehlungen:</strong> Passende Räume werden hervorgehoben</li>
                  <li>• <strong>Kombinationen:</strong> Mehrere Räume gleichzeitig wählbar</li>
                  <li>• <strong>Kapazitätsprüfung:</strong> Automatische Validierung</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Verfügbarkeit */}
        <section id="verfügbarkeit">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📊 Verfügbarkeit prüfen
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🟢 Verfügbarkeitsstatus</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm"><strong>Verfügbar:</strong> Raum ist frei buchbar</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
                  <span className="text-sm"><strong>Teilweise belegt:</strong> An anderen Tagen belegt</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-sm"><strong>Nicht verfügbar:</strong> Vollständig belegt</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                  <span className="text-sm"><strong>Gesperrt:</strong> In Wartung oder gesperrt</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📅 Verfügbarkeitsprüfung</h3>
              <ul className="text-gray-700 text-sm space-y-2">
                <li>• <strong>Automatisch:</strong> Bei Datumswahl wird geprüft</li>
                <li>• <strong>Real-time:</strong> Aktuelle Buchungen berücksichtigt</li>
                <li>• <strong>Alternativen:</strong> Ähnliche Räume werden vorgeschlagen</li>
                <li>• <strong>Flexible Daten:</strong> Alternative Termine angezeigt</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tipp für bessere Verfügbarkeit</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Frühzeitig buchen:</strong> Beliebte Termine sind schnell vergeben</li>
              <li>• <strong>Flexible Daten:</strong> Verschiedene Zeiträume ausprobieren</li>
              <li>• <strong>Alternative Räume:</strong> Ähnliche Optionen in Betracht ziehen</li>
              <li>• <strong>Rücksprache:</strong> Bei Problemen Administrator kontaktieren</li>
            </ul>
          </div>
        </section>

        {/* Raumkombinationen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🏘️ Raumkombinationen
          </h2>
          
          <p className="text-gray-700 mb-6">
            Für größere Gruppen können mehrere Räume gleichzeitig gebucht werden:
          </p>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">👨‍👩‍👧 Kleine Familie (2-4 Personen)</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Schlafzimmer 1 (2 Personen)</li>
                  <li>• Oder Schlafzimmer 2 (4 Personen)</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">👨‍👩‍👧‍👦 Große Familie (5-8 Personen)</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Schlafzimmer 1 + 2 (6 Personen)</li>
                  <li>• Plus Zeltplatz für Kinder</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🎉 Familienfeier (8+ Personen)</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Alle Räume kombinieren</li>
                  <li>• Zeltplatz für Überlauf</li>
                  <li>• Koordination mit Administrator</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Besondere Räume */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ♿ Besondere Räume und Ausstattung
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">✨ Zusätzliche Ausstattung</h3>
              <ul className="text-green-800 text-sm space-y-2">
                <li>• <strong>Babybett:</strong> Auf Anfrage verfügbar</li>
                <li>• <strong>Hochstuhl:</strong> Für kleine Kinder</li>
                <li>• <strong>Bettwäsche:</strong> Kann gestellt werden</li>
                <li>• <strong>Handtücher:</strong> Nach Absprache</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">♿ Barrierefreiheit</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li>• <strong>Ebenerdig:</strong> Schlafzimmer 1 rollstuhlgerecht</li>
                <li>• <strong>Breite Türen:</strong> Rollstuhlzugang möglich</li>
                <li>• <strong>Badezimmer:</strong> Behindertengerecht</li>
                <li>• <strong>Rampen:</strong> Zugang ohne Stufen</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400 mt-6">
            <p className="text-yellow-800 text-sm">
              <strong>💡 Tipp:</strong> Besondere Wünsche und Anforderungen können Sie im Notizen-Feld 
              bei der Buchung angeben oder direkt mit dem Administrator besprechen.
            </p>
          </div>
        </section>

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-green-900 mb-3">🎯 Nächste Schritte</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/help/buchungen#erstellen" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 text-xl mb-2">📅</div>
              <h4 className="font-medium text-green-900">Buchung erstellen</h4>
              <p className="text-sm text-green-700 mt-1">Jetzt eine Buchung mit Ihren Wunschräumen erstellen</p>
            </Link>
            
            <Link 
              href="/help/faq" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 text-xl mb-2">❓</div>
              <h4 className="font-medium text-green-900">Häufige Fragen</h4>
              <p className="text-sm text-green-700 mt-1">Antworten zu Räumen und Verfügbarkeit</p>
            </Link>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}