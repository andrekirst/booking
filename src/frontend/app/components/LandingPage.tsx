'use client';

import { useState } from 'react';
import { apiClient } from '../../lib/api/client';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.login({ email, password });
      
      // Token wird automatisch vom ApiClient gespeichert
      // Sofortige Weiterleitung
      window.location.replace('/bookings');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message: string }).message) 
        : 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      {/* Hintergrundbild */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          background: `linear-gradient(135deg, #2d3748 0%, #1a202c 100%)`
        }}
      />
      
      {/* Hauptinhalt */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          
          {/* Willkommenstext - Links */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Willkommen im<br />
              <span className="text-emerald-300">Garten-Buchungssystem</span>
            </h1>
          </div>

          {/* Login-Formular - Rechts */}
          <div className="w-full max-w-md">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 p-8" style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.8), 0 0 60px rgba(59, 130, 246, 0.9)'
            }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Anmelden
              </h2>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="ihre.email@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {error && (
                  <div className="rounded-2xl p-4 bg-red-50 text-red-700 border border-red-200">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Wird angemeldet...
                    </div>
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <a
                  href="/register"
                  className="text-sm text-gray-600 hover:text-gray-700 underline transition-colors"
                >
                  Noch kein Konto? Jetzt registrieren
                </a>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}