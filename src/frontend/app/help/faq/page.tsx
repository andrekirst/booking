'use client';

import DocumentationLayout from '@/components/docs/DocumentationLayout';
import { useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'anmeldung' | 'buchung' | 'raeume' | 'admin' | 'technisch';
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'anmeldung',
    question: 'Warum kann ich mich nicht anmelden?',
    answer: 'Überprüfen Sie zunächst Ihre E-Mail-Adresse und Ihr Passwort. Häufige Ursachen: 1) E-Mail nicht verifiziert - prüfen Sie Ihren Posteingang, 2) Konto noch nicht freigeschaltet - warten Sie auf Administrator-Freigabe, 3) Falsches Passwort - nutzen Sie "Passwort vergessen", 4) Konto gesperrt - kontaktieren Sie den Administrator.',
    tags: ['anmeldung', 'passwort', 'freischaltung']
  },
  {
    id: '2',
    category: 'anmeldung',
    question: 'Ich habe keine Bestätigungs-E-Mail erhalten',
    answer: 'Prüfen Sie zunächst Ihren Spam-Ordner. Falls die E-Mail nicht da ist: 1) Klicken Sie auf "E-Mail erneut senden", 2) Warten Sie 2-3 Minuten, 3) Prüfen Sie die E-Mail-Adresse auf Tippfehler, 4) Kontaktieren Sie bei weiterhin Problemen den Administrator.',
    tags: ['email', 'verifizierung', 'spam']
  },
  {
    id: '3',
    category: 'buchung',
    question: 'Warum kann ich keine Buchung erstellen?',
    answer: 'Mögliche Ursachen: 1) Ihr Konto ist noch nicht freigeschaltet, 2) Alle gewünschten Räume sind belegt, 3) Ungültiger Datumsbereich (Vergangenheit, zu lang), 4) Technischer Fehler - laden Sie die Seite neu.',
    tags: ['buchung', 'erstellen', 'fehler']
  },
  {
    id: '4',
    category: 'buchung',
    question: 'Kann ich eine bestätigte Buchung noch ändern?',
    answer: 'Bestätigte Buchungen können nicht mehr selbst bearbeitet werden. Kontaktieren Sie den Administrator mit Ihrer Buchungsnummer und dem Änderungswunsch. Begründen Sie die Änderung - bei wichtigen Gründen ist eine Anpassung meist möglich.',
    tags: ['buchung', 'ändern', 'bestätigt']
  },
  {
    id: '5',
    category: 'buchung',
    question: 'Wie lange dauert es, bis meine Buchung bestätigt wird?',
    answer: 'Die Bestätigung erfolgt durch einen Administrator und dauert normalerweise 1-3 Werktage. Sie erhalten eine E-Mail-Benachrichtigung. Bei dringenden Buchungen kontaktieren Sie den Administrator direkt.',
    tags: ['buchung', 'bestätigung', 'dauer', 'admin']
  },
  {
    id: '6',
    category: 'raeume',
    question: 'Warum werden nicht alle Räume angezeigt?',
    answer: 'Räume werden nur angezeigt, wenn sie für Ihren gewählten Zeitraum verfügbar sind. Ändern Sie den Datumsbereich oder wählen Sie alternative Termine. Gesperrte oder in Wartung befindliche Räume werden nicht angezeigt.',
    tags: ['räume', 'verfügbarkeit', 'datum']
  },
  {
    id: '7',
    category: 'raeume',
    question: 'Kann ich mehr Personen unterbringen als die Kapazität angibt?',
    answer: 'Nein, die maximale Kapazität ist bindend und kann nicht überschritten werden. Dies dient der Sicherheit und dem Komfort. Buchen Sie zusätzliche Räume oder reduzieren Sie die Personenzahl.',
    tags: ['räume', 'kapazität', 'personen']
  },
  {
    id: '8',
    category: 'technisch',
    question: 'Die Seite lädt sehr langsam oder gar nicht',
    answer: 'Lösungsschritte: 1) Prüfen Sie Ihre Internetverbindung, 2) Laden Sie die Seite neu (F5), 3) Leeren Sie den Browser-Cache, 4) Versuchen Sie einen anderen Browser, 5) Prüfen Sie auf Browser-Updates. Bei anhaltenden Problemen kontaktieren Sie den Support.',
    tags: ['technisch', 'performance', 'browser']
  },
  {
    id: '9',
    category: 'technisch',
    question: 'Welche Browser werden unterstützt?',
    answer: 'Unterstützte Browser: Chrome (ab Version 90), Firefox (ab Version 88), Safari (ab Version 14), Edge (ab Version 90). Mobile Browser: iOS Safari, Android Chrome. Internet Explorer wird nicht unterstützt.',
    tags: ['browser', 'kompatibilität', 'mobile']
  },
  {
    id: '10',
    category: 'admin',
    question: 'Wie werde ich Administrator?',
    answer: 'Administrator-Rechte werden nur von bestehenden Administratoren vergeben. Kontaktieren Sie einen Administrator mit einer Begründung, warum Sie Admin-Rechte benötigen. Dies ist meist nur für technische Betreuer oder Familienoberhäupter relevant.',
    tags: ['admin', 'berechtigung', 'rechte']
  }
];

const categories = {
  anmeldung: { name: 'Anmeldung & Registrierung', icon: '🔐', color: 'blue' },
  buchung: { name: 'Buchungen', icon: '📅', color: 'green' },
  raeume: { name: 'Räume & Verfügbarkeit', icon: '🏨', color: 'purple' },
  admin: { name: 'Administration', icon: '⚙️', color: 'red' },
  technisch: { name: 'Technische Probleme', icon: '🔧', color: 'orange' }
};

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <DocumentationLayout
      title="🆘 Häufige Fragen (FAQ)"
      breadcrumbs={[{ title: 'FAQ' }]}
      prevPage={{ title: 'Administration', href: '/help/administration' }}
      nextPage={{ title: 'Übersicht', href: '/help' }}
    >
      <div className="space-y-8">
        {/* Intro */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            ❓ Schnelle Antworten auf häufige Fragen
          </h2>
          <p className="text-blue-800">
            Hier finden Sie Lösungen für die häufigsten Probleme und Fragen zur Buchungsplattform. 
            Nutzen Sie die Suche oder Kategorien um schnell die richtige Antwort zu finden.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Suche in FAQ
              </label>
              <input
                id="search"
                type="text"
                placeholder="Stichwort eingeben..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                📂 Kategorie
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Kategorien</option>
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-gray-200 text-gray-900' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle ({faqData.length})
            </button>
            {Object.entries(categories).map(([key, cat]) => {
              const count = faqData.filter(faq => faq.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === key 
                      ? `bg-${cat.color}-200 text-${cat.color}-900` 
                      : `bg-${cat.color}-100 text-${cat.color}-700 hover:bg-${cat.color}-200`
                  }`}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="mb-4 text-sm text-gray-600">
            {filteredFAQs.length} Ergebnis{filteredFAQs.length !== 1 ? 'se' : ''} gefunden
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="bg-yellow-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Keine Ergebnisse gefunden</h3>
              <p className="text-yellow-800 mb-4">
                Versuchen Sie andere Suchbegriffe oder wählen Sie eine andere Kategorie.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center px-4 py-2 bg-yellow-200 text-yellow-900 rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Suche zurücksetzen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const category = categories[faq.category];
                const isExpanded = expandedItems.has(faq.id);
                
                return (
                  <div key={faq.id} className="bg-white rounded-lg border shadow-sm">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-800 mr-3`}>
                              {category.icon} {category.name}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {faq.question}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {faq.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className={`w-6 h-6 flex items-center justify-center transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <div className="border-t pt-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Support Contact */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📞 Weitere Hilfe benötigt?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">💬 Direkte Hilfe</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>E-Mail:</strong> support@buchungsplattform.local</li>
                <li>• <strong>Administrator:</strong> Für Freischaltungen und Genehmigungen</li>
                <li>• <strong>Telefon:</strong> Bei kritischen/dringenden Problemen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">📖 Weitere Dokumentation</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>Vollständiges Handbuch:</strong> Alle Funktionen erklärt</li>
                <li>• <strong>Video-Tutorials:</strong> Schritt-für-Schritt Anleitungen</li>
                <li>• <strong>Kontexthilfe:</strong> ?-Buttons in der Anwendung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}