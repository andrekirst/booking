import { ThemeToggle } from '@/app/components/ui/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header with Theme Toggle */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Garten Buchungssystem
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
          Willkommen
        </h2>
        
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Willkommen beim Buchungssystem für Familienübernachtungen im Garten.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Funktionen (in Entwicklung)
              </h3>
              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                <li>Buchung von Übernachtungen</li>
                <li>Verwaltung von Räumen und Schlafplätzen</li>
                <li>Benutzeranmeldung und -registrierung</li>
                <li>Administratorverwaltung</li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                Anmeldung
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-4">
                Melden Sie sich an, um das Buchungssystem zu nutzen.
              </p>
              <a
                href="/login"
                className="inline-block bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
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