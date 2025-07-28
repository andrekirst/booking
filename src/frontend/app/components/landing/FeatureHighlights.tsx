'use client';

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Einfache Buchung",
    description: "Buchen Sie Ihre Gartenübernachtung mit nur wenigen Klicks für ein oder mehrere Nächte."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Raumverwaltung",
    description: "Verwalten Sie verschiedene Räume und Schlafplätze für Ihre Familie perfekt organisiert."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    title: "Familiensicher",
    description: "Nur berechtigte Familienmitglieder können Buchungen vornehmen - mit Administratorfreigabe."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Einfache Verwaltung",
    description: "Passen Sie bestehende Buchungen an oder stornieren Sie diese flexibel nach Bedarf."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
    ),
    title: "Naturerlebnis",
    description: "Genießen Sie unvergessliche Nächte im Grünen mit Ihrer Familie in perfekter Atmosphäre."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile-First",
    description: "Perfekt optimiert für alle Geräte - buchen Sie bequem vom Smartphone oder Desktop."
  }
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ihre Vorteile im{' '}
            <span className="text-emerald-600">Überblick</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Unser Buchungssystem macht Familienübernachtungen im Garten so einfach wie nie zuvor.
            Entdecken Sie alle Funktionen, die Ihnen zur Verfügung stehen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-blue-100/20 border border-white/20 hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-300 group hover:scale-105"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-blue-100/20 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Bereit für Ihr Naturerlebnis?
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Melden Sie sich an und beginnen Sie noch heute mit der Buchung 
              Ihrer unvergesslichen Gartenübernachtungen.
            </p>
            <button
              onClick={() => {
                const heroSection = document.querySelector('main');
                heroSection?.scrollIntoView({ behavior: 'smooth' });
                // Trigger login modal after scroll
                setTimeout(() => {
                  const loginButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
                  loginButton?.click();
                }, 500);
              }}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-50"
            >
              Jetzt anmelden
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}