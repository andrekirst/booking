import HelpButton from '@/components/ui/HelpButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-800">
            Garten Buchungssystem
          </h1>
          <HelpButton topic="home" variant="icon" size="lg" className="ml-4" />
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center mb-6">
            Willkommen beim Buchungssystem für Familienübernachtungen im Garten.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Funktionen (in Entwicklung)
              </h2>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Buchung von Übernachtungen</li>
                <li>Verwaltung von Räumen und Schlafplätzen</li>
                <li>Benutzeranmeldung und -registrierung</li>
                <li>Administratorverwaltung</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-green-900">
                  Anmeldung
                </h2>
                <HelpButton topic="login" variant="text" size="sm" />
              </div>
              <p className="text-green-800 mb-4">
                Melden Sie sich an, um das Buchungssystem zu nutzen.
              </p>
              <a
                href="/login"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Zur Anmeldung
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}