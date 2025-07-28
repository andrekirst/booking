'use client';

interface HeroSectionProps {
  onLoginClick: () => void;
}

export default function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-teal-900/80 z-10"></div>
        {/* Placeholder for garden background - in a real app, this would be an actual image */}
        <div className="w-full h-full bg-gradient-to-br from-green-200 via-emerald-300 to-teal-200"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          Willkommen im{' '}
          <span className="text-emerald-300">Garten</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-emerald-100 mb-8 leading-relaxed drop-shadow-md">
          Ihr persönliches Buchungssystem für unvergessliche 
          <br className="hidden md:block" />
          Familienübernachtungen im Grünen
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onLoginClick}
            className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Jetzt anmelden
          </button>
          
          <button
            onClick={() => {
              const featuresSection = document.getElementById('features');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border-2 border-white/50 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Mehr erfahren
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}