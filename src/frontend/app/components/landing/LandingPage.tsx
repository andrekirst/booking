'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/jwt';
import HeroSection from './HeroSection';
import LoginCard from './LoginCard';
import FeatureHighlights from './FeatureHighlights';

export default function LandingPage() {
  const router = useRouter();
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      if (isAuthenticated()) {
        // Redirect authenticated users to bookings
        router.push('/bookings');
        return;
      }
      setIsCheckingAuth(false);
    };

    // Small delay to prevent flash of content
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  const handleLoginClick = () => {
    setIsLoginVisible(true);
  };

  const handleLoginClose = () => {
    setIsLoginVisible(false);
  };

  const handleLoginSuccess = () => {
    setIsLoginVisible(false);
    // Redirect to bookings after successful login
    router.push('/bookings');
  };

  // Show loader while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-teal-900/80 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-white font-medium">Wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="relative">
      {/* Hero Section */}
      <HeroSection onLoginClick={handleLoginClick} />

      {/* Features Section */}
      <FeatureHighlights />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-4">
                Garten Buchungssystem
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Ihr persönliches Buchungssystem für unvergessliche 
                Familienübernachtungen im Grünen.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={handleLoginClick}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Anmelden
                  </button>
                </li>
                <li>
                  <a
                    href="/register"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Registrieren
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      featuresSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Funktionen
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontakt & Hilfe</h4>
              <div className="text-gray-400 space-y-2">
                <p>Bei Fragen zur Buchung oder technischen Problemen:</p>
                <p className="text-emerald-400 font-medium">
                  Wenden Sie sich an Ihren Administrator
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Garten Buchungssystem. 
              Für die Familie entwickelt.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginCard
        isVisible={isLoginVisible}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Hidden trigger for features section CTA */}
      <button
        data-login-trigger
        onClick={handleLoginClick}
        className="hidden"
        aria-hidden="true"
      />
    </main>
  );
}