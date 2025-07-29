'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Prüfe Authentication Status - mit Delay für Client-Side Rendering
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // User ist angemeldet - redirect zu bookings
          router.push('/bookings');
        } else {
          // User ist nicht angemeldet - zeige Landing Page
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Fallback wenn localStorage nicht verfügbar (SSR)
        setIsAuthenticated(false);
      }
    };

    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      // Server-side: zeige erstmal Landing Page
      setIsAuthenticated(false);
    }
  }, [router]);

  // Loading state während Auth-Check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-900">
        <div className="text-white text-xl">Lade...</div>
      </div>
    );
  }

  // Nicht angemeldet - zeige Landing Page
  return <LandingPage />;
}