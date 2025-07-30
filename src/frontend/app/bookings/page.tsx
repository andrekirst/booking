'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Booking, BookingStatus } from '../../lib/types/api';
import { apiClient } from '../../lib/api/client';
import CreateBookingButton from '../components/CreateBookingButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { UserMenuDropdown } from '../components/ui/UserMenuDropdown';
import { getCurrentUser } from '../../lib/auth/jwt';
import ViewToggle, { useViewMode } from '../components/ViewToggle';
import BookingCalendarView from '../components/BookingCalendarView';
import BookingListView from '../components/BookingListView';
import CalendarViewSkeleton from '../components/CalendarViewSkeleton';
import CompactBookingListSkeleton from '../components/CompactBookingListSkeleton';
import BookingCardSkeleton from '../components/BookingCardSkeleton';
import BookingStatusFilter from '../components/BookingStatusFilter';

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
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null);

  const fetchBookings = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsFilterLoading(true);
    }
    setError(null);

    try {
      const data = await apiClient.getBookings(statusFilter ?? undefined);
      setBookings(data);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Buchungen:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message: string }).message) 
        : 'Fehler beim Laden der Buchungen';
      setError(errorMessage);
      
      // Handle authentication errors
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        router.push('/');
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsFilterLoading(false);
      }
    }
  }, [statusFilter, router]);

  // Initial load - only once
  useEffect(() => {
    checkUserRole();
    setCurrentUser(getCurrentUser());
    fetchBookings(true);
  }, [fetchBookings]);

  // Status filter changes - only fetch bookings
  useEffect(() => {
    if (statusFilter !== null || bookings.length > 0) {
      fetchBookings(false);
    }
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusFilterChange = (status: BookingStatus | null) => {
    setStatusFilter(status);
  };

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
    router.push('/');
  };

  const handleCreateBooking = () => {
    router.push('/bookings/new');
  };

  const handleProfileClick = () => {
    // TODO: Navigate to profile page when implemented
    console.log('Profile clicked');
  };

  const handleAdminClick = () => {
    router.push('/admin');
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
      await fetchBookings(false); // Refresh bookings to show updated status
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
      await fetchBookings(false); // Refresh bookings to show updated status
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Meine Buchungen
              </h1>
              <p className="text-lg text-gray-600">
                Verwalten Sie Ihre Garten-Buchungen
              </p>
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
              {currentUser && (
                <UserMenuDropdown
                  userInfo={currentUser}
                  onLogout={handleLogout}
                  onProfileClick={handleProfileClick}
                  onAdminClick={handleAdminClick}
                  position="bottom-right"
                />
              )}
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

          {/* Status Filter */}
          <div className="relative">
            <BookingStatusFilter
              currentStatus={statusFilter}
              onStatusChange={handleStatusFilterChange}
            />
            {isFilterLoading && (
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

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