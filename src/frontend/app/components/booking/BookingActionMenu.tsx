'use client';

import { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../../lib/types/api';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface BookingActionMenuProps {
  booking: Booking;
  onCancel: () => void;
  onEdit: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function BookingActionMenu({ booking, onCancel, onEdit, onAccept, onReject }: BookingActionMenuProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    // Check if user is admin by parsing JWT token
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
        setIsAdmin(role === 'Administrator');
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        setIsAdmin(false);
      }
    }
  }, []);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleAcceptClick = () => {
    setShowAcceptModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const confirmCancel = () => {
    onCancel();
    setShowCancelModal(false);
  };

  const confirmAccept = () => {
    onAccept?.();
    setShowAcceptModal(false);
  };

  const confirmReject = () => {
    onReject?.();
    setShowRejectModal(false);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
        {/* Admin-only Accept/Reject buttons for Pending bookings */}
        {isAdmin && booking.status === BookingStatus.Pending && (
          <>
            <button
              onClick={handleAcceptClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Annehmen
            </button>
            <button
              onClick={handleRejectClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ablehnen
            </button>
          </>
        )}
        
        {/* Cancel button for non-cancelled bookings */}
        {booking.status !== BookingStatus.Cancelled && booking.status !== BookingStatus.Accepted && booking.status !== BookingStatus.Rejected && (
          <button
            onClick={handleCancelClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stornieren
          </button>
        )}
        
        {/* Edit button */}
        <button
          onClick={onEdit}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-md"
          disabled={booking.status === BookingStatus.Cancelled || booking.status === BookingStatus.Accepted || booking.status === BookingStatus.Rejected}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Bearbeiten
        </button>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Buchung stornieren"
        message="Möchten Sie diese Buchung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Stornieren"
        cancelText="Abbrechen"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={confirmAccept}
        title="Buchung annehmen"
        message="Möchten Sie diese Buchung annehmen? Die Buchung wird dadurch bestätigt und für den Gast freigegeben."
        confirmText="Annehmen"
        cancelText="Abbrechen"
        type="info"
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={confirmReject}
        title="Buchung ablehnen"
        message="Möchten Sie diese Buchung ablehnen? Der Gast wird über die Ablehnung informiert."
        confirmText="Ablehnen"
        cancelText="Abbrechen"
        type="danger"
      />
    </div>
  );
}