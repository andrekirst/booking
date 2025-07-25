import DocumentationLayout from '@/components/docs/DocumentationLayout';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <DocumentationLayout
      title="Häufige Fragen (FAQ)"
      breadcrumbs={[{ title: 'FAQ' }]}
      prevPage={{ title: 'Administration', href: '/help/administration' }}
      nextPage={{ title: 'Übersicht', href: '/help' }}
    >
      <div className="space-y-12">
        {/* Intro */}
        <div className="border-l-4 border-gray-300 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Schnelle Antworten auf häufige Fragen
          </h2>
          <p className="text-gray-700">
            Hier finden Sie Lösungen für die häufigsten Probleme und Fragen zur Buchungsplattform.
          </p>
        </div>

        {/* Anmeldung & Registrierung */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Anmeldung & Registrierung</h3>
          <div className="space-y-6">
            
            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Warum kann ich mich nicht anmelden?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Überprüfen Sie zunächst Ihre E-Mail-Adresse und Ihr Passwort. Häufige Ursachen: 1) E-Mail nicht verifiziert - prüfen Sie Ihren Posteingang, 2) Konto noch nicht freigeschaltet - warten Sie auf Administrator-Freigabe, 3) Falsches Passwort - nutzen Sie "Passwort vergessen", 4) Konto gesperrt - kontaktieren Sie den Administrator.
              </p>
            </div>

            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Ich habe keine Bestätigungs-E-Mail erhalten</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Prüfen Sie zunächst Ihren Spam-Ordner. Falls die E-Mail nicht da ist: 1) Klicken Sie auf "E-Mail erneut senden", 2) Warten Sie 2-3 Minuten, 3) Prüfen Sie die E-Mail-Adresse auf Tippfehler, 4) Kontaktieren Sie bei weiterhin Problemen den Administrator.
              </p>
            </div>

          </div>
        </section>

        {/* Buchungen */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Buchungen</h3>
          <div className="space-y-6">
            
            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Warum kann ich keine Buchung erstellen?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Mögliche Ursachen: 1) Ihr Konto ist noch nicht freigeschaltet, 2) Alle gewünschten Räume sind belegt, 3) Ungültiger Datumsbereich (Vergangenheit, zu lang), 4) Technischer Fehler - laden Sie die Seite neu.
              </p>
            </div>

            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Kann ich eine bestätigte Buchung noch ändern?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Bestätigte Buchungen können nicht mehr selbst bearbeitet werden. Kontaktieren Sie den Administrator mit Ihrer Buchungsnummer und dem Änderungswunsch. Begründen Sie die Änderung - bei wichtigen Gründen ist eine Anpassung meist möglich.
              </p>
            </div>

            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Wie lange dauert es, bis meine Buchung bestätigt wird?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Die Bestätigung erfolgt durch einen Administrator und dauert normalerweise 1-3 Werktage. Sie erhalten eine E-Mail-Benachrichtigung. Bei dringenden Buchungen kontaktieren Sie den Administrator direkt.
              </p>
            </div>

          </div>
        </section>

        {/* Räume & Verfügbarkeit */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Räume & Verfügbarkeit</h3>
          <div className="space-y-6">
            
            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Warum werden nicht alle Räume angezeigt?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Räume werden nur angezeigt, wenn sie für Ihren gewählten Zeitraum verfügbar sind. Ändern Sie den Datumsbereich oder wählen Sie alternative Termine. Gesperrte oder in Wartung befindliche Räume werden nicht angezeigt.
              </p>
            </div>

            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Kann ich mehr Personen unterbringen als die Kapazität angibt?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Nein, die maximale Kapazität ist bindend und kann nicht überschritten werden. Dies dient der Sicherheit und dem Komfort. Buchen Sie zusätzliche Räume oder reduzieren Sie die Personenzahl.
              </p>
            </div>

          </div>
        </section>

        {/* Technische Probleme */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Technische Probleme</h3>
          <div className="space-y-6">
            
            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Die Seite lädt sehr langsam oder gar nicht</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Lösungsschritte: 1) Prüfen Sie Ihre Internetverbindung, 2) Laden Sie die Seite neu (F5), 3) Leeren Sie den Browser-Cache, 4) Versuchen Sie einen anderen Browser, 5) Prüfen Sie auf Browser-Updates. Bei anhaltenden Problemen kontaktieren Sie den Support.
              </p>
            </div>

            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Welche Browser werden unterstützt?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Unterstützte Browser: Chrome (ab Version 90), Firefox (ab Version 88), Safari (ab Version 14), Edge (ab Version 90). Mobile Browser: iOS Safari, Android Chrome. Internet Explorer wird nicht unterstützt.
              </p>
            </div>

          </div>
        </section>

        {/* Administration */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Administration</h3>
          <div className="space-y-6">
            
            <div className="border-l-4 border-gray-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">Wie werde ich Administrator?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Administrator-Rechte werden nur von bestehenden Administratoren vergeben. Kontaktieren Sie einen Administrator mit einer Begründung, warum Sie Admin-Rechte benötigen. Dies ist meist nur für technische Betreuer oder Familienoberhäupter relevant.
              </p>
            </div>

          </div>
        </section>

        {/* Support Contact */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weitere Hilfe benötigt?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Direkte Hilfe</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>E-Mail: support@buchungsplattform.local</li>
                <li>Administrator: Für Freischaltungen und Genehmigungen</li>
                <li>Telefon: Bei kritischen/dringenden Problemen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Weitere Dokumentation</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>Vollständiges Handbuch: Alle Funktionen erklärt</li>
                <li>Video-Tutorials: Schritt-für-Schritt Anleitungen</li>
                <li>Kontexthilfe: ?-Buttons in der Anwendung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}