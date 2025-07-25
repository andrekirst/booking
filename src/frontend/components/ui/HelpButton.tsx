'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HelpButtonProps {
  /** Specific help topic/anchor for direct linking */
  topic?: string;
  /** Show as icon only (compact) or with text */
  variant?: 'icon' | 'text' | 'full';
  /** Size of the help button */
  size?: 'sm' | 'md' | 'lg';
  /** Position for floating help buttons */
  position?: 'inline' | 'fixed-bottom-right';
  /** Additional CSS classes */
  className?: string;
}

// BookStack URL configuration
const BOOKSTACK_BASE_URL = 'http://localhost:6875';

const helpTopics = {
  // Landing page
  'home': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch`, title: 'Benutzerhandbuch' },
  
  // Authentication
  'login': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/erste-schritte#anmeldung`, title: 'Anmeldung' },
  'register': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/erste-schritte#registrierung`, title: 'Registrierung' },
  'email-verification': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/erste-schritte#email-verifizierung`, title: 'E-Mail-Verifizierung' },
  'admin-approval': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/erste-schritte#administrator-freigabe`, title: 'Administrator-Freigabe' },
  
  // Bookings
  'booking-create': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#erstellen`, title: 'Buchung erstellen' },
  'booking-edit': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#bearbeiten`, title: 'Buchung bearbeiten' },
  'booking-cancel': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#stornieren`, title: 'Buchung stornieren' },
  'booking-overview': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#uebersicht`, title: 'Buchungsübersicht' },
  'booking-list-view': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#listenansicht`, title: 'Listenansicht' },
  'booking-calendar-view': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#kalenderansicht`, title: 'Kalenderansicht' },
  'view-toggle': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#ansichtsmodi`, title: 'Ansicht wechseln' },
  'booking-status': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/buchungen#status`, title: 'Buchungsstatus' },
  
  // Rooms  
  'rooms': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/raeume`, title: 'Räume und Schlafplätze' },
  'room-selection': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/raeume#auswahl`, title: 'Raumauswahl' },
  'availability': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/raeume#verfügbarkeit`, title: 'Verfügbarkeit prüfen' },
  
  // Administration
  'admin': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration`, title: 'Administration' },
  'admin-dashboard': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#dashboard`, title: 'Admin-Dashboard' },
  'user-management': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#benutzerverwaltung`, title: 'Benutzerverwaltung' },
  'user-approval': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#freischaltung`, title: 'Benutzer freischalten' },
  'email-settings': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#email-konfiguration`, title: 'E-Mail-Einstellungen' },
  'smtp-config': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#smtp-konfiguration`, title: 'SMTP-Konfiguration' },
  'booking-management': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/administration#buchungsmanagement`, title: 'Buchungsmanagement' },
  
  // FAQ and troubleshooting
  'faq': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/faq`, title: 'Häufige Fragen' },
  'troubleshooting': { url: `${BOOKSTACK_BASE_URL}/books/benutzerhandbuch/chapter/faq#fehlerbehebung`, title: 'Fehlerbehebung' },
};

export default function HelpButton({ 
  topic = 'home', 
  variant = 'icon', 
  size = 'md',
  position = 'inline',
  className = '' 
}: HelpButtonProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const helpInfo = helpTopics[topic as keyof typeof helpTopics] || helpTopics.home;
  
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm', 
    lg: 'w-10 h-10 text-base'
  };
  
  // Button base classes
  const baseClasses = `
    inline-flex items-center justify-center
    bg-blue-100 hover:bg-blue-200 
    text-blue-700 hover:text-blue-800
    border border-blue-300 hover:border-blue-400
    rounded-full transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${sizeClasses[size]}
  `;
  
  // Position-specific classes
  const positionClasses = position === 'fixed-bottom-right' 
    ? 'fixed bottom-4 right-4 z-50 shadow-lg hover:shadow-xl'
    : '';
  
  const buttonClasses = `${baseClasses} ${positionClasses} ${className}`;
  
  const renderButton = () => {
    switch (variant) {
      case 'text':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-md border border-blue-300 hover:border-blue-400 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hilfe
          </span>
        );
        
      case 'full':
        return (
          <span className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Benutzerhandbuch
          </span>
        );
        
      default: // icon
        return (
          <span className={buttonClasses}>
            <svg className="w-full h-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        );
    }
  };
  
  return (
    <div className={`relative ${position === 'fixed-bottom-right' ? '' : 'inline-block'}`}>
      <Link
        href={helpInfo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        title={`Hilfe: ${helpInfo.title}`}
        aria-label={`Hilfe öffnen: ${helpInfo.title}`}
      >
        {renderButton()}
      </Link>
      
      {/* Tooltip */}
      {isTooltipVisible && position !== 'fixed-bottom-right' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
          {helpInfo.title}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}