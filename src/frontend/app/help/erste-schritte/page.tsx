import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function ErsteSchrittePage() {
  return (
    <DocumentationLayout
      title="Erste Schritte"
      breadcrumbs={[{ title: 'Erste Schritte' }]}
      prevPage={{ title: 'Einleitung', href: '/help/einleitung' }}
      nextPage={{ title: 'Buchungen verwalten', href: '/help/buchungen' }}
    >
      <div className="space-y-12">
        {/* Anmeldung Section */}
        <section id="anmeldung">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Anmeldung und Registrierung
          </h2>

          {/* Erstmalige Registrierung */}
          <div id="registrierung" className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📝 Erstmalige Registrierung</h3>
            <p className="text-gray-700 mb-4">
              Wenn Sie zum ersten Mal die Buchungsplattform nutzen, müssen Sie sich zunächst registrieren:
            </p>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">Schritt-für-Schritt Anleitung:</h4>
              <ol className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">1</span>
                  <div>
                    <strong>🌐 Website öffnen</strong>
                    <p className="text-sm mt-1">Öffnen Sie die Buchungsplattform in Ihrem Webbrowser</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">2</span>
                  <div>
                    <strong>📋 Registrierungsformular</strong>
                    <p className="text-sm mt-1">Klicken Sie auf "Registrieren" auf der Anmeldeseite</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">3</span>
                  <div>
                    <strong>✍️ Daten eingeben</strong>
                    <div className="bg-white rounded-lg border p-4 mt-2 text-sm">
                      <div className="grid gap-2">
                        <div>📝 <strong>Vorname:</strong> Ihr Vorname</div>
                        <div>📝 <strong>Nachname:</strong> Ihr Nachname</div>
                        <div>📧 <strong>E-Mail:</strong> ihre.email@beispiel.de</div>
                        <div>🔐 <strong>Passwort:</strong> Sicheres Passwort (mindestens 8 Zeichen)</div>
                        <div>🔐 <strong>Passwort wiederholen:</strong> Bestätigung</div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 rounded-full text-sm font-medium mr-3 mt-0.5">4</span>
                  <div>
                    <strong>✅ Registrierung abschließen</strong>
                    <p className="text-sm mt-1">Beachten Sie die Passwort-Stärke-Anzeige und klicken Sie auf "Registrieren"</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Passwort Requirements */}
            <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-900 mb-3">✅ Passwort-Anforderungen</h4>
              <ul className="space-y-1 text-yellow-800 text-sm">
                <li>• Mindestens <strong>8 Zeichen</strong></li>
                <li>• Mindestens <strong>1 Großbuchstabe</strong></li>
                <li>• Mindestens <strong>1 Kleinbuchstabe</strong></li>
                <li>• Mindestens <strong>1 Zahl</strong></li>
                <li>• Mindestens <strong>1 Sonderzeichen</strong> (!, @, #, $, etc.)</li>
              </ul>
            </div>
          </div>

          {/* E-Mail Verifizierung */}
          <div id="email-verifizierung" className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📧 E-Mail-Verifizierung</h3>
            <p className="text-gray-700 mb-4">
              Nach der Registrierung müssen Sie Ihre E-Mail-Adresse verifizieren:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">📬 Schritt 1: E-Mail prüfen</h4>
                <ul className="space-y-2 text-green-800 text-sm">
                  <li>📨 <strong>Posteingang:</strong> Prüfen Sie Ihr E-Mail-Postfach</li>
                  <li>📁 <strong>Spam-Ordner:</strong> Falls keine E-Mail da ist</li>
                  <li>📧 <strong>Betreff:</strong> "E-Mail-Adresse bestätigen"</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">🔗 Schritt 2: Verifizierung</h4>
                <ul className="space-y-2 text-green-800 text-sm">
                  <li>🖱️ <strong>Link klicken:</strong> Bestätigungslink in der E-Mail</li>
                  <li>🌐 <strong>Weiterleitung:</strong> Zur Anwendung</li>
                  <li>✅ <strong>Automatisch:</strong> Verifizierung erfolgt automatisch</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-blue-900 mb-2">🔄 E-Mail erneut senden</h4>
              <p className="text-blue-800 text-sm">
                Falls Sie keine E-Mail erhalten haben, klicken Sie auf "E-Mail erneut senden" und warten Sie 1-2 Minuten.
              </p>
            </div>
          </div>

          {/* Administrator Freigabe */}
          <div id="administrator-freigabe" className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">👑 Administrator-Freigabe</h3>
            <p className="text-gray-700 mb-4">
              Nach der E-Mail-Verifizierung muss Ihr Konto noch freigeschaltet werden:
            </p>

            <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-400">
              <h4 className="font-semibold text-orange-900 mb-4">📋 Ablauf der Freischaltung:</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-semibold mr-4">1</div>
                  <div>
                    <strong className="text-orange-900">🔔 Benachrichtigung:</strong>
                    <p className="text-orange-800 text-sm mt-1">Administrator erhält Info über neue Registrierung</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-semibold mr-4">2</div>
                  <div>
                    <strong className="text-orange-900">👀 Prüfung:</strong>
                    <p className="text-orange-800 text-sm mt-1">Er prüft Ihre Daten und Verifizierungsstatus</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-semibold mr-4">3</div>
                  <div>
                    <strong className="text-orange-900">✅ Freischaltung:</strong>
                    <p className="text-orange-800 text-sm mt-1">Bei Genehmigung wird Ihr Konto aktiviert</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-semibold mr-4">4</div>
                  <div>
                    <strong className="text-orange-900">📧 Benachrichtigung:</strong>
                    <p className="text-orange-800 text-sm mt-1">Sie erhalten eine E-Mail über die Freischaltung</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-semibold mr-4">5</div>
                  <div>
                    <strong className="text-green-900">🎉 Fertig:</strong>
                    <p className="text-green-800 text-sm mt-1">Sie können sich anmelden und buchen!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 mt-4 border-l-4 border-red-400">
              <p className="text-red-800 text-sm">
                <strong>⚠️ Wichtig:</strong> Die Freischaltung kann je nach Verfügbarkeit des Administrators etwas Zeit in Anspruch nehmen. Sie werden per E-Mail benachrichtigt.
              </p>
            </div>
          </div>

          {/* Anmeldung */}
          <div id="anmeldung-email" className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📧 Anmeldung mit E-Mail</h3>
            <p className="text-gray-700 mb-4">
              Für die Anmeldung mit Ihren Registrierungsdaten:
            </p>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Schnelle Anmeldung:</h4>
              <ol className="space-y-2 text-gray-700 text-sm">
                <li>1. <strong>📧 E-Mail eingeben:</strong> Ihre registrierte E-Mail-Adresse</li>
                <li>2. <strong>🔐 Passwort eingeben:</strong> Ihr gewähltes Passwort</li>
                <li>3. <strong>✅ Anmelden klicken:</strong> Sie werden eingeloggt</li>
                <li>4. <strong>🎉 Fertig:</strong> Sie sind in der Anwendung</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Benutzeroberfläche */}
        <section id="benutzeroberflaeche">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🖥️ Übersicht der Benutzeroberfläche
          </h2>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Nach der erfolgreichen Anmeldung sehen Sie das Dashboard mit folgenden Hauptbereichen:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">📊 Hauptnavigation</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• <strong>📅 Buchungen:</strong> Alle Ihre Buchungen</li>
                  <li>• <strong>🏨 Räume:</strong> Verfügbare Schlafplätze</li>
                  <li>• <strong>⚙️ Admin:</strong> Nur für Administratoren</li>
                  <li>• <strong>❓ Hilfe:</strong> Diese Dokumentation</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">🎯 Schnellaktionen</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• <strong>➕ Neue Buchung:</strong> Direkt buchen</li>
                  <li>• <strong>📋 Meine Buchungen:</strong> Übersicht</li>
                  <li>• <strong>📅 Kalender:</strong> Visuelle Darstellung</li>
                  <li>• <strong>🔍 Suche:</strong> Schnell finden</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Kontexthilfe */}
        <section id="kontexthilfe">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ❓ Kontexthilfe verwenden
          </h2>

          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-blue-800 mb-4">
              In der gesamten Anwendung finden Sie Hilfe-Buttons, die Sie direkt zu relevanten Abschnitten dieser Dokumentation führen.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">?</div>
                <h4 className="font-medium text-blue-900">Icon-Hilfe</h4>
                <p className="text-blue-700 text-sm">Kleine Hilfe-Icons</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md mb-2">
                  <span className="w-4 h-4">?</span>
                  <span className="text-sm">Hilfe</span>
                </div>
                <h4 className="font-medium text-blue-900">Text-Hilfe</h4>
                <p className="text-blue-700 text-sm">Button mit Text</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md mb-2">
                  <span className="w-5 h-5">📖</span>
                  <span className="text-sm font-medium">Benutzerhandbuch</span>
                </div>
                <h4 className="font-medium text-blue-900">Vollständige Hilfe</h4>
                <p className="text-blue-700 text-sm">Umfassende Buttons</p>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-green-900 mb-3">🎯 Nächste Schritte</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/help/buchungen" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 text-xl mb-2">📅</div>
              <h4 className="font-medium text-green-900">Buchungen verwalten</h4>
              <p className="text-sm text-green-700 mt-1">Lernen Sie, wie Sie Buchungen erstellen und verwalten</p>
            </Link>
            
            <Link 
              href="/help/raeume" 
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 text-xl mb-2">🏨</div>
              <h4 className="font-medium text-green-900">Räume entdecken</h4>
              <p className="text-sm text-green-700 mt-1">Alle verfügbaren Schlafplätze kennenlernen</p>
            </Link>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}