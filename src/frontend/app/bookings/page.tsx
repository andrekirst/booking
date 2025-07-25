'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '../../lib/types/api';
import { apiClient } from '../../lib/api/client';
import CreateBookingButton from '../components/CreateBookingButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import HelpButton from '../../components/ui/HelpButton';
import ViewToggle, { useViewMode } from '../components/ViewToggle';
import BookingCalendarView from '../components/BookingCalendarView';
import BookingListView from '../components/BookingListView';
import CalendarViewSkeleton from '../components/CalendarViewSkeleton';
import CompactBookingListSkeleton from '../components/CompactBookingListSkeleton';
import BookingCardSkeleton from '../components/BookingCardSkeleton';

// Smooth view transition container
interface ViewTransitionContainerProps {
  children: React.ReactNode;
  viewKey: string;
}

function ViewTransitionContainer({ children, viewKey }: ViewTransitionContainerProps) {
  const [currentKey, setCurrentKey] = useState(viewKey);
  const [currentContent, setCurrentContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (viewKey !== currentKey) {
      setIsTransitioning(true);
      
      // First fade-out current content
      const fadeOutTimer = setTimeout(() => {
        // Switch content and key after fade-out is complete
        setCurrentContent(children);
        setCurrentKey(viewKey);
        
        // Then fade-in new content
        const fadeInTimer = setTimeout(() => {
          setIsTransitioning(false);
        }, 30); // Small delay to ensure content is switched
        
        return () => clearTimeout(fadeInTimer);
      }, 200); // Duration of fade-out
      
      return () => clearTimeout(fadeOutTimer);
    }
  }, [viewKey, currentKey, children]);

  return (
    <div className="relative min-h-[400px]">
      <div className={`transition-opacity duration-200 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {currentContent}
      </div>
    </div>
  );
}

// BookingCard component has been moved to BookingListView.tsx

export default function BookingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useViewMode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getBookings();
      setBookings(data);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Buchungen:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message: string }).message) 
        : 'Fehler beim Laden der Buchungen';
      setError(errorMessage);
      
      // Handle authentication errors
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    checkUserRole();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUserRole = () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
          setUserRole(role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleCreateBooking = () => {
    router.push('/bookings/new');
  };

  const handleSelectBooking = (booking: Booking) => {
    router.push(`/bookings/${booking.id}`);
  };

  const handleSelectBookingById = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  const handleAcceptBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowAcceptModal(true);
  };

  const handleRejectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowRejectModal(true);
  };

  const confirmAcceptBooking = async () => {
    if (!selectedBookingId) return;
    
    try {
      await apiClient.acceptBooking(selectedBookingId);
      await fetchBookings(); // Refresh bookings to show updated status
    } catch (error) {
      console.error('Error accepting booking:', error);
      setError('Fehler beim Annehmen der Buchung');
    } finally {
      setShowAcceptModal(false);
      setSelectedBookingId(null);
    }
  };

  const confirmRejectBooking = async () => {
    if (!selectedBookingId) return;
    
    try {
      await apiClient.rejectBooking(selectedBookingId);
      await fetchBookings(); // Refresh bookings to show updated status
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setError('Fehler beim Ablehnen der Buchung');
    } finally {
      setShowRejectModal(false);
      setSelectedBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Buchungen werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Meine Buchungen
                </h1>
                <p className="text-lg text-gray-600">
                  Verwalten Sie Ihre Garten-Buchungen
                </p>
              </div>
              <HelpButton topic="booking-overview" variant="text" size="md" className="ml-4" />
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <ViewToggle 
                currentView={viewMode}
                onViewChange={setViewMode}
              />
              <CreateBookingButton
                variant="large"
                onClick={handleCreateBooking}
              />
              {userRole === 'Administrator' && (
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Abmelden
              </button>
            </div>
          </div>
          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="ml-auto inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Neu laden
              </button>
            </div>
          )}

          {/* Main Content */}
          <div>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0v1a2 2 0 002 2h4a2 2 0 002-2V7m-6 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Noch keine Buchungen
                </h3>
                <p className="text-gray-600 mb-6">
                  Sie haben noch keine Buchungen erstellt. Starten Sie mit Ihrer ersten Buchung!
                </p>
                <CreateBookingButton
                  variant="large"
                  onClick={handleCreateBooking}
                />
              </div>
            ) : (
              <>
                {isLoading ? (
                  // Loading Skeletons
                  <>
                    {/* Calendar skeleton view */}
                    <div className={`${
                      viewMode === 'calendar' ? 'block' : 'hidden'
                    }`}>
                      <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 order-2 xl:order-1">
                          <CalendarViewSkeleton />
                        </div>
                        <div className="xl:col-span-1 order-1 xl:order-2">
                          <CompactBookingListSkeleton />
                        </div>
                      </div>
                    </div>

                    {/* List skeleton view */}
                    <div className={`${
                      viewMode === 'list' ? 'block' : 'hidden'
                    }`}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <BookingCardSkeleton key={i} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  // Smooth animated content transition
                  <ViewTransitionContainer viewKey={viewMode}>
                    {viewMode === 'calendar' ? (
                      <BookingCalendarView
                        bookings={bookings}
                        onSelectBooking={handleSelectBooking}
                        onSelectBookingById={handleSelectBookingById}
                        selectedBookingId={selectedBookingId}
                      />
                    ) : (
                      <BookingListView
                        bookings={bookings}
                        userRole={userRole}
                        onAccept={handleAcceptBooking}
                        onReject={handleRejectBooking}
                      />
                    )}
                  </ViewTransitionContainer>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedBookingId(null);
        }}
        onConfirm={confirmAcceptBooking}
        title="Buchung annehmen"
        message="Möchten Sie diese Buchung annehmen? Die Buchung wird dadurch bestätigt und für den Gast freigegeben."
        confirmText="Annehmen"
        cancelText="Abbrechen"
        type="info"
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedBookingId(null);
        }}
        onConfirm={confirmRejectBooking}
        title="Buchung ablehnen"
        message="Möchten Sie diese Buchung ablehnen? Der Gast wird über die Ablehnung informiert."
        confirmText="Ablehnen"
        cancelText="Abbrechen"
        type="danger"
      />
    </div>
  );
}